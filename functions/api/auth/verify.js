// JWT验证接口
import { verify } from '../../../js/jwt.js';

// 为了保持向后兼容性，同时支持GET和POST请求
export async function onRequestGet(context) {
  return handleRequest(context);
}

export async function onRequestPost(context) {
  return handleRequest(context);
}

async function handleRequest(context) {
  const { request, env } = context;
  
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    // 从环境变量获取JWT密钥
    const jwtSecret = env.JWT_SECRET || 'your-secret-key';
    
    let token = '';
    
    // 尝试从请求体中获取令牌
    try {
      const body = await request.json();
      token = body.token || '';
    } catch (e) {
      console.error('从请求体获取令牌失败:', e);
    }
    
    // 如果请求体中没有令牌，则尝试从请求头获取（向后兼容）
    if (!token) {
      const authHeader = request.headers.get('Authorization') || '';
      token = authHeader.replace('Bearer ', '');
    }
    
    if (!token) {
      return new Response(JSON.stringify({
        valid: false,
        message: '未提供认证令牌'
      }), { 
        status: 401,
        headers 
      });
    }
    
    // 验证JWT令牌
    try {
      const payload = verify(token, jwtSecret);
      
      // 检查令牌是否过期
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        return new Response(JSON.stringify({
          valid: false,
          message: '认证令牌已过期'
        }), { 
          status: 401,
          headers 
        });
      }
      
      return new Response(JSON.stringify({
        valid: true,
        message: '认证令牌有效',
        user: {
          username: payload.username,
          role: payload.role
        }
      }), { headers });
    } catch (error) {
      return new Response(JSON.stringify({
        valid: false,
        message: '无效的认证令牌'
      }), { 
        status: 401,
        headers 
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      valid: false,
      message: '验证失败: ' + error.message
    }), {
      status: 500,
      headers
    });
  }
}

// 处理预检请求
export function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}