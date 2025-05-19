// JWT验证接口
import { verify } from '../../../js/jwt.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    // 从环境变量获取JWT密钥
    const jwtSecret = env.JWT_SECRET || 'your-secret-key';
    
    // 从请求头中获取认证令牌
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
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