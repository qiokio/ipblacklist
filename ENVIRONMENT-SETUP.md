# IP黑名单系统环境变量配置

## 概述

本文档介绍如何为IP黑名单系统配置必要的环境变量，确保系统安全且正常运行。

## 必要的环境变量

以下环境变量必须在部署时设置：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| ADMIN_USERNAME | 管理员账户用户名 | admin |
| ADMIN_PASSWORD | 管理员账户密码 | complex-password-123 |
| JWT_SECRET | JWT令牌签名密钥 | your-strong-random-secret-key |

## 配置方法

### 本地开发环境

1. 在项目根目录创建 `.dev.vars` 文件（该文件已在 .gitignore 中，不会被提交）
2. 按照以下格式添加环境变量：

```
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-password"
JWT_SECRET="your-secret-key"
```

3. 使用 `wrangler pages dev` 启动本地开发服务器

### Cloudflare Pages 部署

#### 使用 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入您的项目 -> Pages -> 选择您的应用
3. 进入 "Settings" -> "Environment variables"
4. 添加所需的环境变量
5. 确保将敏感变量（如 ADMIN_PASSWORD 和 JWT_SECRET）标记为 "Encrypted"

#### 使用 wrangler.toml

在 `wrangler.toml` 文件中，您可以为生产环境添加默认值：

```toml
[vars]
ADMIN_USERNAME = "admin"
# 不要在此处放置实际密码和密钥，应通过Dashboard或CI/CD系统设置
```

## 安全建议

1. 使用强密码作为 ADMIN_PASSWORD
2. 使用至少32字符的随机字符串作为 JWT_SECRET
3. 定期更换密码和密钥
4. 不要将实际密码和密钥提交到代码仓库
5. 在生产环境中，使用Cloudflare Dashboard或CI/CD系统设置敏感环境变量

## 故障排除

如果遇到登录问题，请检查：

1. 环境变量是否正确设置
2. JWT_SECRET 是否一致（更改后需要所有用户重新登录）
3. 检查控制台日志了解更详细的错误信息 