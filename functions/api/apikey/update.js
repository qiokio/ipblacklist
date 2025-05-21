// API密钥更新接口

// API密钥前缀(用于KV存储)
const API_KEY_PREFIX = 'apikey:';

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
    const { key, note, permissions, expiryDate } = await request.json();
    
    if (!key) {
      // 记录错误日志
      await logOperation(env, {
        operationType: 'apikey_update',
        operator,
        details: { error: '缺少API密钥' },
        requestIp,
        requestPath: '/api/apikey/update',
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
        operationType: 'apikey_update',
        operator,
        details: { 
          key,
          error: 'API密钥不存在'
        },
        requestIp,
        requestPath: '/api/apikey/update',
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
    
    // 更新密钥数据
    const keyData = JSON.parse(keyDataStr);
    const oldData = { ...keyData };
    
    // 更新备注
    if (note !== undefined) {
      keyData.note = note;
    }
    
    // 更新权限
    if (permissions !== undefined) {
      keyData.permissions = {
        ...keyData.permissions || {
          read: true,
          list: false,
          add: false,
          delete: false
        },
        ...permissions
      };
    }
    
    // 更新过期时间
    if (expiryDate !== undefined) {
      keyData.expiryDate = expiryDate;
    }
    
    // 保存更新后的数据
    await env.API_KEYS.put(`${API_KEY_PREFIX}${key}`, JSON.stringify(keyData));
    
    // 记录成功日志
    await logOperation(env, {
      operationType: 'apikey_update',
      operator,
      details: { 
        key,
        oldData,
        newData: keyData,
        changes: {
          note: note !== undefined,
          permissions: permissions !== undefined,
          expiryDate: expiryDate !== undefined
        }
      },
      requestIp,
      requestPath: '/api/apikey/update',
      status: 'success'
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: 'API密钥更新成功'
    }), { headers });
    
  } catch (error) {
    // 记录错误日志
    await logOperation(env, {
      operationType: 'apikey_update',
      operator,
      details: { 
        error: error.message,
        requestBody: await request.text()
      },
      requestIp,
      requestPath: '/api/apikey/update',
      status: 'failed',
      error: error.message
    });

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