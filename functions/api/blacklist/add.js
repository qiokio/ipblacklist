// Cloudflare Pages Functions - 添加IP到黑名单
export async function onRequest(context) {
    const { request, env } = context;
    
    // 设置CORS头
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    try {
        // 验证请求方法
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers });
        }
        
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({
                success: false,
                message: '不支持的请求方法'
            }), {
                status: 405,
                headers
            });
        }
        
        // 解析请求体
        const { ip } = await request.json();
        const requestIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        
        // 验证IP参数
        if (!ip) {
            return new Response(JSON.stringify({
                success: false,
                message: '缺少IP参数'
            }), {
                status: 400,
                headers
            });
        }
        
        // 验证IP格式
        const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        if (!ipv4Regex.test(ip)) {
            return new Response(JSON.stringify({
                success: false,
                message: 'IP格式无效'
            }), {
                status: 400,
                headers
            });
        }
        
        // 验证IP地址范围
        const parts = ip.split('.').map(part => parseInt(part, 10));
        if (!parts.every(part => part >= 0 && part <= 255)) {
            return new Response(JSON.stringify({
                success: false,
                message: 'IP地址范围无效'
            }), {
                status: 400,
                headers
            });
        }
        
        // 获取操作者信息
        const operator = context.data?.user?.id || context.data?.apiKey?.id || 'system';
        
        // 获取当前黑名单
        const blacklist = await env.IP_BLACKLIST.get('blacklist');
        let blacklistArray = [];
        
        if (blacklist) {
            blacklistArray = JSON.parse(blacklist);
        }
        
        // 检查IP是否已在黑名单中
        if (blacklistArray.includes(ip)) {
            return new Response(JSON.stringify({
                success: false,
                message: `IP ${ip} 已经在黑名单中`
            }), {
                status: 409,
                headers
            });
        }
        
        // 添加IP到黑名单
        blacklistArray.push(ip);
        
        // 保存黑名单
        await env.IP_BLACKLIST.put('blacklist', JSON.stringify(blacklistArray));
        
        // 记录操作日志
        await logOperation(env, {
            operationType: 'blacklist_add',
            operator,
            details: { ip },
            requestIp,
            requestPath: '/api/blacklist/add',
            status: 'success'
        });
        
        return new Response(JSON.stringify({
            success: true,
            message: `IP ${ip} 已添加到黑名单`,
            count: blacklistArray.length
        }), { headers });
        
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
            message: '添加黑名单失败: ' + error.message
        }), {
            status: 500,
            headers
        });
    }
} 