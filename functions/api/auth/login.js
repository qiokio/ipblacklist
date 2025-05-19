// 登录接口
import { sign } from '../../../js/jwt.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // 从环境变量获取用户名和密码
    const adminUsername = env.ADMIN_USERNAME;
    const adminPassword = env.ADMIN_PASSWORD;
    const jwtSecret = env.JWT_SECRET || 'your-secret-key';
    
    // 验证环境变量是否已设置
    if (!adminUsername || !adminPassword) {
      console.error('缺少必要的环境变量：ADMIN_USERNAME 或 ADMIN_PASSWORD');
      return new Response(JSON.stringify({
        success: false,
        message: '系统配置错误：未设置管理员凭据'
      }), {
        status: 500,
        headers
      });
    }

    // 解析请求体中的用户名和密码
    const { username, password } = await request.json();
    
    // 验证用户名和密码
    if (username === adminUsername && password === adminPassword) {
      // 创建JWT令牌
      const token = sign(
        { 
          username, 
          role: 'admin', 
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
        }, 
        jwtSecret
      );
      
      return new Response(JSON.stringify({
        success: true,
        message: '登录成功',
        token
      }), { headers });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: '用户名或密码错误'
      }), { 
        status: 401,
        headers 
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '登录失败: ' + error.message
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
} 