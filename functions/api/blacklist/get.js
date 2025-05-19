// Cloudflare Pages Functions - 获取黑名单
export const onRequestGet = async (context) => {
    const { env } = context;
    
    try {
        // 获取黑名单
        const blacklist = await env.IP_BLACKLIST.get('blacklist');
        return new Response(blacklist || '[]', {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message,
            message: '获取黑名单失败'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}; 