// Cloudflare Pages Functions - 添加IP到黑名单
export async function onRequest(context) {
    const { request, env } = context;
    
    try {
        const { ip, reason } = await request.json();
        const requestIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        
        // 获取操作者信息
        const operator = context.data?.user?.id || context.data?.apiKey?.id || 'system';
        
        // 添加到黑名单
        await env.IP_BLACKLIST.put(ip, JSON.stringify({
            reason,
            addedAt: Date.now(),
            addedBy: operator
        }));
        
        // 记录操作日志
        await logOperation(env, {
            operationType: 'blacklist_add',
            operator,
            details: { ip, reason },
            requestIp,
            requestPath: '/api/blacklist/add',
            status: 'success'
        });
        
        return new Response(JSON.stringify({
            success: true,
            message: 'IP已添加到黑名单'
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        // 记录错误日志
        await logOperation(env, {
            operationType: 'blacklist_add',
            operator: context.data?.user?.id || context.data?.apiKey?.id || 'system',
            details: { error: error.message },
            requestIp: request.headers.get('CF-Connecting-IP') || 'unknown',
            requestPath: '/api/blacklist/add',
            status: 'failed',
            error: error.message
        });
        
        return new Response(JSON.stringify({
            success: false,
            error: '添加黑名单失败',
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