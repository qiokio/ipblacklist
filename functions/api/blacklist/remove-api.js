// 基于API密钥的IP黑名单删除接口

// API密钥前缀(用于KV存储)
const API_KEY_PREFIX = 'apikey:';

// 验证API密钥
async function validateApiKey(key, env, requiredPermission = 'delete') {
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
    // 克隆请求以避免多次读取请求体导致的错误
    const clonedRequest = request.clone();
    
    // 从请求体中获取数据
    const requestData = await clonedRequest.json();
    const { ip, key } = requestData;
    
    // 如果请求体中没有key，则尝试从URL参数获取（向后兼容）
    let apiKey = key;
    if (!apiKey) {
      const url = new URL(request.url);
      apiKey = url.searchParams.get('key');
    }
    
    // 验证API密钥
    const keyValidation = await validateApiKey(apiKey, env, 'delete');
    if (!keyValidation.valid) {
      return new Response(JSON.stringify({
        success: false,
        message: keyValidation.message
      }), {
        status: 401,
        headers
      });
    }
    
    if (!ip) {
      return new Response(JSON.stringify({
        success: false,
        message: '未提供IP地址'
      }), {
        status: 400,
        headers
      });
    }
    
    // 获取当前黑名单
    const blacklist = await env.IP_BLACKLIST.get('blacklist');
    
    // 如果黑名单不存在，返回错误
    if (!blacklist) {
      return new Response(JSON.stringify({
        success: false,
        message: '黑名单为空'
      }), {
        status: 404,
        headers
      });
    }
    
    // 解析黑名单并删除指定IP
    let blacklistArray = JSON.parse(blacklist);
    const initialLength = blacklistArray.length;
    
    // 过滤掉要删除的IP
    blacklistArray = blacklistArray.filter(item => item !== ip);
    
    // 如果长度没变，说明IP不在黑名单中
    if (blacklistArray.length === initialLength) {
      return new Response(JSON.stringify({
        success: false,
        message: `IP ${ip} 不在黑名单中`
      }), {
        status: 404,
        headers
      });
    }
    
    // 保存更新后的黑名单
    await env.IP_BLACKLIST.put('blacklist', JSON.stringify(blacklistArray));
    
    // 记录成功的移除操作
    await logOperation(env, {
      operationType: 'blacklist_remove',
      operator: keyValidation.keyData?.id || 'api_key',
      details: { 
        ip,
        result: `已从黑名单中移除IP ${ip}`,
        apiKey: apiKey ? `${apiKey.substring(0, 4)}...` : 'unknown',
        key: apiKey || 'unknown'  // 添加key字段以确保兼容性
      },
      requestIp: request.headers.get('CF-Connecting-IP') || 'unknown',
      requestPath: '/api/blacklist/remove-api',
      status: 'success'
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: `IP ${ip} 已从黑名单中移除`,
      count: blacklistArray.length
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '删除IP失败: ' + error.message
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