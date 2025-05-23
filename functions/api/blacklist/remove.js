// Cloudflare Pages Functions - 从黑名单移除IP
import { createLogger, OPERATION_TYPES, OPERATION_STATUS } from '../../utils/logger.js';

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
        const logger = createLogger(env);
        await logger.success(OPERATION_TYPES.BLACKLIST_REMOVE, `成功从黑名单移除IP ${ip}`, {
            request,
            operator,
            details: { 
                ip,
                action: 'remove_success'
            }
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
        const logger = createLogger(env);
        await logger.error(OPERATION_TYPES.BLACKLIST_REMOVE, '从黑名单移除IP失败', {
            request,
            operator: context.data?.user?.id || context.data?.apiKey?.id || 'system',
            error,
            details: {
                errorType: error.constructor.name,
                action: 'remove_failed'
            }
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