// 通用入口点，确保函数构建被正确识别
export async function onRequest(context) {
  const { request, next, params } = context;
  
  console.log("处理请求:", params.path);
  
  try {
    // 尝试使用next处理，这将路由到更具体的函数
    return await next();
  } catch (err) {
    console.error("处理请求时出错:", err);
    return new Response(JSON.stringify({
      error: true,
      message: `处理请求时出错: ${err.message}`
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
} 