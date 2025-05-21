# IP黑名单系统 API接口开发手册

## 目录
- [概述](#概述)
- [基本信息](#基本信息)
- [API端点](#api端点)
- [认证API](#认证api)
- [错误处理](#错误处理)
- [示例代码](#示例代码)
- [开发指南](#开发指南)

## 概述

IP黑名单系统提供一组API，允许外部应用程序查询和管理IP黑名单。本手册详细介绍了可用的API端点、请求方法、参数和响应格式。

## 基本信息

- **基础URL**: `https://您的域名`
- **认证方式**: 
  - API密钥认证：可通过请求体的`key`字段传递（推荐）或通过URL参数`key`传递（向后兼容）
  - JWT认证：可通过请求体的`token`字段传递（推荐）或通过`Authorization: Bearer <token>`头传递（向后兼容）
- **响应格式**: 所有API返回JSON格式
- **跨域支持**: 所有API支持CORS跨域请求

## API端点

### 1. 检查IP黑名单状态

#### 请求

```
GET /api/blacklist/check-api
```

或（推荐）

```
POST /api/blacklist/check-api
Content-Type: application/json

{
  "key": "your-api-key",
  "ip": "192.168.1.1"
}
```

**URL参数:** (GET方法或向后兼容)

| 参数 | 类型 | 必须 | 描述 |
|------|------|------|------|
| ip | string | 否 | 要检查的IP地址，如不提供则使用访问者当前IP |
| key | string | 是 | API密钥，用于认证请求（必须具有读取权限） |

**请求体参数:** (POST方法，推荐)

| 参数 | 类型 | 必须 | 描述 |
|------|------|------|------|
| ip | string | 否 | 要检查的IP地址，如不提供则使用访问者当前IP |
| key | string | 是 | API密钥，用于认证请求（必须具有读取权限） |

#### 响应

```json
{
  "ip": "192.168.1.1",
  "blocked": false,
  "message": "IP 192.168.1.1 不在黑名单中"
}
```

**字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| ip | string | 被查询的IP地址 |
| blocked | boolean | 是否在黑名单中 |
| message | string | 状态描述信息 |

#### 状态码

- `200 OK`: 请求成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: API密钥无效或权限不足
- `500 Internal Server Error`: 服务器内部错误

### 2. 获取完整黑名单

#### 请求

```
GET /api/blacklist/get
Authorization: Bearer {token}
```

或（推荐）

```
POST /api/blacklist/get
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**认证要求**: 需要JWT认证，可通过请求体的`token`字段传递（推荐）或通过`Authorization: Bearer <token>`头传递（向后兼容）

#### 响应

```json
[
  "1.2.3.4",
  "5.6.7.8"
]
```

### 4. 添加IP到黑名单

#### 请求

```
POST /api/blacklist/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "ip": "192.168.1.1"
}
```

或（推荐）

```
POST /api/blacklist/add
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "ip": "192.168.1.1"
}
```

**认证要求**: 需要JWT认证，可通过请求体的`token`字段传递（推荐）或通过`Authorization: Bearer <token>`头传递（向后兼容）

**参数:**

| 参数 | 类型 | 必须 | 描述 |
|------|------|------|------|
| ip | string | 是 | 要添加到黑名单的IP地址 |
| token | string | 是 | JWT认证令牌（使用推荐方式时）|

#### 响应

```json
{
  "success": true,
  "message": "IP已添加到黑名单"
}
```

### 5. 从黑名单移除IP

#### 请求

```
POST /api/blacklist/remove
Authorization: Bearer {token}
Content-Type: application/json

{
  "ip": "192.168.1.1"
}
```

或（推荐）

```
POST /api/blacklist/remove
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "ip": "192.168.1.1"
}
```

**认证要求**: 需要JWT认证，可通过请求体的`token`字段传递（推荐）或通过`Authorization: Bearer <token>`头传递（向后兼容）

**参数:**

| 参数 | 类型 | 必须 | 描述 |
|------|------|------|------|
| ip | string | 是 | 要从黑名单移除的IP地址 |
| token | string | 是 | JWT认证令牌（使用推荐方式时）|

#### 响应

```json
{
  "success": true,
  "message": "IP已从黑名单移除"
}
```

### 6. 检查KV存储连接状态

#### 请求

```
GET /api/blacklist/check
Authorization: Bearer {token}
```

或（推荐）

```
POST /api/blacklist/check
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**认证要求**: 需要JWT认证，可通过请求体的`token`字段传递（推荐）或通过`Authorization: Bearer <token>`头传递（向后兼容）

#### 响应

```json
{
  "connected": true,
  "message": "KV连接正常"
}
```

## 认证API

### 1. 用户登录

#### 请求

```
POST /api/auth/login
```

**参数:**

| 参数 | 类型 | 必须 | 描述 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

#### 响应

```json
{
  "success": true,
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNjE4OTk0NDAwfQ.3fVQlR-iyzlnUzjzGjkZ8TL5hC8vK4j8e4u2J5TvdK0"
}
```

### 2. 验证令牌

#### 请求

```
GET /api/auth/verify
Authorization: Bearer {token}
```

或（推荐）

```
POST /api/auth/verify
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**请求头:** (GET方法或向后兼容)

| 头部 | 值 | 描述 |
|------|------|------|
| Authorization | Bearer {token} | JWT认证令牌 |

**请求体参数:** (POST方法，推荐)

| 参数 | 类型 | 必须 | 描述 |
|------|------|------|------|
| token | string | 是 | JWT认证令牌 |

#### 响应

```json
{
  "valid": true,
  "message": "认证令牌有效",
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

## API密钥管理

### 1. 创建API密钥

#### 请求

```
POST /api/apikey/create
```

**认证要求**: 需要JWT认证

**参数:**

| 参数 | 类型 | 必须 | 描述 |
|------|------|------|------|
| key | string | 是 | API密钥值 |
| note | string | 否 | API密钥备注 |
| createdAt | string | 否 | 创建时间(ISO格式) |

#### 响应

```json
{
  "success": true,
  "message": "API密钥创建成功"
}
```

### 2. 获取API密钥列表

#### 请求

```
GET /api/apikey/list
```

**认证要求**: 需要JWT认证

#### 响应

```json
[
  {
    "key": "abcdef1234567890",
    "note": "测试API",
    "createdAt": "2023-07-01T12:00:00.000Z"
  },
  {
    "key": "zyxwvu9876543210",
    "note": "生产环境",
    "createdAt": "2023-07-02T15:30:00.000Z"
  }
]
```

### 3. 更新API密钥备注

#### 请求

```
POST /api/apikey/update
```

**认证要求**: 需要JWT认证

**参数:**

| 参数 | 类型 | 必须 | 描述 |
|------|------|------|------|
| key | string | 是 | 要更新的API密钥 |
| note | string | 是 | 新的备注内容 |

#### 响应

```json
{
  "success": true,
  "message": "API密钥更新成功"
}
```

### 4. 删除API密钥

#### 请求

```
POST /api/apikey/delete
```

**认证要求**: 需要JWT认证

**参数:**

| 参数 | 类型 | 必须 | 描述 |
|------|------|------|------|
| key | string | 是 | 要删除的API密钥 |

#### 响应

```json
{
  "success": true,
  "message": "API密钥删除成功"
}
```

## API密钥认证

某些API端点支持使用API密钥进行认证，这对于需要在不登录的情况下集成IP黑名单功能的系统非常有用。

### API密钥权限

当创建API密钥时，可以为其分配以下权限：

1. **查询IP** (`read`): 允许查询IP是否在黑名单中（默认允许且不可禁用）
2. **获取IP列表** (`list`): 允许获取完整的IP黑名单列表
3. **添加IP** (`add`): 允许向黑名单添加IP地址
4. **删除IP** (`delete`): 允许从黑名单删除IP地址

每个API密钥可以拥有不同的权限组合，允许您根据需要控制不同集成系统的访问级别。

### 使用API密钥访问API

#### 1. 查询IP是否在黑名单中

```
GET /api/blacklist/check-api?key=YOUR_API_KEY&ip=1.2.3.4
```

响应示例:
```json
{
  "ip": "1.2.3.4",
  "blocked": true,
  "message": "IP 1.2.3.4 在黑名单中"
}
```

#### 2. 获取完整IP黑名单列表

```
GET /api/blacklist/get-api?key=YOUR_API_KEY
```

响应示例:
```json
[
  "1.2.3.4",
  "5.6.7.8",
  "9.10.11.12"
]
```

#### 3. 添加IP到黑名单

```
POST /api/blacklist/add-api
```

请求体:
```json
{
  "ip": "1.2.3.4",
  "key": "YOUR_API_KEY"
}
```

响应示例:
```json
{
  "success": true,
  "message": "IP 1.2.3.4 已添加到黑名单",
  "count": 3
}
```

#### 4. 从黑名单删除IP

```
POST /api/blacklist/remove-api
```

请求体:
```json
{
  "ip": "1.2.3.4",
  "key": "YOUR_API_KEY"
}
```

响应示例:
```json
{
  "success": true,
  "message": "IP 1.2.3.4 已从黑名单中移除",
  "count": 2
}
```

### API密钥安全建议

1. **妥善保管API密钥**: API密钥具有操作您黑名单的能力，请妥善保管
2. **最小权限原则**: 只授予API密钥执行其功能所需的最小权限
3. **定期轮换**: 定期创建新的API密钥并淘汰旧密钥，尤其是当您怀疑密钥可能被泄露时
4. **使用环境变量**: 在您的代码中，使用环境变量而不是硬编码API密钥
5. **监控使用情况**: 关注API密钥的使用情况，发现异常时立即采取行动

## 错误处理

当API调用出错时，响应中将包含以下字段：

```json
{
  "error": "错误的技术描述",
  "message": "用户友好的错误信息"
}
```

常见错误：

- IP格式无效
- 黑名单数据读取失败
- KV存储连接失败
- 认证令牌无效或已过期
- 未提供认证令牌

## 示例代码

### JavaScript (浏览器)

```javascript
// 检查IP是否在黑名单中
async function checkIP(ip) {
  const response = await fetch('https://您的域名/api/blacklist/check-api?ip=' + ip);
  const data = await response.json();
  return data;
}

// 使用示例
checkIP('8.8.8.8')
  .then(result => {
    if (result.blocked) {
      console.log('IP已被封禁');
    } else {
      console.log('IP未被封禁');
    }
  })
  .catch(error => {
    console.error('请求失败:', error);
  });
```

### 带认证的请求示例

```javascript
// 获取黑名单列表（需要认证）
async function getBlacklist(token) {
  const response = await fetch('https://您的域名/api/blacklist/get', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data;
}

// 登录后获取令牌
async function login(username, password) {
  const response = await fetch('https://您的域名/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  return data;
}

// 使用示例
login('admin', 'password')
  .then(result => {
    if (result.success) {
      return getBlacklist(result.token);
    } else {
      console.error('登录失败:', result.message);
    }
  })
  .then(blacklist => {
    console.log('IP黑名单:', blacklist);
  })
  .catch(error => {
    console.error('请求失败:', error);
  });
```

### 使用API密钥进行查询

```javascript
// 使用API密钥查询IP是否在黑名单中
async function checkIPWithApiKey(ip, apiKey) {
  const response = await fetch(`https://您的域名/api/blacklist/check-api?ip=${ip}&key=${apiKey}`);
  const data = await response.json();
  return data;
}

// 使用示例
const API_KEY = '您的API密钥';
checkIPWithApiKey('8.8.8.8', API_KEY)
  .then(result => {
    if (result.blocked) {
      console.log('IP已被封禁');
    } else {
      console.log('IP未被封禁');
    }
  })
  .catch(error => {
    console.error('请求失败:', error);
  });
```

### Python

```python
import requests

def check_ip(ip):
    response = requests.get(f'https://您的域名/api/blacklist/check-api?ip={ip}')
    return response.json()

# 使用示例
result = check_ip('8.8.8.8')
if result['blocked']:
    print('IP已被封禁')
else:
    print('IP未被封禁')
```

### Python使用API密钥

```python
import requests

def check_ip_with_api_key(ip, api_key):
    response = requests.get(f'https://您的域名/api/blacklist/check-api?ip={ip}&key={api_key}')
    return response.json()

# 使用示例
API_KEY = '您的API密钥'
result = check_ip_with_api_key('8.8.8.8', API_KEY)
if result['blocked']:
    print('IP已被封禁')
else:
    print('IP未被封禁')
```

## 开发指南

### 新增API端点

如需添加新的API端点，请按照以下步骤：

1. 在`functions/api/blacklist/`目录下创建新的JavaScript文件
2. 导出相应的HTTP方法处理函数（如`onRequestGet`、`onRequestPost`等）
3. 实现业务逻辑，使用`env.IP_BLACKLIST`访问KV存储
4. 返回标准化的JSON响应

示例：

```javascript
// 新API端点模板
export const onRequestGet = async (context) => {
    const { env, request } = context;
    
    // 设置CORS头
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    try {
        // 实现业务逻辑
        
        return new Response(JSON.stringify({
            // 响应数据
        }), { headers });
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message,
            message: '操作失败'
        }), {
            status: 500,
            headers
        });
    }
};
```

### 认证中间件

如需要添加认证功能到API端点，请参考以下示例：

```javascript
// 验证JWT令牌
async function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    return { valid: false, message: '未提供认证令牌' };
  }
  
  try {
    // 使用JWT验证令牌
    const jwtSecret = env.JWT_SECRET || 'your-secret-key';
    const payload = verify(token, jwtSecret);
    
    // 检查令牌是否过期
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      return { valid: false, message: '认证令牌已过期' };
    }
    
    return { valid: true, user: payload };
  } catch (error) {
    return { valid: false, message: '无效的认证令牌' };
  }
}

