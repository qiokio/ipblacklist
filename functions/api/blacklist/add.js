// Cloudflare Pages Functions - 添加IP到黑名单
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
        
        const currentList = await env.IP_BLACKLIST.get('blacklist');
        let blacklistArray = currentList ? JSON.parse(currentList) : [];
        
        if (!blacklistArray.includes(ip)) {
            blacklistArray.push(ip);
            await env.IP_BLACKLIST.put('blacklist', JSON.stringify(blacklistArray));
        }
        
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message,
            message: '添加IP失败'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}; 