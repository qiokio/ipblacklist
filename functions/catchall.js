// 通用请求拦截器
// 引入我们的Markdown处理函数
import { onRequest as markdownHandler } from './markdown.js';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  console.log('拦截请求:', path);
  
  // 如果是.md文件，交给Markdown处理器处理
  if (path.endsWith('.md')) {
    console.log('检测到Markdown文件，转发到专门处理器');
    return markdownHandler(context);
  }
  
  // 其他请求直接放行
  return fetch(request);
} 