// 基于API密钥的IP黑名单添加接口

// API密钥前缀(用于KV存储)
const API_KEY_PREFIX = 'apikey:';

// 验证API密钥
async function validateApiKey(key, env, requiredPermission = 'add') {
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
    // 从URL参数中获取key
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    
    // 从请求体中获取ip
    const { ip } = await request.json();
    
    // 验证API密钥
    const keyValidation = await validateApiKey(key, env, 'add');
    if (!keyValidation.valid) {
      return new Response(JSON.stringify({
        success: false,
        message: keyValidation.message
      }), {
        status: 401,
        headers
      });
    }
    
    // 验证IP
    if (!ip || !validateIPv4(ip)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'IP格式无效'
      }), {
        status: 400,
        headers
      });
    }
    
    // 获取当前黑名单
    const blacklist = await env.IP_BLACKLIST.get('blacklist');
    let blacklistArray = [];
    
    if (blacklist) {
      blacklistArray = JSON.parse(blacklist);
    }
    
    // 检查IP是否已在黑名单中
    if (blacklistArray.includes(ip)) {
      return new Response(JSON.stringify({
        success: false,
        message: `IP ${ip} 已经在黑名单中`
      }), {
        status: 409,
        headers
      });
    }
    
    // 添加IP到黑名单
    blacklistArray.push(ip);
    
    // 保存黑名单
    await env.IP_BLACKLIST.put('blacklist', JSON.stringify(blacklistArray));
    
    return new Response(JSON.stringify({
      success: true,
      message: `IP ${ip} 已添加到黑名单`,
      count: blacklistArray.length
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '添加IP失败: ' + error.message
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
      'Access-Control-Max-Age': '86400'
    }
  });
} 