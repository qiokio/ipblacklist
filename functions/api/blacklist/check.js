// Cloudflare Pages Functions - 检查KV连接状态
import { verify } from '../../../js/jwt.js';

// JWT验证中间件
async function verifyJWT(request, env) {
    // 从请求头中获取认证令牌
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
        return { valid: false, message: '未提供认证令牌' };
    }
    
    try {
        // 从环境变量获取JWT密钥
        const jwtSecret = env.JWT_SECRET || 'your-secret-key';
        
        // 验证JWT令牌
        const payload = verify(token, jwtSecret);
        
        // 检查令牌是否过期
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
            return { valid: false, message: '认证令牌已过期' };
        }
        
        return { 
            valid: true, 
            user: {
                username: payload.username,
                role: payload.role
            } 
        };
    } catch (error) {
        return { valid: false, message: '无效的认证令牌' };
    }
}

export const onRequestGet = async (context) => {
    const { env, request } = context;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };
    
    // 验证JWT令牌
    const authResult = await verifyJWT(request, env);
    if (!authResult.valid) {
        return new Response(JSON.stringify({
            error: true,
            message: authResult.message
        }), {
            status: 401,
            headers
        });
    }
    
    try {
        // 测试连接
        const testKey = 'connection_test_' + Date.now();
        await env.IP_BLACKLIST.put(testKey, 'test');
        const testValue = await env.IP_BLACKLIST.get(testKey);
        await env.IP_BLACKLIST.delete(testKey);
        
        return new Response(JSON.stringify({
            connected: testValue === 'test',
            message: testValue === 'test' ? 'KV连接正常' : 'KV读写测试失败'
        }), { headers });
    } catch (error) {
        return new Response(JSON.stringify({ 
            connected: false,
            message: `KV连接错误: ${error.message}`
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
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    });
}; 