// Cloudflare Pages Functions - 外部API检查IP是否在黑名单中
export const onRequestGet = async (context) => {
    const { env, request } = context;
    
    // 设置CORS头，允许跨域请求
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    try {
        // 获取请求的IP
        const url = new URL(request.url);
        const ip = url.searchParams.get('ip') || request.headers.get('CF-Connecting-IP');
        
        if (!ip) {
            return new Response(JSON.stringify({
                blocked: false,
                message: '未提供IP地址'
            }), { 
                status: 400,
                headers
            });
        }
        
        // 获取黑名单并检查IP
        const blacklistStr = await env.IP_BLACKLIST.get('blacklist');
        const blacklist = blacklistStr ? JSON.parse(blacklistStr) : [];
        const isBlocked = blacklist.includes(ip);
        
        return new Response(JSON.stringify({
            ip,
            blocked: isBlocked,
            message: isBlocked ? '此IP已被封禁' : '此IP未被封禁'
        }), { headers });
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message,
            message: '检查IP状态失败'
        }), {
            status: 500,
            headers
        });
    }
};

// 处理OPTIONS请求，支持CORS预检
export const onRequestOptions = async () => {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}; 