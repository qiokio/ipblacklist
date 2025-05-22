// 基于API密钥的IP黑名单列表获取接口

// API密钥前缀(用于KV存储)
const API_KEY_PREFIX = 'apikey:';

// 记录操作日志的函数
async function logOperation(env, data) {
  try {
    const logKey = `log:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const logData = {
      ...data,
      timestamp: Date.now(),
      requestPath: data.requestPath || 'unknown',
      requestIp: data.requestIp || 'unknown',
      operator: data.operator || 'system',
      status: data.status || 'success',
      error: data.error || null
    };
    await env.API_LOGS.put(logKey, JSON.stringify(logData));
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
}

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

// 处理请求的通用函数
async function handleRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  
  try {
    let apiKey = '';
    
    // 尝试从请求体中获取API密钥
    try {
      // 克隆请求以避免多次读取请求体导致的错误
      const clonedRequest = request.clone();
      const contentType = request.headers.get('Content-Type') || '';
      
      if (contentType.includes('application/json')) {
        const body = await clonedRequest.json();
        if (body.key) apiKey = body.key;
      }
    } catch (e) {
      // 如果从请求体获取失败，继续使用URL参数
      console.error('从请求体获取数据失败:', e);
    }
    
    // 如果请求体中没有API密钥，则尝试从URL参数获取（向后兼容）
    if (!apiKey) {
      apiKey = url.searchParams.get('key');
    }
    
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
    
    // 记录成功的黑名单获取操作
    await logOperation(env, {
      operationType: 'blacklist_get',
      operator: keyValidation.keyData?.id || 'api_key',
      details: { 
        count: blacklistArray.length,
        ips: blacklistArray.length <= 100 ? blacklistArray : blacklistArray.slice(0, 100), // 限制日志中的IP数量
        apiKey: apiKey ? `${apiKey.substring(0, 4)}...` : 'unknown',
        key: apiKey || 'unknown'  // 添加key字段以确保兼容性
      },
      requestIp: request.headers.get('CF-Connecting-IP') || 'unknown',
      requestPath: '/api/blacklist/get-api',
      status: 'success'
    });
    
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

// 处理GET请求
export async function onRequestGet(context) {
  return handleRequest(context);
}

// 处理POST请求
export async function onRequestPost(context) {
  return handleRequest(context);
}

// 处理预检请求
export function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}