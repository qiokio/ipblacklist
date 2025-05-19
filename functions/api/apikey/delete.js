// API密钥删除接口

// API密钥前缀(用于KV存储)
const API_KEY_PREFIX = 'apikey:';
// API密钥列表的键名
const API_KEY_LIST = 'apikeys_list';

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
    // 解析请求体中的API密钥
    const { key } = await request.json();
    
    if (!key) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少API密钥'
      }), {
        status: 400,
        headers
      });
    }
    
    // 检查密钥是否存在 - 从新的KV命名空间获取
    const keyExists = await env.API_KEYS.get(`${API_KEY_PREFIX}${key}`);
    if (!keyExists) {
      return new Response(JSON.stringify({
        success: false,
        message: 'API密钥不存在'
      }), {
        status: 404,
        headers
      });
    }
    
    // 从KV中删除密钥 - 使用新的KV命名空间
    await env.API_KEYS.delete(`${API_KEY_PREFIX}${key}`);
    
    // 从密钥列表中移除 - 使用新的KV命名空间和键名
    let keysList = [];
    const existingList = await env.API_KEYS.get(API_KEY_LIST);
    
    if (existingList) {
      keysList = JSON.parse(existingList);
      keysList = keysList.filter(item => item !== key);
      await env.API_KEYS.put(API_KEY_LIST, JSON.stringify(keysList));
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'API密钥删除成功'
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '删除API密钥失败: ' + error.message
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