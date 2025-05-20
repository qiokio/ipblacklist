// Cloudflare Pages Functions - 从黑名单移除IP
export async function onRequest(context) {
    const { request, env } = context;
    
    try {
        const { ip } = await request.json();
        const requestIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        
        // 获取操作者信息
        const operator = context.data?.user?.id || context.data?.apiKey?.id || 'system';
        
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
        
        // 记录操作日志
        await logOperation(env, {
            operationType: 'blacklist_remove',
            operator,
            details: { ip },
            requestIp,
            requestPath: '/api/blacklist/remove',
            status: 'success'
        });
        
        return new Response(JSON.stringify({
            success: true,
            message: 'IP已从黑名单中移除'
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        // 记录错误日志
        await logOperation(env, {
            operationType: 'blacklist_remove',
            operator: context.data?.user?.id || context.data?.apiKey?.id || 'system',
            details: { error: error.message },
            requestIp: request.headers.get('CF-Connecting-IP') || 'unknown',
            requestPath: '/api/blacklist/remove',
            status: 'failed',
            error: error.message
        });
        
        return new Response(JSON.stringify({
            success: false,
            error: '删除黑名单失败',
            message: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
} 