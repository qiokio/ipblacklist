// Cloudflare Pages Functions - 获取黑名单

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

// 处理请求的通用函数
async function handleRequest(context) {
    const { request, env } = context;
    const requestIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    // 获取操作者信息
    const operator = context.data?.user?.id || context.data?.apiKey?.id || 'system';
    
    try {
        // 获取黑名单
        const blacklist = await env.IP_BLACKLIST.get('blacklist');
        const blacklistArray = JSON.parse(blacklist || '[]');
        
        // 记录操作日志
        await logOperation(env, {
            operationType: 'blacklist_get',
            operator,
            details: { 
                count: blacklistArray.length,
                ips: blacklistArray
            },
            requestIp,
            requestPath: '/api/blacklist/get',
            status: 'success'
        });
        
        return new Response(blacklist || '[]', {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            }
        });
    } catch (error) {
        // 记录错误日志
        await logOperation(env, {
            operationType: 'blacklist_get',
            operator,
            details: { error: error.message },
            requestIp,
            requestPath: '/api/blacklist/get',
            status: 'failed',
            error: error.message
        });
        
        return new Response(JSON.stringify({ 
            error: error.message,
            message: '获取黑名单失败'
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            }
        });
    }
}

// 处理GET请求
export const onRequestGet = async (context) => {
    return handleRequest(context);
};

// 处理POST请求
export const onRequestPost = async (context) => {
    return handleRequest(context);
};

// 处理OPTIONS请求，支持CORS预检
export const onRequestOptions = async () => {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    });
};