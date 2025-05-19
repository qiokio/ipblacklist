// Functions主入口
export function onRequest(context) {
  return new Response("IP黑名单API服务正常运行", {
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    }
  });
} 