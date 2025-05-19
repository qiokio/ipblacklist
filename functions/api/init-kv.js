// Cloudflare Pages Functions - KV初始化脚本
export const onRequestGet = async (context) => {
    const { env } = context;
    
    try {
        // 检查KV连接状态
        const testKey = 'connection_test_' + Date.now();
        await env.IP_BLACKLIST.put(testKey, 'test');
        const testValue = await env.IP_BLACKLIST.get(testKey);
        await env.IP_BLACKLIST.delete(testKey);
        
        const connected = testValue === 'test';
        const message = connected ? 'KV连接正常' : 'KV读写测试失败';
        
        // 直接返回可执行的JavaScript代码而不是模块
        return new Response(`
            // 通过Functions API初始化KV
            window.ENV = window.ENV || {};
            window.ENV.KV_STATUS = {
                connected: ${connected},
                message: "${message}"
            };
            console.log("KV状态初始化完成 (通过Functions API):", window.ENV.KV_STATUS);
            
            window.KV_API_READY = true;
        `, {
            headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(`
            // 初始化KV出错
            window.ENV = window.ENV || {};
            window.ENV.KV_STATUS = {
                connected: false,
                message: "KV初始化错误: ${error.message}"
            };
            console.error("KV初始化失败:", "${error.message}");
            
            window.KV_API_READY = true;
        `, {
            headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}; 