// 基于API密钥的IP黑名单查询接口

// API密钥前缀(用于KV存储)
const API_KEY_PREFIX = 'apikey:';

// 验证API密钥
async function validateApiKey(key, env, requiredPermission = 'read') {
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
    
    // 检查密钥是否过期
    if (keyData.expiryDate) {
      const now = new Date();
      const expiryDate = new Date(keyData.expiryDate);
      if (now > expiryDate) {
        return { valid: false, message: 'API密钥已过期' };
      }
    }
    
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

// 验证IP格式
function validateIPv4(ip) {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  if (!ipv4Regex.test(ip)) {
    return false;
  }
  
  const parts = ip.split('.').map(part => parseInt(part, 10));
  return parts.every(part => part >= 0 && part <= 255);
}

// 检查IP是否在黑名单中
async function checkIPInBlacklist(ip, env) {
  try {
    const blacklist = await env.IP_BLACKLIST.get('blacklist');
    if (!blacklist) {
      return false;
    }
    
    const blacklistArray = JSON.parse(blacklist);
    return blacklistArray.includes(ip);
  } catch (error) {
    console.error('检查IP黑名单失败:', error);
    return false;
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
    // 获取请求参数
    const apiKey = url.searchParams.get('key');
    const ip = url.searchParams.get('ip') || request.headers.get('CF-Connecting-IP');
    
    // 验证API密钥
    const keyValidation = await validateApiKey(apiKey, env, 'read');
    if (!keyValidation.valid) {
      return new Response(JSON.stringify({
        error: true,
        message: keyValidation.message
      }), {
        status: 401,
        headers
      });
    }
    
    // 验证IP格式
    if (ip && !validateIPv4(ip)) {
      return new Response(JSON.stringify({
        error: true,
        message: 'IP格式无效'
      }), {
        status: 400,
        headers
      });
    }
    
    // 检查IP是否在黑名单中
    const blocked = await checkIPInBlacklist(ip, env);
    
    return new Response(JSON.stringify({
      ip,
      blocked,
      message: blocked ? `IP ${ip} 在黑名单中` : `IP ${ip} 不在黑名单中`
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: true,
      message: '查询失败: ' + error.message
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