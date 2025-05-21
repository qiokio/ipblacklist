// Cloudflare Pages Functions - 获取黑名单

// 处理请求的通用函数
async function handleRequest(context) {
    const { env } = context;
    
    try {
        // 获取黑名单
        const blacklist = await env.IP_BLACKLIST.get('blacklist');
        return new Response(blacklist || '[]', {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            }
        });
    } catch (error) {
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