// 引入marked库用于Markdown解析
import { marked } from 'marked';

// 处理对Markdown文件的请求
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 只处理.md文件
  if (!path.endsWith('.md')) {
    return new Response('Not a markdown file', { status: 400 });
  }
  
  // 获取资源
  try {
    // 使用fetch去获取Markdown文件内容（Cloudflare Pages会自动找到静态资源）
    const response = await fetch(request);
    
    if (!response.ok) {
      return new Response(`无法找到Markdown文件: ${path}`, { status: 404 });
    }
    
    // 读取Markdown内容
    const mdContent = await response.text();
    
    // 使用marked库将Markdown转换为HTML
    const htmlContent = marked(mdContent);
    
    // 创建完整的HTML页面
    const fullHtml = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${path.split('/').pop().replace('.md', '')} - IP黑名单系统</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        
        .markdown-body {
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        
        h1, h2, h3, h4, h5, h6 {
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.25;
        }
        
        h1 {
          font-size: 2em;
          padding-bottom: 0.3em;
          border-bottom: 1px solid #eaecef;
        }
        
        h2 {
          font-size: 1.5em;
          padding-bottom: 0.3em;
          border-bottom: 1px solid #eaecef;
        }
        
        a {
          color: #0366d6;
          text-decoration: none;
        }
        
        a:hover {
          text-decoration: underline;
        }
        
        code {
          font-family: Consolas, Monaco, 'Andale Mono', monospace;
          background-color: #f6f8fa;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 85%;
        }
        
        pre {
          background-color: #f6f8fa;
          border-radius: 3px;
          padding: 16px;
          overflow: auto;
        }
        
        pre code {
          background-color: transparent;
          padding: 0;
        }
        
        blockquote {
          margin: 0;
          padding: 0 1em;
          color: #6a737d;
          border-left: 0.25em solid #dfe2e5;
        }
        
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }
        
        table th, table td {
          padding: 6px 13px;
          border: 1px solid #dfe2e5;
        }
        
        table tr {
          background-color: #fff;
          border-top: 1px solid #c6cbd1;
        }
        
        table tr:nth-child(2n) {
          background-color: #f6f8fa;
        }
        
        img {
          max-width: 100%;
        }
        
        .back-link {
          display: inline-block;
          margin-bottom: 20px;
          color: #0366d6;
          text-decoration: none;
        }
        
        .back-link:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <a href="/" class="back-link">← 返回首页</a>
      <div class="markdown-body">
        ${htmlContent}
      </div>
    </body>
    </html>
    `;
    
    // 返回渲染后的HTML内容
    return new Response(fullHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
    
  } catch (error) {
    return new Response(`渲染Markdown时发生错误: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
} 