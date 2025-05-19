// 基于API密钥的IP黑名单列表获取接口

// API密钥前缀(用于KV存储)
const API_KEY_PREFIX = 'apikey:';

// 验证API密钥
async function validateApiKey(key, env, requiredPermission = 'list') {
  if (!key) {
    return { valid: false, message: '未提供API密钥' };
  }
  
  try {
    const keyDataString = await env.API_KEYS.get(`${API_KEY_PREFIX}${key}`);
    if (!keyDataString) {
      return { valid: false, message: '无效的API密钥' };
    }
    
    // 解析API密钥数据
    const keyData = JSON.parse(keyDataString);
    
    // 验证权限
    if (!keyData.permissions || keyData.permissions[requiredPermission] !== true) {
      return { valid: false, message: `API密钥没有所需的 ${requiredPermission} 权限` };
    }
    
    return { valid: true, keyData };
  } catch (error) {
    console.error('验证API密钥失败:', error);
    return { valid: false, message: '验证API密钥失败' };
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  try {
    // 获取API密钥
    const apiKey = url.searchParams.get('key');
    
    // 验证API密钥和权限
    const keyValidation = await validateApiKey(apiKey, env, 'list');
    if (!keyValidation.valid) {
      return new Response(JSON.stringify({
        error: true,
        message: keyValidation.message
      }), {
        status: 401,
        headers
      });
    }
    
    // 从KV获取黑名单
    const blacklist = await env.IP_BLACKLIST.get('blacklist');
    
    // 如果黑名单不存在，返回空数组
    if (!blacklist) {
      return new Response(JSON.stringify([]), { headers });
    }
    
    // 解析黑名单并返回
    const blacklistArray = JSON.parse(blacklist);
    return new Response(JSON.stringify(blacklistArray), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: true,
      message: '获取黑名单失败: ' + error.message
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
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
} 