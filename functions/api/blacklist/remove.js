// Cloudflare Pages Functions - 从黑名单移除IP
export const onRequestPost = async (context) => {
    const { request, env } = context;
    
    try {
        const data = await request.json();
        const ip = data.ip;
        
        if (!ip) {
            return new Response(JSON.stringify({ error: '缺少IP参数' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const list = await env.IP_BLACKLIST.get('blacklist');
        if (list) {
            let blacklistArray = JSON.parse(list);
            blacklistArray = blacklistArray.filter(item => item !== ip);
            await env.IP_BLACKLIST.put('blacklist', JSON.stringify(blacklistArray));
        }
        
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message,
            message: '移除IP失败'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}; 