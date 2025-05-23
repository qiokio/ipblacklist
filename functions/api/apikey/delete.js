// API密钥删除接口

// API密钥前缀(用于KV存储)
const API_KEY_PREFIX = 'apikey:';
// API密钥列表的键名
const API_KEY_LIST = 'apikeys_list';

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  const operator = context.data?.user?.id || 'system';
  
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  
  try {
    // 解析请求体中的API密钥数据
    const { key } = await request.json();
    
    if (!key) {
      // 记录错误日志
      await logOperation(env, {
        operationType: 'apikey_delete',
        operator,
        details: { error: '缺少API密钥' },
        requestIp,
        requestPath: '/api/apikey/delete',
        status: 'failed',
        error: '缺少API密钥'
      });

      return new Response(JSON.stringify({
        success: false,
        message: '缺少API密钥'
      }), {
        status: 400,
        headers
      });
    }
    
    // 检查密钥是否存在
    const keyDataStr = await env.API_KEYS.get(`${API_KEY_PREFIX}${key}`);
    if (!keyDataStr) {
      // 记录错误日志
      await logOperation(env, {
        operationType: 'apikey_delete',
        operator,
        details: { 
          key,
          error: 'API密钥不存在'
        },
        requestIp,
        requestPath: '/api/apikey/delete',
        status: 'failed',
        error: 'API密钥不存在'
      });

      return new Response(JSON.stringify({
        success: false,
        message: 'API密钥不存在'
      }), {
        status: 404,
        headers
      });
    }
    
    // 获取密钥数据用于日志记录
    const keyData = JSON.parse(keyDataStr);
    
    // 删除API密钥
    await env.API_KEYS.delete(`${API_KEY_PREFIX}${key}`);
    
    // 从API密钥列表中移除（异步执行，不影响主流程）
    env.API_KEYS.get(API_KEY_LIST).then(keysListStr => {
      if (keysListStr) {
        const keysList = JSON.parse(keysListStr);
        const updatedList = keysList.filter(k => k !== key);
        return env.API_KEYS.put(API_KEY_LIST, JSON.stringify(updatedList));
      }
    }).catch(error => {
      console.error('更新API密钥列表失败:', error);
    });
    
    // 记录成功日志
    await logOperation(env, {
      operationType: 'apikey_delete',
      operator,
      details: { 
        key,
        deletedKeyData: keyData
      },
      requestIp,
      requestPath: '/api/apikey/delete',
      status: 'success'
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: 'API密钥删除成功'
    }), { headers });
    
  } catch (error) {
    // 记录错误日志
    await logOperation(env, {
      operationType: 'apikey_delete',
      operator,
      details: { 
        error: error.message,
        requestBody: await request.text()
      },
      requestIp,
      requestPath: '/api/apikey/delete',
      status: 'failed',
      error: error.message
    });

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