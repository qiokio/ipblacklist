// Cloudflare Pages Functions中间件
// 处理跨域请求并确保KV绑定可用

export async function onRequest(context) {
    // 解构出请求和环境变量
    const { request, env, next } = context;
    
    try {
        // 检查KV绑定是否可用
        if (!env.IP_BLACKLIST) {
            return new Response(JSON.stringify({
                error: true,
                message: "KV绑定不可用，请确保在Cloudflare Pages中正确配置了KV命名空间绑定"
            }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                }
            });
        }
        
        // 处理预检请求
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                }
            });
        }
        
        // 继续处理请求
        const response = await next();
        
        // 添加CORS头
        const newResponse = new Response(response.body, response);
        newResponse.headers.set("Access-Control-Allow-Origin", "*");
        newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        newResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");
        
        return newResponse;
    } catch (error) {
        // 处理错误
        return new Response(JSON.stringify({
            error: true,
            message: `中间件错误: ${error.message}`
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }
} 