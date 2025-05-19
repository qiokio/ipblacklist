# IP黑名单系统 API接口开发手册

## 目录
- [概述](#概述)
- [基本信息](#基本信息)
- [API端点](#api端点)
- [错误处理](#错误处理)
- [示例代码](#示例代码)
- [开发指南](#开发指南)

## 概述

IP黑名单系统提供一组API，允许外部应用程序查询和管理IP黑名单。本手册详细介绍了可用的API端点、请求方法、参数和响应格式。

## 基本信息

- **基础URL**: `https://您的域名`
- **认证方式**: 当前API不需要认证
- **响应格式**: 所有API返回JSON格式
- **跨域支持**: 所有API支持CORS跨域请求

## API端点

### 1. 检查IP黑名单状态

#### 请求

```
GET /api/blacklist/check-external
```

**参数:**

| 参数 | 类型 | 必须 | 描述 |
|------|------|------|------|
| ip | string | 否 | 要检查的IP地址，如不提供则使用访问者当前IP |

#### 响应

```json
{
  "ip": "192.168.1.1",
  "blocked": false,
  "message": "此IP未被封禁"
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
- `500 Internal Server Error`: 服务器内部错误

### 2. 获取完整黑名单

#### 请求

```
GET /api/blacklist/get
```

#### 响应

```json
[
  "1.2.3.4",
  "5.6.7.8"
]
```

### 3. 添加IP到黑名单

#### 请求

```
POST /api/blacklist/add
```

**参数:**

| 参数 | 类型 | 必须 | 描述 |
|------|------|------|------|
| ip | string | 是 | 要添加到黑名单的IP地址 |

#### 响应

```json
{
  "success": true,
  "message": "IP已添加到黑名单"
}
```

### 4. 从黑名单移除IP

#### 请求

```
POST /api/blacklist/remove
```

**参数:**

| 参数 | 类型 | 必须 | 描述 |
|------|------|------|------|
| ip | string | 是 | 要从黑名单移除的IP地址 |

#### 响应

```json
{
  "success": true,
  "message": "IP已从黑名单移除"
}
```

### 5. 检查KV存储连接状态

#### 请求

```
GET /api/blacklist/check
```

#### 响应

```json
{
  "connected": true,
  "message": "KV连接正常"
}
```

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

## 示例代码

### JavaScript (浏览器)

```javascript
// 检查IP是否在黑名单中
async function checkIP(ip) {
  const response = await fetch('https://您的域名/api/blacklist/check-external?ip=' + ip);
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

### Python

```python
import requests

def check_ip(ip):
    response = requests.get(f'https://您的域名/api/blacklist/check-external?ip={ip}')
    return response.json()

# 使用示例
result = check_ip('8.8.8.8')
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

API文档版本: 1.0  
最后更新: 2025年5月 