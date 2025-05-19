# IP黑名单管理系统

这是一个使用Cloudflare Pages和KV存储管理IP黑名单的简单应用。

## 部署步骤

1. **准备工作**:
   - 安装Node.js (推荐v16+)
   - 全局安装Wrangler: `npm install -g wrangler`
   - 使用`wrangler login`登录Cloudflare账号

2. **创建KV命名空间**:
   - 在Cloudflare Dashboard中，进入"Workers & Pages" -> "KV"
   - 点击"创建命名空间"，命名为"IP_BLACKLIST"
   - 记下命名空间ID

3. **修改配置文件**:
   - 打开`wrangler.toml`和`pages.toml`
   - 将`YOUR_KV_NAMESPACE_ID_HERE`替换为您的KV命名空间ID

4. **部署方式一: 使用Wrangler CLI**:
   ```
   # 本地开发
   npm run dev
   
   # 部署到Cloudflare Pages
   npm run deploy
   ```

5. **部署方式二: 通过Cloudflare Dashboard**:
   - 创建一个Pages项目，连接到代码仓库
   - 在构建设置中，保持默认设置
   - 在"环境变量"设置中，添加KV绑定:
     - 变量名: `IP_BLACKLIST`
     - 选择刚才创建的KV命名空间
   - 点击"保存并部署"

## 文件结构

```
/
├── functions/           # Cloudflare Functions
│   ├── api/            # API端点
│   │   ├── init-kv.js  # KV初始化
│   │   └── blacklist/  # 黑名单操作
│   ├── _middleware.js  # 中间件
│   ├── _routes.json    # 路由配置
│   └── [[path]].js     # 通用处理程序
├── js/                 # 前端脚本
├── .well-known/        # 配置文件
├── wrangler.toml       # Wrangler配置
├── pages.toml          # Pages配置
└── index.html          # 主页面
```

## 故障排除

如果Cloudflare没有识别到Functions构建:
1. 确保`functions`目录存在且包含必要文件
2. 检查`package.json`和`wrangler.toml`是否正确配置
3. 尝试使用`wrangler pages dev`命令在本地测试
4. 如果使用Git部署，确保所有文件都已提交
5. 在Cloudflare控制台中检查构建日志查找错误

## 本地开发

```bash
# 安装依赖
npm install

# 本地开发服务器
npm run dev
``` 