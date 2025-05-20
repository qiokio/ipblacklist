// IP黑名单系统中间件
import { verify } from '../js/jwt.js';

// API密钥前缀(用于KV存储)
const API_KEY_PREFIX = 'apikey:';
// 日志记录前缀
const LOG_PREFIX = 'log:';

// 需要认证的API路径列表
const AUTH_REQUIRED_PATHS = [
  '/api/blacklist/add',
  '/api/blacklist/remove',
  '/api/blacklist/get',
  '/api/blacklist/check',
  '/api/apikey/create',
  '/api/apikey/list',
  '/api/apikey/update',
  '/api/apikey/delete',
  '/api/logs/list',
  '/api/logs/cleanup'
];

// 不需要认证的API路径列表
const NO_AUTH_REQUIRED_PATHS = [
  '/api/blacklist/check-api',
  '/api/blacklist/get-api',
  '/api/blacklist/add-api',
  '/api/blacklist/remove-api'
];

// API密钥可操作的API路径和所需权限
const API_KEY_PATHS = {
  '/api/blacklist/check-api': 'read',
  '/api/blacklist/get-api': 'list',
  '/api/blacklist/add-api': 'add',
  '/api/blacklist/remove-api': 'delete'
};

// 验证JWT令牌
async function verifyToken(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    return { valid: false, message: '未提供认证令牌' };
  }
  
  try {
    // 从环境变量获取JWT密钥
    const jwtSecret = env.JWT_SECRET || 'your-secret-key';
    
    // 验证JWT令牌
    const payload = verify(token, jwtSecret);
    
    // 检查令牌是否过期
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      return { valid: false, message: '认证令牌已过期' };
    }
    
    return { valid: true, user: payload };
  } catch (error) {
    return { valid: false, message: '无效的认证令牌' };
  }
}

// 验证API密钥并检查权限
async function verifyApiKey(request, env) {
  const url = new URL(request.url);
  const apiKey = url.searchParams.get('key');
  
  if (!apiKey) {
    return { valid: false, message: '未提供API密钥' };
  }
  
  try {
    // 从KV获取API密钥数据 - 使用新的API_KEYS命名空间
    const keyDataStr = await env.API_KEYS.get(`${API_KEY_PREFIX}${apiKey}`);
    if (!keyDataStr) {
      return { valid: false, message: '无效的API密钥' };
    }
    
    const keyData = JSON.parse(keyDataStr);
    
    // 检查密钥是否过期
    if (keyData.expiryDate) {
      const now = new Date();
      const expiryDate = new Date(keyData.expiryDate);
      if (now > expiryDate) {
        return { valid: false, message: 'API密钥已过期' };
      }
    }
    
    return { valid: true, key: keyData };
  } catch (error) {
    return { valid: false, message: '验证API密钥失败' };
  }
}

// 检查API密钥权限
function checkApiKeyPermission(keyData, path) {
  // 获取该路径所需的权限
  const requiredPermission = API_KEY_PATHS[path];
  if (!requiredPermission) {
    return false;
  }
  
  // 检查API密钥是否有所需权限
  return keyData.permissions && keyData.permissions[requiredPermission] === true;
}

// 处理CORS预检请求
function handleOptions(request) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// 记录操作日志
async function logOperation(env, {
  operationType,
  operator,
  details,
  requestIp,
  requestPath,
  status,
  error = null
}) {
  try {
    const timestamp = Date.now();
    const logEntry = {
      timestamp,
      operationType,
      operator,
      details,
      requestIp,
      requestPath,
      status,
      error
    };

    // 使用时间戳作为键的一部分，便于按时间查询
    const logKey = `${LOG_PREFIX}${timestamp}`;
    await env.API_LOGS.put(logKey, JSON.stringify(logEntry));
  } catch (error) {
    console.error('记录日志失败:', error);
  }
}

// 中间件主函数
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  try {
    // 检查KV绑定是否可用
    if (!env.IP_BLACKLIST && (path.startsWith('/api/blacklist/') || path.startsWith('/api/apikey/'))) {
      return new Response(JSON.stringify({
        error: true,
        message: "KV绑定不可用，请确保在Cloudflare Pages中正确配置了KV命名空间绑定"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }

    // 获取请求IP
    const requestIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    // 检查是否为通过API密钥访问的API端点
    const isApiKeyPath = Object.keys(API_KEY_PATHS).some(apiPath => 
      path.startsWith(apiPath)
    );
    
    if (isApiKeyPath) {
      // 验证API密钥
      const keyAuth = await verifyApiKey(request, env);
      if (!keyAuth.valid) {
        // 记录失败的API密钥验证
        await logOperation(env, {
          operationType: 'api_key_verification',
          operator: 'unknown',
          details: { path },
          requestIp,
          requestPath: path,
          status: 'failed',
          error: keyAuth.message
        });

        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: keyAuth.message
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // 检查API密钥权限
      const hasPermission = checkApiKeyPermission(keyAuth.key, path);
      if (!hasPermission) {
        // 记录权限验证失败
        await logOperation(env, {
          operationType: 'permission_check',
          operator: keyAuth.key.id,
          details: { path, requiredPermission: API_KEY_PATHS[path] },
          requestIp,
          requestPath: path,
          status: 'failed',
          error: '权限不足'
        });

        return new Response(JSON.stringify({
          error: 'Forbidden',
          message: '此API密钥没有所需权限'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // 将API密钥信息添加到请求上下文
      context.data = { apiKey: keyAuth.key };
      return next();
    }
    
    // 检查是否为无需认证的路径
    const isNoAuthPath = NO_AUTH_REQUIRED_PATHS.some(authPath => 
      path.startsWith(authPath)
    );
    
    if (isNoAuthPath) {
      // 直接跳过认证
      return next();
    }
    
    // 检查是否需要认证的路径
    const requiresAuth = AUTH_REQUIRED_PATHS.some(authPath => 
      path.startsWith(authPath)
    );
    
    // 如果需要认证，验证令牌
    if (requiresAuth) {
      const auth = await verifyToken(request, env);
      
      if (!auth.valid) {
        // 记录认证失败
        await logOperation(env, {
          operationType: 'authentication',
          operator: 'unknown',
          details: { path },
          requestIp,
          requestPath: path,
          status: 'failed',
          error: auth.message
        });

        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: auth.message
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // 将用户信息添加到请求上下文
      context.data = { user: auth.user };
    }
    
    // 继续处理请求
    return next();
  } catch (error) {
    // 记录系统错误
    await logOperation(env, {
      operationType: 'system_error',
      operator: 'system',
      details: { path },
      requestIp: request.headers.get('CF-Connecting-IP') || 'unknown',
      requestPath: path,
      status: 'failed',
      error: error.message
    });

    return new Response(JSON.stringify({
      error: true,
      message: `处理请求时出错: ${error.message}`
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
} 