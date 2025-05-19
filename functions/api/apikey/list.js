// API密钥列表获取接口

// API密钥前缀(用于KV存储)
const API_KEY_PREFIX = 'apikey:';
// API密钥列表的键名
const API_KEY_LIST = 'apikeys_list';

export async function onRequestGet(context) {
  const { env } = context;
  
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  
  try {
    // 从新的KV命名空间获取API密钥列表
    let keysList = [];
    const existingList = await env.API_KEYS.get(API_KEY_LIST);
    
    if (existingList) {
      keysList = JSON.parse(existingList);
    }
    
    // 获取每个密钥的详细信息 - 从新的KV命名空间获取
    const apiKeysData = [];
    for (const key of keysList) {
      const keyDataStr = await env.API_KEYS.get(`${API_KEY_PREFIX}${key}`);
      if (keyDataStr) {
        try {
          const keyData = JSON.parse(keyDataStr);
          apiKeysData.push(keyData);
        } catch (error) {
          console.error(`解析API密钥数据失败: ${key}`, error);
        }
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      keys: apiKeysData
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '获取API密钥列表失败: ' + error.message
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
      'Access-Control-Max-Age': '86400'
    }
  });
} 