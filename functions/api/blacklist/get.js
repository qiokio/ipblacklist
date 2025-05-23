// Cloudflare Pages Functions - 获取黑名单
import { createLogger, OPERATION_TYPES, OPERATION_STATUS } from '../../utils/logger.js';

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
        const logger = createLogger(env);
        await logger.success(OPERATION_TYPES.BLACKLIST_GET, `成功获取黑名单，共${blacklistArray.length}个IP`, {
            request,
            operator,
            details: { 
                count: blacklistArray.length,
                action: 'get_success'
            }
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
        const logger = createLogger(env);
        await logger.error(OPERATION_TYPES.BLACKLIST_GET, '获取黑名单失败', {
            request,
            operator,
            error,
            details: {
                errorType: error.constructor.name,
                action: 'get_failed'
            }
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