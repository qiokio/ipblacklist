// Cloudflare Pages Functions - 示例页面，展示如何使用API
export const onRequestGet = async (context) => {
    const { request } = context;
    
    // 获取当前域名，用于演示
    const url = new URL(request.url);
    const domain = `${url.protocol}//${url.host}`;
    
    const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IP黑名单API使用示例</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            pre {
                background: #f5f5f5;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
            }
            code {
                font-family: Consolas, monospace;
            }
            .result {
                margin-top: 20px;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            button {
                padding: 8px 16px;
                background: #0070f3;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            input {
                padding: 8px;
                margin-right: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <h1>IP黑名单API使用示例</h1>
        
        <h2>API端点</h2>
        <pre><code>GET ${domain}/api/blacklist/check-external?ip=要检查的IP地址</code></pre>
        
        <h2>示例响应</h2>
        <pre><code>{
  "ip": "192.168.1.1",
  "blocked": false,
  "message": "此IP未被封禁"
}</code></pre>
        
        <h2>JavaScript调用示例</h2>
        <pre><code>async function checkIP(ip) {
  const response = await fetch('${domain}/api/blacklist/check-external?ip=' + ip);
  const data = await response.json();
  return data;
}</code></pre>
        
        <h2>测试API</h2>
        <div>
            <input type="text" id="ipInput" placeholder="输入IP地址" value="">
            <button onclick="testAPI()">检查IP</button>
        </div>
        
        <div class="result" id="result">
            <p>结果将显示在这里...</p>
        </div>
        
        <script>
            async function testAPI() {
                const ip = document.getElementById('ipInput').value.trim();
                if (!ip) {
                    document.getElementById('result').innerHTML = '<p>请输入IP地址</p>';
                    return;
                }
                
                try {
                    document.getElementById('result').innerHTML = '<p>正在检查...</p>';
                    
                    const response = await fetch('${domain}/api/blacklist/check-external?ip=' + ip);
                    const data = await response.json();
                    
                    document.getElementById('result').innerHTML = 
                        '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                } catch (error) {
                    document.getElementById('result').innerHTML = 
                        '<p>错误: ' + error.message + '</p>';
                }
            }
            
            // 使用当前IP自动填充
            fetch('${domain}/api/blacklist/check-external')
                .then(response => response.json())
                .then(data => {
                    if (data.ip) {
                        document.getElementById('ipInput').value = data.ip;
                    }
                })
                .catch(error => console.error('无法获取当前IP:', error));
        </script>
    </body>
    </html>
    `;
    
    return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
    });
}; 