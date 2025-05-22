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
  let token = '';
  
  // 尝试从请求体中获取token
  try {
    // 克隆请求以避免多次读取请求体导致的错误
    const clonedRequest = request.clone();
    const contentType = request.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await clonedRequest.json();
      token = body.token || '';
    }
  } catch (e) {
    // 如果从请求体获取失败，继续尝试从请求头获取
    console.error('从请求体获取token失败:', e);
  }
  
  // 如果请求体中没有token，则尝试从请求头获取（向后兼容）
  if (!token) {
    const authHeader = request.headers.get('Authorization') || '';
    token = authHeader.replace('Bearer ', '');
  }
  
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

// 验证API密钥
async function verifyApiKey(request, env) {
  let apiKey = '';
  
  // 尝试从请求体中获取API密钥
  try {
    // 克隆请求以避免多次读取请求体导致的错误
    const clonedRequest = request.clone();
    const contentType = request.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await clonedRequest.json();
      apiKey = body.key || '';
    }
  } catch (e) {
    // 如果从请求体获取失败，继续尝试从URL参数获取
    console.error('从请求体获取API密钥失败:', e);
  }
  
  // 如果请求体中没有API密钥，则尝试从URL参数获取（向后兼容）
  if (!apiKey) {
    const url = new URL(request.url);
    apiKey = url.searchParams.get('key');
  }
  
  if (!apiKey) {
    return { valid: false, message: '未提供API密钥' };
  }
  
  try {
    const keyDataString = await env.API_KEYS.get(`${API_KEY_PREFIX}${apiKey}`);
    if (!keyDataString) {
      return { valid: false, message: '无效的API密钥' };
    }
    
    const keyData = JSON.parse(keyDataString);
    
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
    console.error('验证API密钥失败:', error);
    return { valid: false, message: '验证API密钥失败' };
  }
}

// 检查API密钥权限
function checkApiKeyPermission(keyData, path) {
  const requiredPermission = API_KEY_PATHS[path];
  if (!requiredPermission) {
    return false;
  }
  
  return keyData.permissions && keyData.permissions[requiredPermission] === true;
}

// 记录操作日志
async function logOperation(env, data) {
  try {
    const logKey = `${LOG_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const logData = {
      ...data,
      timestamp: Date.now(),
      requestPath: data.requestPath || 'unknown',
      requestIp: data.requestIp || 'unknown',
      operator: data.operator || 'system',
      status: data.status || 'success',
      error: data.error || null
    };
    await env.API_LOGS.put(logKey, JSON.stringify(logData));
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const requestIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  
  // 设置CORS头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
  
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // 检查是否为API密钥路径
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
          details: { 
            path,
            key: url.searchParams.get('key') || 'unknown',
            reason: keyAuth.message
          },
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
            ...corsHeaders
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
          details: { 
            path, 
            requiredPermission: API_KEY_PATHS[path],
            key: url.searchParams.get('key') || 'unknown'
          },
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
            ...corsHeaders
          }
        });
      }
      
      // 记录成功的API密钥验证
      await logOperation(env, {
        operationType: 'api_key_verification',
        operator: keyAuth.key.id,
        details: { 
          path,
          key: url.searchParams.get('key') || 'unknown',
          apiKey: url.searchParams.get('key') || 'unknown',
          permissions: keyAuth.key.permissions
        },
        requestIp,
        requestPath: path,
        status: 'success'
      });
      
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
            ...corsHeaders
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
      requestIp,
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
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}