// Cloudflare Pages Functions - 添加IP到黑名单
import { createLogger, OPERATION_TYPES, OPERATION_STATUS } from '../../utils/logger.js';

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

        // 验证认证信息
        if (!context.data?.user) {
            return new Response(JSON.stringify({
                success: false,
                message: '未授权访问'
            }), {
                status: 401,
                headers
            });
        }
        
        // 解析请求体
        let ip;
        try {
            const body = await request.json();
            ip = body.ip;
        } catch (e) {
            return new Response(JSON.stringify({
                success: false,
                message: '无效的请求数据格式'
            }), {
                status: 400,
                headers
            });
        }
        
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
        const operator = context.data.user.id || 'system';
        
        // 获取当前黑名单
        let blacklistArray = [];
        try {
            const blacklist = await env.IP_BLACKLIST.get('blacklist');
            if (blacklist) {
                blacklistArray = JSON.parse(blacklist);
            }
        } catch (e) {
            console.error('读取黑名单失败:', e);
            return new Response(JSON.stringify({
                success: false,
                message: '读取黑名单失败'
            }), {
                status: 500,
                headers
            });
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
        try {
            await env.IP_BLACKLIST.put('blacklist', JSON.stringify(blacklistArray));
        } catch (e) {
            console.error('保存黑名单失败:', e);
            return new Response(JSON.stringify({
                success: false,
                message: '保存黑名单失败'
            }), {
                status: 500,
                headers
            });
        }
        
        // 记录操作日志
        try {
            const logger = createLogger(env);
            await logger.success(OPERATION_TYPES.BLACKLIST_ADD, `成功添加IP ${ip} 到黑名单`, {
                request,
                operator,
                details: { 
                    ip,
                    blacklistCount: blacklistArray.length,
                    action: 'add_success'
                }
            });
        } catch (e) {
            console.error('记录操作日志失败:', e);
            // 日志记录失败不影响主流程
        }
        
        return new Response(JSON.stringify({
            success: true,
            message: `IP ${ip} 已添加到黑名单`,
            count: blacklistArray.length
        }), { headers });
        
    } catch (error) {
        console.error('添加IP到黑名单失败:', error);
        
        // 记录错误日志
        try {
            const logger = createLogger(env);
            await logger.error(OPERATION_TYPES.BLACKLIST_ADD, '添加IP到黑名单失败', {
                request,
                operator: context.data?.user?.id || 'system',
                error,
                details: {
                    errorType: error.constructor.name,
                    action: 'add_failed'
                }
            });
        } catch (e) {
            console.error('记录错误日志失败:', e);
        }
        
        return new Response(JSON.stringify({
            success: false,
            message: '添加黑名单失败: ' + error.message
        }), {
            status: 500,
            headers
        });
    }
}