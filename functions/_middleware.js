// IP黑名单系统中间件
import { verify } from '../js/jwt.js';

// 需要认证的API路径列表
const AUTH_REQUIRED_PATHS = [
  '/api/blacklist/add',
  '/api/blacklist/remove',
  '/api/blacklist/get',
  '/api/blacklist/check'
];

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
    if (!env.IP_BLACKLIST && path.startsWith('/api/blacklist/')) {
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
    
    // 检查是否需要认证的路径
    const requiresAuth = AUTH_REQUIRED_PATHS.some(authPath => 
      path.startsWith(authPath)
    );
    
    // 如果需要认证，验证令牌
    if (requiresAuth) {
      const auth = await verifyToken(request, env);
      
      if (!auth.valid) {
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