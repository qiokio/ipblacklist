// API密钥创建接口

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
    const { key, note, createdAt } = await request.json();
    
    if (!key) {
      return new Response(JSON.stringify({
        success: false,
        message: '无效的API密钥'
      }), {
        status: 400,
        headers
      });
    }
    
    // 存储API密钥到KV
    const keyData = {
      key,
      note: note || '',
      createdAt: createdAt || new Date().toISOString()
    };
    
    await env.IP_BLACKLIST.put(`${API_KEY_PREFIX}${key}`, JSON.stringify(keyData));
    
    // 添加到API密钥列表
    let keysList = [];
    try {
      const existingList = await env.IP_BLACKLIST.get(`${API_KEY_PREFIX}list`);
      if (existingList) {
        keysList = JSON.parse(existingList);
      }
    } catch (error) {
      console.error('获取API密钥列表失败:', error);
    }
    
    // 确保不添加重复密钥
    if (!keysList.includes(key)) {
      keysList.push(key);
      await env.IP_BLACKLIST.put(`${API_KEY_PREFIX}list`, JSON.stringify(keysList));
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'API密钥创建成功'
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '创建API密钥失败: ' + error.message
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