// 在API端点中使用认证
export const onRequestGet = async (context) => {
  const { request, env } = context;
  const headers = { /* CORS头部 */ };
  
  // 验证认证
  const auth = await verifyAuth(request, env);
  if (!auth.valid) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: auth.message
    }), {
      status: 401,
      headers
    });
  }
  
  // 认证成功，继续处理请求
  // ...
};
```

### 环境变量配置

本系统使用以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| ADMIN_USERNAME | 管理员账户用户名 | admin |
| ADMIN_PASSWORD | 管理员账户密码 | complex-password-123 |
| JWT_SECRET | JWT令牌签名密钥 | your-strong-random-secret-key |

您可以通过以下方式配置环境变量：

1. 在 `.dev.vars` 文件中配置本地开发环境变量
2. 在 Cloudflare Dashboard 中为生产环境配置环境变量
3. 在 `wrangler.toml` 的 `[vars]` 部分配置非敏感默认值

详细配置说明请参阅 `ENVIRONMENT-SETUP.md` 文件。

### 测试和部署

1. 本地测试：使用Wrangler CLI进行本地开发和测试
2. 部署：使用Git推送或Wrangler CLI部署到Cloudflare Pages

```bash
# 本地开发
npx wrangler pages dev

# 部署
npx wrangler pages publish
```

---

API文档版本: 1.2  
最后更新: 2023年7月