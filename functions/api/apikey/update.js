// API密钥更新接口

// API密钥前缀(用于KV存储)
const API_KEY_PREFIX = 'apikey:';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  
  try {
    // 解析请求体中的API密钥数据
    const { key, note } = await request.json();
    
    if (!key) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少API密钥'
      }), {
        status: 400,
        headers
      });
    }
    
    // 检查密钥是否存在
    const keyDataStr = await env.IP_BLACKLIST.get(`${API_KEY_PREFIX}${key}`);
    if (!keyDataStr) {
      return new Response(JSON.stringify({
        success: false,
        message: 'API密钥不存在'
      }), {
        status: 404,
        headers
      });
    }
    
    // 更新密钥数据
    const keyData = JSON.parse(keyDataStr);
    keyData.note = note;
    
    await env.IP_BLACKLIST.put(`${API_KEY_PREFIX}${key}`, JSON.stringify(keyData));
    
    return new Response(JSON.stringify({
      success: true,
      message: 'API密钥更新成功'
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '更新API密钥失败: ' + error.message
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
} 