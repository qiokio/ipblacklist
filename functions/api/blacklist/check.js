// Cloudflare Pages Functions - 检查KV连接状态
export const onRequestGet = async (context) => {
    const { env } = context;
    
    try {
        // 测试连接
        const testKey = 'connection_test_' + Date.now();
        await env.IP_BLACKLIST.put(testKey, 'test');
        const testValue = await env.IP_BLACKLIST.get(testKey);
        await env.IP_BLACKLIST.delete(testKey);
        
        return new Response(JSON.stringify({
            connected: testValue === 'test',
            message: testValue === 'test' ? 'KV连接正常' : 'KV读写测试失败'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            connected: false,
            message: `KV连接错误: ${error.message}`
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}; 