# IP黑名单系统开发指南

## 目录

- [概述](#概述)
- [认证方式更新](#认证方式更新)
- [API密钥传递方式](#api密钥传递方式)
- [JWT令牌传递方式](#jwt令牌传递方式)
- [向后兼容性](#向后兼容性)
- [最佳实践](#最佳实践)
- [示例代码](#示例代码)

## 概述

本文档详细介绍了IP黑名单系统的开发指南，特别是关于API密钥和JWT令牌的传递方式的更新。系统现在支持通过请求体传递认证信息，这提高了安全性并符合现代API设计最佳实践。

## 认证方式更新

系统支持两种认证方式：

1. **API密钥认证**：用于外部系统访问黑名单查询API
2. **JWT令牌认证**：用于管理界面和管理API

这两种认证方式都已更新，现在**优先支持通过请求体传递认证信息**，同时保持对原有传递方式的向后兼容性。

## API密钥传递方式

### 新方式（推荐）

通过请求体传递API密钥：

```http
POST /api/blacklist/check-api
Content-Type: application/json

{
  "key": "your-api-key",
  "ip": "192.168.1.1"
}
```

### 旧方式（仍支持，但不推荐）

通过URL参数传递API密钥：

```http
GET /api/blacklist/check-api?key=your-api-key&ip=192.168.1.1
```

## JWT令牌传递方式

### 新方式（推荐）

通过请求体传递JWT令牌：

```http
POST /api/auth/verify
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 旧方式（仍支持，但不推荐）

通过Authorization头传递JWT令牌：

```http
GET /api/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 向后兼容性

系统保持向后兼容性，处理认证信息的逻辑如下：

1. 对于API密钥：
   - 首先检查请求体中是否包含`key`字段
   - 如果请求体中没有，则检查URL参数中是否包含`key`参数
   - 如果两处都没有，则返回认证错误

2. 对于JWT令牌：
   - 首先检查请求体中是否包含`token`字段
   - 如果请求体中没有，则检查Authorization头是否包含Bearer令牌
   - 如果两处都没有，则返回认证错误

## 最佳实践

1. **始终使用HTTPS**：无论使用哪种认证方式，都应确保通过HTTPS传输，防止认证信息被窃取

2. **优先使用请求体传递认证信息**：
   - 更安全，不会出现在URL中（避免在日志中泄露）
   - 符合REST API设计最佳实践
   - 支持更复杂的认证结构

3. **设置合理的CORS策略**：确保只有受信任的域名可以访问API

4. **实现速率限制**：防止暴力破解攻击

5. **定期轮换API密钥**：降低密钥泄露的风险

## 示例代码

### JavaScript (Fetch API)

```javascript
// 使用API密钥查询IP状态（新方式）
async function checkIpStatus(apiKey, ip) {
  const response = await fetch('/api/blacklist/check-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      key: apiKey,
      ip: ip 
    })
  });
  return await response.json();
}

// 使用JWT令牌验证（新方式）
async function verifyToken(token) {
  const response = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token })
  });
  return await response.json();
}
```

### Python (Requests)

```python
import requests

# 使用API密钥查询IP状态（新方式）
def check_ip_status(api_key, ip):
    response = requests.post(
        'https://your-domain.com/api/blacklist/check-api',
        json={'key': api_key, 'ip': ip}
    )
    return response.json()

# 使用JWT令牌验证（新方式）
def verify_token(token):
    response = requests.post(
        'https://your-domain.com/api/auth/verify',
        json={'token': token}
    )
    return response.json()
```

### PHP (cURL)

```php
// 使用API密钥查询IP状态（新方式）
function checkIpStatus($apiKey, $ip) {
    $ch = curl_init('https://your-domain.com/api/blacklist/check-api');
    $data = json_encode(['key' => $apiKey, 'ip' => $ip]);
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}
```