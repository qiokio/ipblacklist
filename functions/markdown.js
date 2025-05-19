// 引入marked库用于Markdown解析
import { marked } from 'marked';

// 处理对Markdown文件的请求
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 调试信息
  console.log('请求路径:', path);
  
  // 检查是否是.md文件
  if (!path.endsWith('.md')) {
    return new Response(`不是Markdown文件: ${path}`, { 
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
  
  try {
    // 尝试直接获取文件内容
    console.log('尝试获取Markdown文件:', path);
    const mdResponse = await fetch(request);
    
    if (!mdResponse.ok) {
      console.log('获取Markdown文件失败:', mdResponse.status);
      return new Response(`无法找到Markdown文件: ${path}, 状态码: ${mdResponse.status}`, { 
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    
    // 获取Markdown内容
    const mdContent = await mdResponse.text();
    console.log('获取到Markdown内容:', mdContent.substring(0, 100) + '...');
    
    // 手动将Markdown转换为HTML
    const htmlContent = convertMarkdownToHTML(mdContent);
    console.log('转换后的HTML:', htmlContent.substring(0, 100) + '...');
    
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
    
    // 返回渲染后的HTML
    return new Response(fullHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('处理Markdown时出错:', error);
    return new Response(`渲染Markdown时发生错误: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// 简单的Markdown转HTML实现
function convertMarkdownToHTML(markdown) {
  // 处理标题
  let html = markdown
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
    .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
    .replace(/^###### (.*$)/gm, '<h6>$1</h6>');
    
  // 处理段落
  html = html.replace(/^\s*(\n)?(.+)/gm, function(m) {
    return /^<(\/)?(h\d|ul|ol|li|blockquote|pre|table)/.test(m) ? m : '<p>' + m + '</p>';
  });
  
  // 处理粗体和斜体
  html = html
    .replace(/\*\*(.*)\*\*/gm, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gm, '<em>$1</em>')
    .replace(/\_\_(.*)\_\_/gm, '<strong>$1</strong>')
    .replace(/\_(.*)\_/gm, '<em>$1</em>');
    
  // 处理链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gm, '<a href="$2">$1</a>');
  
  // 处理行内代码
  html = html.replace(/`([^`]+)`/gm, '<code>$1</code>');
  
  // 处理代码块
  html = html.replace(/```([\s\S]*?)```/gm, '<pre><code>$1</code></pre>');
  
  // 处理列表项
  html = html
    .replace(/^\s*\*\s(.+)/gm, '<ul><li>$1</li></ul>')
    .replace(/^\s*\d+\.\s(.+)/gm, '<ol><li>$1</li></ol>');
    
  // 合并相邻列表
  html = html
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/<\/ol>\s*<ol>/g, '');
    
  // 处理水平线
  html = html.replace(/^\s*\-{3,}\s*$/gm, '<hr>');
  
  // 清理段落内的换行和HTML
  html = html.replace(/<p>([\s\S]*?)<\/p>/gm, function(match, content) {
    return '<p>' + content.replace(/\n/g, '<br>') + '</p>';
  });
  
  return html;
} 