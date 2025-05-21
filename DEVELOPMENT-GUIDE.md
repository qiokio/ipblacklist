# IP黑名单系统开发指南

## 目录

- [概述](#概述)
- [认证方式更新](#认证方式更新)
- [API密钥传递方式](#api密钥传递方式)
- [JWT令牌传递方式](#jwt令牌传递方式)
- [向后兼容性](#向后兼容性)
- [最佳实践](#最佳实践)
- [示例代码](#示例代码)
- [错误处理](#错误处理)
- [性能优化](#性能优化)
- [安全建议](#安全建议)

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

```
POST /api/blacklist/check-api
Content-Type: application/json

{
  "key": "your-api-key",
  "ip": "192.168.1.1"
}
```

## 错误处理

在与API交互时，应当正确处理可能出现的错误情况：

| 状态码 | 描述 | 处理建议 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数是否正确，特别是IP地址格式 |
| 401 | 认证失败 | 检查API密钥或JWT令牌是否有效 |
| 403 | 权限不足 | 确认使用的API密钥是否有足够的权限 |
| 429 | 请求过多 | 实现退避策略，减少请求频率 |
| 500 | 服务器内部错误 | 联系系统管理员，并提供错误详情 |

### 错误处理示例（JavaScript）

```javascript
async function checkIpStatus(apiKey, ipAddress) {
  try {
    const response = await fetch('https://your-domain.com/api/blacklist/check-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: apiKey,
        ip: ipAddress
      })
    });
    
    if (response.status === 400) {
      throw new Error('请求参数错误，请检查IP地址格式');
    } else if (response.status === 401) {
      throw new Error('认证失败，请检查API密钥');
    } else if (response.status === 429) {
      throw new Error('请求频率过高，请稍后再试');
    } else if (response.status === 500) {
      throw new Error('服务器内部错误，请联系管理员');
    } else if (!response.ok) {
      throw new Error(`未知错误，状态码: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('检查IP状态时出错:', error);
    // 可以在这里实现重试逻辑或其他错误处理
    throw error;
  }
}
```

## 性能优化

1. **实现缓存机制**：对于频繁查询的IP地址，可以在客户端实现缓存，减少API调用次数

   ```javascript
   // 简单的缓存实现示例
   const ipCache = new Map();
   const CACHE_TTL = 60 * 60 * 1000; // 1小时缓存

   async function checkIpStatusWithCache(apiKey, ipAddress) {
     // 检查缓存
     if (ipCache.has(ipAddress)) {
       const cachedData = ipCache.get(ipAddress);
       if (Date.now() - cachedData.timestamp < CACHE_TTL) {
         return cachedData.data;
       }
     }
     
     // 缓存未命中，调用API
     const result = await checkIpStatus(apiKey, ipAddress);
     
     // 更新缓存
     ipCache.set(ipAddress, {
       data: result,
       timestamp: Date.now()
     });
     
     return result;
   }
   ```

2. **批量操作**：如果需要检查多个IP地址，考虑使用批量API（如果系统支持）或实现并发请求

3. **异步处理**：对于非关键路径的IP检查，可以考虑异步处理，不阻塞主流程

4. **减少不必要的请求**：只在必要时进行API调用，避免冗余请求

## 安全建议

1. **不要在客户端代码中硬编码API密钥**：应当从服务器端环境变量或安全存储中获取

   ```javascript
   // 不推荐 - 在前端代码中硬编码API密钥
   const API_KEY = 'your-api-key-123';
   
   // 推荐 - 从服务器端获取API密钥
   async function getApiKey() {
     const response = await fetch('/get-api-key', {
       credentials: 'same-origin' // 确保请求包含cookies
     });
     const data = await response.json();
     return data.apiKey;
   }
   ```

2. **实现API密钥轮换机制**：定期更换API密钥，并确保系统能够平滑过渡

3. **监控异常访问模式**：实现监控系统，检测可能的API滥用行为

4. **限制API密钥权限范围**：根据实际需要分配最小权限

5. **实现IP白名单**：限制API密钥只能从特定IP地址使用

6. **记录详细的访问日志**：包括请求IP、时间、使用的API密钥（部分隐藏）等信息，便于审计和问题排查

7. **使用HTTPS**：确保所有API通信都通过HTTPS进行，防止中间人攻击

8. **实现请求签名**：对于高安全性要求的场景，可以考虑实现请求签名机制，确保请求未被篡改

### 旧方式（仍支持，但不推荐）

通过URL参数传递API密钥：

```
GET /api/blacklist/check-api?key=your-api-key&ip=192.168.1.1
```

## 错误处理

在与API交互时，应当正确处理可能出现的错误情况：

| 状态码 | 描述 | 处理建议 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数是否正确，特别是IP地址格式 |
| 401 | 认证失败 | 检查API密钥或JWT令牌是否有效 |
| 403 | 权限不足 | 确认使用的API密钥是否有足够的权限 |
| 429 | 请求过多 | 实现退避策略，减少请求频率 |
| 500 | 服务器内部错误 | 联系系统管理员，并提供错误详情 |

### 错误处理示例（JavaScript）

```javascript
async function checkIpStatus(apiKey, ipAddress) {
  try {
    const response = await fetch('https://your-domain.com/api/blacklist/check-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: apiKey,
        ip: ipAddress
      })
    });
    
    if (response.status === 400) {
      throw new Error('请求参数错误，请检查IP地址格式');
    } else if (response.status === 401) {
      throw new Error('认证失败，请检查API密钥');
    } else if (response.status === 429) {
      throw new Error('请求频率过高，请稍后再试');
    } else if (response.status === 500) {
      throw new Error('服务器内部错误，请联系管理员');
    } else if (!response.ok) {
      throw new Error(`未知错误，状态码: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('检查IP状态时出错:', error);
    // 可以在这里实现重试逻辑或其他错误处理
    throw error;
  }
}
```

## 性能优化

1. **实现缓存机制**：对于频繁查询的IP地址，可以在客户端实现缓存，减少API调用次数

   ```javascript
   // 简单的缓存实现示例
   const ipCache = new Map();
   const CACHE_TTL = 60 * 60 * 1000; // 1小时缓存

   async function checkIpStatusWithCache(apiKey, ipAddress) {
     // 检查缓存
     if (ipCache.has(ipAddress)) {
       const cachedData = ipCache.get(ipAddress);
       if (Date.now() - cachedData.timestamp < CACHE_TTL) {
         return cachedData.data;
       }
     }
     
     // 缓存未命中，调用API
     const result = await checkIpStatus(apiKey, ipAddress);
     
     // 更新缓存
     ipCache.set(ipAddress, {
       data: result,
       timestamp: Date.now()
     });
     
     return result;
   }
   ```

2. **批量操作**：如果需要检查多个IP地址，考虑使用批量API（如果系统支持）或实现并发请求

3. **异步处理**：对于非关键路径的IP检查，可以考虑异步处理，不阻塞主流程

4. **减少不必要的请求**：只在必要时进行API调用，避免冗余请求

## 安全建议

1. **不要在客户端代码中硬编码API密钥**：应当从服务器端环境变量或安全存储中获取

   ```javascript
   // 不推荐 - 在前端代码中硬编码API密钥
   const API_KEY = 'your-api-key-123';
   
   // 推荐 - 从服务器端获取API密钥
   async function getApiKey() {
     const response = await fetch('/get-api-key', {
       credentials: 'same-origin' // 确保请求包含cookies
     });
     const data = await response.json();
     return data.apiKey;
   }
   ```

2. **实现API密钥轮换机制**：定期更换API密钥，并确保系统能够平滑过渡

3. **监控异常访问模式**：实现监控系统，检测可能的API滥用行为

4. **限制API密钥权限范围**：根据实际需要分配最小权限

5. **实现IP白名单**：限制API密钥只能从特定IP地址使用

6. **记录详细的访问日志**：包括请求IP、时间、使用的API密钥（部分隐藏）等信息，便于审计和问题排查

7. **使用HTTPS**：确保所有API通信都通过HTTPS进行，防止中间人攻击

8. **实现请求签名**：对于高安全性要求的场景，可以考虑实现请求签名机制，确保请求未被篡改

## JWT令牌传递方式

### 新方式（推荐）

通过请求体传递JWT令牌：

```
POST /api/auth/verify
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 错误处理

在与API交互时，应当正确处理可能出现的错误情况：

| 状态码 | 描述 | 处理建议 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数是否正确，特别是IP地址格式 |
| 401 | 认证失败 | 检查API密钥或JWT令牌是否有效 |
| 403 | 权限不足 | 确认使用的API密钥是否有足够的权限 |
| 429 | 请求过多 | 实现退避策略，减少请求频率 |
| 500 | 服务器内部错误 | 联系系统管理员，并提供错误详情 |

### 错误处理示例（JavaScript）

```javascript
async function checkIpStatus(apiKey, ipAddress) {
  try {
    const response = await fetch('https://your-domain.com/api/blacklist/check-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: apiKey,
        ip: ipAddress
      })
    });
    
    if (response.status === 400) {
      throw new Error('请求参数错误，请检查IP地址格式');
    } else if (response.status === 401) {
      throw new Error('认证失败，请检查API密钥');
    } else if (response.status === 429) {
      throw new Error('请求频率过高，请稍后再试');
    } else if (response.status === 500) {
      throw new Error('服务器内部错误，请联系管理员');
    } else if (!response.ok) {
      throw new Error(`未知错误，状态码: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('检查IP状态时出错:', error);
    // 可以在这里实现重试逻辑或其他错误处理
    throw error;
  }
}
```

## 性能优化

1. **实现缓存机制**：对于频繁查询的IP地址，可以在客户端实现缓存，减少API调用次数

   ```javascript
   // 简单的缓存实现示例
   const ipCache = new Map();
   const CACHE_TTL = 60 * 60 * 1000; // 1小时缓存

   async function checkIpStatusWithCache(apiKey, ipAddress) {
     // 检查缓存
     if (ipCache.has(ipAddress)) {
       const cachedData = ipCache.get(ipAddress);
       if (Date.now() - cachedData.timestamp < CACHE_TTL) {
         return cachedData.data;
       }
     }
     
     // 缓存未命中，调用API
     const result = await checkIpStatus(apiKey, ipAddress);
     
     // 更新缓存
     ipCache.set(ipAddress, {
       data: result,
       timestamp: Date.now()
     });
     
     return result;
   }
   ```

2. **批量操作**：如果需要检查多个IP地址，考虑使用批量API（如果系统支持）或实现并发请求

3. **异步处理**：对于非关键路径的IP检查，可以考虑异步处理，不阻塞主流程

4. **减少不必要的请求**：只在必要时进行API调用，避免冗余请求

## 安全建议

1. **不要在客户端代码中硬编码API密钥**：应当从服务器端环境变量或安全存储中获取

   ```javascript
   // 不推荐 - 在前端代码中硬编码API密钥
   const API_KEY = 'your-api-key-123';
   
   // 推荐 - 从服务器端获取API密钥
   async function getApiKey() {
     const response = await fetch('/get-api-key', {
       credentials: 'same-origin' // 确保请求包含cookies
     });
     const data = await response.json();
     return data.apiKey;
   }
   ```

2. **实现API密钥轮换机制**：定期更换API密钥，并确保系统能够平滑过渡

3. **监控异常访问模式**：实现监控系统，检测可能的API滥用行为

4. **限制API密钥权限范围**：根据实际需要分配最小权限

5. **实现IP白名单**：限制API密钥只能从特定IP地址使用

6. **记录详细的访问日志**：包括请求IP、时间、使用的API密钥（部分隐藏）等信息，便于审计和问题排查

7. **使用HTTPS**：确保所有API通信都通过HTTPS进行，防止中间人攻击

8. **实现请求签名**：对于高安全性要求的场景，可以考虑实现请求签名机制，确保请求未被篡改

### 旧方式（仍支持，但不推荐）

通过Authorization头传递JWT令牌：

```
GET /api/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 错误处理

在与API交互时，应当正确处理可能出现的错误情况：

| 状态码 | 描述 | 处理建议 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数是否正确，特别是IP地址格式 |
| 401 | 认证失败 | 检查API密钥或JWT令牌是否有效 |
| 403 | 权限不足 | 确认使用的API密钥是否有足够的权限 |
| 429 | 请求过多 | 实现退避策略，减少请求频率 |
| 500 | 服务器内部错误 | 联系系统管理员，并提供错误详情 |

### 错误处理示例（JavaScript）

```javascript
async function checkIpStatus(apiKey, ipAddress) {
  try {
    const response = await fetch('https://your-domain.com/api/blacklist/check-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: apiKey,
        ip: ipAddress
      })
    });
    
    if (response.status === 400) {
      throw new Error('请求参数错误，请检查IP地址格式');
    } else if (response.status === 401) {
      throw new Error('认证失败，请检查API密钥');
    } else if (response.status === 429) {
      throw new Error('请求频率过高，请稍后再试');
    } else if (response.status === 500) {
      throw new Error('服务器内部错误，请联系管理员');
    } else if (!response.ok) {
      throw new Error(`未知错误，状态码: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('检查IP状态时出错:', error);
    // 可以在这里实现重试逻辑或其他错误处理
    throw error;
  }
}
```

## 性能优化

1. **实现缓存机制**：对于频繁查询的IP地址，可以在客户端实现缓存，减少API调用次数

   ```javascript
   // 简单的缓存实现示例
   const ipCache = new Map();
   const CACHE_TTL = 60 * 60 * 1000; // 1小时缓存

   async function checkIpStatusWithCache(apiKey, ipAddress) {
     // 检查缓存
     if (ipCache.has(ipAddress)) {
       const cachedData = ipCache.get(ipAddress);
       if (Date.now() - cachedData.timestamp < CACHE_TTL) {
         return cachedData.data;
       }
     }
     
     // 缓存未命中，调用API
     const result = await checkIpStatus(apiKey, ipAddress);
     
     // 更新缓存
     ipCache.set(ipAddress, {
       data: result,
       timestamp: Date.now()
     });
     
     return result;
   }
   ```

2. **批量操作**：如果需要检查多个IP地址，考虑使用批量API（如果系统支持）或实现并发请求

3. **异步处理**：对于非关键路径的IP检查，可以考虑异步处理，不阻塞主流程

4. **减少不必要的请求**：只在必要时进行API调用，避免冗余请求

## 安全建议

1. **不要在客户端代码中硬编码API密钥**：应当从服务器端环境变量或安全存储中获取

   ```javascript
   // 不推荐 - 在前端代码中硬编码API密钥
   const API_KEY = 'your-api-key-123';
   
   // 推荐 - 从服务器端获取API密钥
   async function getApiKey() {
     const response = await fetch('/get-api-key', {
       credentials: 'same-origin' // 确保请求包含cookies
     });
     const data = await response.json();
     return data.apiKey;
   }
   ```

2. **实现API密钥轮换机制**：定期更换API密钥，并确保系统能够平滑过渡

3. **监控异常访问模式**：实现监控系统，检测可能的API滥用行为

4. **限制API密钥权限范围**：根据实际需要分配最小权限

5. **实现IP白名单**：限制API密钥只能从特定IP地址使用

6. **记录详细的访问日志**：包括请求IP、时间、使用的API密钥（部分隐藏）等信息，便于审计和问题排查

7. **使用HTTPS**：确保所有API通信都通过HTTPS进行，防止中间人攻击

8. **实现请求签名**：对于高安全性要求的场景，可以考虑实现请求签名机制，确保请求未被篡改

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

5. **定期轮换API密钥**：建议每3-6个月更换一次API密钥，降低密钥泄露的风险

6. **使用适当的HTTP方法**：
   - 对于查询操作，如果使用URL参数传递API密钥，使用GET方法
   - 对于使用请求体传递认证信息的操作，使用POST方法

7. **验证IP地址格式**：在发送请求前，确保IP地址格式正确（IPv4或IPv6）

8. **处理错误响应**：正确处理API返回的错误状态码和错误消息

## 示例代码

### JavaScript (Fetch API)

```

## 错误处理

在与API交互时，应当正确处理可能出现的错误情况：

| 状态码 | 描述 | 处理建议 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数是否正确，特别是IP地址格式 |
| 401 | 认证失败 | 检查API密钥或JWT令牌是否有效 |
| 403 | 权限不足 | 确认使用的API密钥是否有足够的权限 |
| 429 | 请求过多 | 实现退避策略，减少请求频率 |
| 500 | 服务器内部错误 | 联系系统管理员，并提供错误详情 |

### 错误处理示例（JavaScript）

```javascript
async function checkIpStatus(apiKey, ipAddress) {
  try {
    const response = await fetch('https://your-domain.com/api/blacklist/check-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: apiKey,
        ip: ipAddress
      })
    });
    
    if (response.status === 400) {
      throw new Error('请求参数错误，请检查IP地址格式');
    } else if (response.status === 401) {
      throw new Error('认证失败，请检查API密钥');
    } else if (response.status === 429) {
      throw new Error('请求频率过高，请稍后再试');
    } else if (response.status === 500) {
      throw new Error('服务器内部错误，请联系管理员');
    } else if (!response.ok) {
      throw new Error(`未知错误，状态码: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('检查IP状态时出错:', error);
    // 可以在这里实现重试逻辑或其他错误处理
    throw error;
  }
}
```

## 性能优化

1. **实现缓存机制**：对于频繁查询的IP地址，可以在客户端实现缓存，减少API调用次数

   ```javascript
   // 简单的缓存实现示例
   const ipCache = new Map();
   const CACHE_TTL = 60 * 60 * 1000; // 1小时缓存

   async function checkIpStatusWithCache(apiKey, ipAddress) {
     // 检查缓存
     if (ipCache.has(ipAddress)) {
       const cachedData = ipCache.get(ipAddress);
       if (Date.now() - cachedData.timestamp < CACHE_TTL) {
         return cachedData.data;
       }
     }
     
     // 缓存未命中，调用API
     const result = await checkIpStatus(apiKey, ipAddress);
     
     // 更新缓存
     ipCache.set(ipAddress, {
       data: result,
       timestamp: Date.now()
     });
     
     return result;
   }
   ```

2. **批量操作**：如果需要检查多个IP地址，考虑使用批量API（如果系统支持）或实现并发请求

3. **异步处理**：对于非关键路径的IP检查，可以考虑异步处理，不阻塞主流程

4. **减少不必要的请求**：只在必要时进行API调用，避免冗余请求

## 安全建议

1. **不要在客户端代码中硬编码API密钥**：应当从服务器端环境变量或安全存储中获取

   ```javascript
   // 不推荐 - 在前端代码中硬编码API密钥
   const API_KEY = 'your-api-key-123';
   
   // 推荐 - 从服务器端获取API密钥
   async function getApiKey() {
     const response = await fetch('/get-api-key', {
       credentials: 'same-origin' // 确保请求包含cookies
     });
     const data = await response.json();
     return data.apiKey;
   }
   ```

2. **实现API密钥轮换机制**：定期更换API密钥，并确保系统能够平滑过渡

3. **监控异常访问模式**：实现监控系统，检测可能的API滥用行为

4. **限制API密钥权限范围**：根据实际需要分配最小权限

5. **实现IP白名单**：限制API密钥只能从特定IP地址使用

6. **记录详细的访问日志**：包括请求IP、时间、使用的API密钥（部分隐藏）等信息，便于审计和问题排查

7. **使用HTTPS**：确保所有API通信都通过HTTPS进行，防止中间人攻击

8. **实现请求签名**：对于高安全性要求的场景，可以考虑实现请求签名机制，确保请求未被篡改javascript
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

## 错误处理

在与API交互时，应当正确处理可能出现的错误情况：

| 状态码 | 描述 | 处理建议 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数是否正确，特别是IP地址格式 |
| 401 | 认证失败 | 检查API密钥或JWT令牌是否有效 |
| 403 | 权限不足 | 确认使用的API密钥是否有足够的权限 |
| 429 | 请求过多 | 实现退避策略，减少请求频率 |
| 500 | 服务器内部错误 | 联系系统管理员，并提供错误详情 |

### 错误处理示例（JavaScript）

```javascript
async function checkIpStatus(apiKey, ipAddress) {
  try {
    const response = await fetch('https://your-domain.com/api/blacklist/check-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: apiKey,
        ip: ipAddress
      })
    });
    
    if (response.status === 400) {
      throw new Error('请求参数错误，请检查IP地址格式');
    } else if (response.status === 401) {
      throw new Error('认证失败，请检查API密钥');
    } else if (response.status === 429) {
      throw new Error('请求频率过高，请稍后再试');
    } else if (response.status === 500) {
      throw new Error('服务器内部错误，请联系管理员');
    } else if (!response.ok) {
      throw new Error(`未知错误，状态码: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('检查IP状态时出错:', error);
    // 可以在这里实现重试逻辑或其他错误处理
    throw error;
  }
}
```

## 性能优化

1. **实现缓存机制**：对于频繁查询的IP地址，可以在客户端实现缓存，减少API调用次数

   ```javascript
   // 简单的缓存实现示例
   const ipCache = new Map();
   const CACHE_TTL = 60 * 60 * 1000; // 1小时缓存

   async function checkIpStatusWithCache(apiKey, ipAddress) {
     // 检查缓存
     if (ipCache.has(ipAddress)) {
       const cachedData = ipCache.get(ipAddress);
       if (Date.now() - cachedData.timestamp < CACHE_TTL) {
         return cachedData.data;
       }
     }
     
     // 缓存未命中，调用API
     const result = await checkIpStatus(apiKey, ipAddress);
     
     // 更新缓存
     ipCache.set(ipAddress, {
       data: result,
       timestamp: Date.now()
     });
     
     return result;
   }
   ```

2. **批量操作**：如果需要检查多个IP地址，考虑使用批量API（如果系统支持）或实现并发请求

3. **异步处理**：对于非关键路径的IP检查，可以考虑异步处理，不阻塞主流程

4. **减少不必要的请求**：只在必要时进行API调用，避免冗余请求

## 安全建议

1. **不要在客户端代码中硬编码API密钥**：应当从服务器端环境变量或安全存储中获取

   ```javascript
   // 不推荐 - 在前端代码中硬编码API密钥
   const API_KEY = 'your-api-key-123';
   
   // 推荐 - 从服务器端获取API密钥
   async function getApiKey() {
     const response = await fetch('/get-api-key', {
       credentials: 'same-origin' // 确保请求包含cookies
     });
     const data = await response.json();
     return data.apiKey;
   }
   ```

2. **实现API密钥轮换机制**：定期更换API密钥，并确保系统能够平滑过渡

3. **监控异常访问模式**：实现监控系统，检测可能的API滥用行为

4. **限制API密钥权限范围**：根据实际需要分配最小权限

5. **实现IP白名单**：限制API密钥只能从特定IP地址使用

6. **记录详细的访问日志**：包括请求IP、时间、使用的API密钥（部分隐藏）等信息，便于审计和问题排查

7. **使用HTTPS**：确保所有API通信都通过HTTPS进行，防止中间人攻击

8. **实现请求签名**：对于高安全性要求的场景，可以考虑实现请求签名机制，确保请求未被篡改

### Python (Requests)

```

## 错误处理

在与API交互时，应当正确处理可能出现的错误情况：

| 状态码 | 描述 | 处理建议 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数是否正确，特别是IP地址格式 |
| 401 | 认证失败 | 检查API密钥或JWT令牌是否有效 |
| 403 | 权限不足 | 确认使用的API密钥是否有足够的权限 |
| 429 | 请求过多 | 实现退避策略，减少请求频率 |
| 500 | 服务器内部错误 | 联系系统管理员，并提供错误详情 |

### 错误处理示例（JavaScript）

```javascript
async function checkIpStatus(apiKey, ipAddress) {
  try {
    const response = await fetch('https://your-domain.com/api/blacklist/check-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: apiKey,
        ip: ipAddress
      })
    });
    
    if (response.status === 400) {
      throw new Error('请求参数错误，请检查IP地址格式');
    } else if (response.status === 401) {
      throw new Error('认证失败，请检查API密钥');
    } else if (response.status === 429) {
      throw new Error('请求频率过高，请稍后再试');
    } else if (response.status === 500) {
      throw new Error('服务器内部错误，请联系管理员');
    } else if (!response.ok) {
      throw new Error(`未知错误，状态码: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('检查IP状态时出错:', error);
    // 可以在这里实现重试逻辑或其他错误处理
    throw error;
  }
}
```

## 性能优化

1. **实现缓存机制**：对于频繁查询的IP地址，可以在客户端实现缓存，减少API调用次数

   ```javascript
   // 简单的缓存实现示例
   const ipCache = new Map();
   const CACHE_TTL = 60 * 60 * 1000; // 1小时缓存

   async function checkIpStatusWithCache(apiKey, ipAddress) {
     // 检查缓存
     if (ipCache.has(ipAddress)) {
       const cachedData = ipCache.get(ipAddress);
       if (Date.now() - cachedData.timestamp < CACHE_TTL) {
         return cachedData.data;
       }
     }
     
     // 缓存未命中，调用API
     const result = await checkIpStatus(apiKey, ipAddress);
     
     // 更新缓存
     ipCache.set(ipAddress, {
       data: result,
       timestamp: Date.now()
     });
     
     return result;
   }
   ```

2. **批量操作**：如果需要检查多个IP地址，考虑使用批量API（如果系统支持）或实现并发请求

3. **异步处理**：对于非关键路径的IP检查，可以考虑异步处理，不阻塞主流程

4. **减少不必要的请求**：只在必要时进行API调用，避免冗余请求

## 安全建议

1. **不要在客户端代码中硬编码API密钥**：应当从服务器端环境变量或安全存储中获取

   ```javascript
   // 不推荐 - 在前端代码中硬编码API密钥
   const API_KEY = 'your-api-key-123';
   
   // 推荐 - 从服务器端获取API密钥
   async function getApiKey() {
     const response = await fetch('/get-api-key', {
       credentials: 'same-origin' // 确保请求包含cookies
     });
     const data = await response.json();
     return data.apiKey;
   }
   ```

2. **实现API密钥轮换机制**：定期更换API密钥，并确保系统能够平滑过渡

3. **监控异常访问模式**：实现监控系统，检测可能的API滥用行为

4. **限制API密钥权限范围**：根据实际需要分配最小权限

5. **实现IP白名单**：限制API密钥只能从特定IP地址使用

6. **记录详细的访问日志**：包括请求IP、时间、使用的API密钥（部分隐藏）等信息，便于审计和问题排查

7. **使用HTTPS**：确保所有API通信都通过HTTPS进行，防止中间人攻击

8. **实现请求签名**：对于高安全性要求的场景，可以考虑实现请求签名机制，确保请求未被篡改python
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

## 错误处理

在与API交互时，应当正确处理可能出现的错误情况：

| 状态码 | 描述 | 处理建议 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数是否正确，特别是IP地址格式 |
| 401 | 认证失败 | 检查API密钥或JWT令牌是否有效 |
| 403 | 权限不足 | 确认使用的API密钥是否有足够的权限 |
| 429 | 请求过多 | 实现退避策略，减少请求频率 |
| 500 | 服务器内部错误 | 联系系统管理员，并提供错误详情 |

### 错误处理示例（JavaScript）

```javascript
async function checkIpStatus(apiKey, ipAddress) {
  try {
    const response = await fetch('https://your-domain.com/api/blacklist/check-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: apiKey,
        ip: ipAddress
      })
    });
    
    if (response.status === 400) {
      throw new Error('请求参数错误，请检查IP地址格式');
    } else if (response.status === 401) {
      throw new Error('认证失败，请检查API密钥');
    } else if (response.status === 429) {
      throw new Error('请求频率过高，请稍后再试');
    } else if (response.status === 500) {
      throw new Error('服务器内部错误，请联系管理员');
    } else if (!response.ok) {
      throw new Error(`未知错误，状态码: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('检查IP状态时出错:', error);
    // 可以在这里实现重试逻辑或其他错误处理
    throw error;
  }
}
```

## 性能优化

1. **实现缓存机制**：对于频繁查询的IP地址，可以在客户端实现缓存，减少API调用次数

   ```javascript
   // 简单的缓存实现示例
   const ipCache = new Map();
   const CACHE_TTL = 60 * 60 * 1000; // 1小时缓存

   async function checkIpStatusWithCache(apiKey, ipAddress) {
     // 检查缓存
     if (ipCache.has(ipAddress)) {
       const cachedData = ipCache.get(ipAddress);
       if (Date.now() - cachedData.timestamp < CACHE_TTL) {
         return cachedData.data;
       }
     }
     
     // 缓存未命中，调用API
     const result = await checkIpStatus(apiKey, ipAddress);
     
     // 更新缓存
     ipCache.set(ipAddress, {
       data: result,
       timestamp: Date.now()
     });
     
     return result;
   }
   ```

2. **批量操作**：如果需要检查多个IP地址，考虑使用批量API（如果系统支持）或实现并发请求

3. **异步处理**：对于非关键路径的IP检查，可以考虑异步处理，不阻塞主流程

4. **减少不必要的请求**：只在必要时进行API调用，避免冗余请求

## 安全建议

1. **不要在客户端代码中硬编码API密钥**：应当从服务器端环境变量或安全存储中获取

   ```javascript
   // 不推荐 - 在前端代码中硬编码API密钥
   const API_KEY = 'your-api-key-123';
   
   // 推荐 - 从服务器端获取API密钥
   async function getApiKey() {
     const response = await fetch('/get-api-key', {
       credentials: 'same-origin' // 确保请求包含cookies
     });
     const data = await response.json();
     return data.apiKey;
   }
   ```

2. **实现API密钥轮换机制**：定期更换API密钥，并确保系统能够平滑过渡

3. **监控异常访问模式**：实现监控系统，检测可能的API滥用行为

4. **限制API密钥权限范围**：根据实际需要分配最小权限

5. **实现IP白名单**：限制API密钥只能从特定IP地址使用

6. **记录详细的访问日志**：包括请求IP、时间、使用的API密钥（部分隐藏）等信息，便于审计和问题排查

7. **使用HTTPS**：确保所有API通信都通过HTTPS进行，防止中间人攻击

8. **实现请求签名**：对于高安全性要求的场景，可以考虑实现请求签名机制，确保请求未被篡改

### PHP (cURL)

```

## 错误处理

在与API交互时，应当正确处理可能出现的错误情况：

| 状态码 | 描述 | 处理建议 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数是否正确，特别是IP地址格式 |
| 401 | 认证失败 | 检查API密钥或JWT令牌是否有效 |
| 403 | 权限不足 | 确认使用的API密钥是否有足够的权限 |
| 429 | 请求过多 | 实现退避策略，减少请求频率 |
| 500 | 服务器内部错误 | 联系系统管理员，并提供错误详情 |

### 错误处理示例（JavaScript）

```javascript
async function checkIpStatus(apiKey, ipAddress) {
  try {
    const response = await fetch('https://your-domain.com/api/blacklist/check-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: apiKey,
        ip: ipAddress
      })
    });
    
    if (response.status === 400) {
      throw new Error('请求参数错误，请检查IP地址格式');
    } else if (response.status === 401) {
      throw new Error('认证失败，请检查API密钥');
    } else if (response.status === 429) {
      throw new Error('请求频率过高，请稍后再试');
    } else if (response.status === 500) {
      throw new Error('服务器内部错误，请联系管理员');
    } else if (!response.ok) {
      throw new Error(`未知错误，状态码: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('检查IP状态时出错:', error);
    // 可以在这里实现重试逻辑或其他错误处理
    throw error;
  }
}
```

## 性能优化

1. **实现缓存机制**：对于频繁查询的IP地址，可以在客户端实现缓存，减少API调用次数

   ```javascript
   // 简单的缓存实现示例
   const ipCache = new Map();
   const CACHE_TTL = 60 * 60 * 1000; // 1小时缓存

   async function checkIpStatusWithCache(apiKey, ipAddress) {
     // 检查缓存
     if (ipCache.has(ipAddress)) {
       const cachedData = ipCache.get(ipAddress);
       if (Date.now() - cachedData.timestamp < CACHE_TTL) {
         return cachedData.data;
       }
     }
     
     // 缓存未命中，调用API
     const result = await checkIpStatus(apiKey, ipAddress);
     
     // 更新缓存
     ipCache.set(ipAddress, {
       data: result,
       timestamp: Date.now()
     });
     
     return result;
   }
   ```

2. **批量操作**：如果需要检查多个IP地址，考虑使用批量API（如果系统支持）或实现并发请求

3. **异步处理**：对于非关键路径的IP检查，可以考虑异步处理，不阻塞主流程

4. **减少不必要的请求**：只在必要时进行API调用，避免冗余请求

## 安全建议

1. **不要在客户端代码中硬编码API密钥**：应当从服务器端环境变量或安全存储中获取

   ```javascript
   // 不推荐 - 在前端代码中硬编码API密钥
   const API_KEY = 'your-api-key-123';
   
   // 推荐 - 从服务器端获取API密钥
   async function getApiKey() {
     const response = await fetch('/get-api-key', {
       credentials: 'same-origin' // 确保请求包含cookies
     });
     const data = await response.json();
     return data.apiKey;
   }
   ```

2. **实现API密钥轮换机制**：定期更换API密钥，并确保系统能够平滑过渡

3. **监控异常访问模式**：实现监控系统，检测可能的API滥用行为

4. **限制API密钥权限范围**：根据实际需要分配最小权限

5. **实现IP白名单**：限制API密钥只能从特定IP地址使用

6. **记录详细的访问日志**：包括请求IP、时间、使用的API密钥（部分隐藏）等信息，便于审计和问题排查

7. **使用HTTPS**：确保所有API通信都通过HTTPS进行，防止中间人攻击

8. **实现请求签名**：对于高安全性要求的场景，可以考虑实现请求签名机制，确保请求未被篡改php
// 使用API密钥查询IP状态（新方式）
function checkIpStatus($apiKey, $ip) {
    $ch = curl_init('https://your-domain.com/api/blacklist/check-api');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'key' => $apiKey,
        'ip' => $ip
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

// 使用JWT令牌验证（新方式）
function verifyToken($token) {
    $ch = curl_init('https://your-domain.com/api/auth/verify');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'token' => $token
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}
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

## 错误处理

在与API交互时，应当正确处理可能出现的错误情况：

| 状态码 | 描述 | 处理建议 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数是否正确，特别是IP地址格式 |
| 401 | 认证失败 | 检查API密钥或JWT令牌是否有效 |
| 403 | 权限不足 | 确认使用的API密钥是否有足够的权限 |
| 429 | 请求过多 | 实现退避策略，减少请求频率 |
| 500 | 服务器内部错误 | 联系系统管理员，并提供错误详情 |

### 错误处理示例（JavaScript）

```javascript
async function checkIpStatus(apiKey, ipAddress) {
  try {
    const response = await fetch('https://your-domain.com/api/blacklist/check-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: apiKey,
        ip: ipAddress
      })
    });
    
    if (response.status === 400) {
      throw new Error('请求参数错误，请检查IP地址格式');
    } else if (response.status === 401) {
      throw new Error('认证失败，请检查API密钥');
    } else if (response.status === 429) {
      throw new Error('请求频率过高，请稍后再试');
    } else if (response.status === 500) {
      throw new Error('服务器内部错误，请联系管理员');
    } else if (!response.ok) {
      throw new Error(`未知错误，状态码: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('检查IP状态时出错:', error);
    // 可以在这里实现重试逻辑或其他错误处理
    throw error;
  }
}
```

## 性能优化

1. **实现缓存机制**：对于频繁查询的IP地址，可以在客户端实现缓存，减少API调用次数

   ```javascript
   // 简单的缓存实现示例
   const ipCache = new Map();
   const CACHE_TTL = 60 * 60 * 1000; // 1小时缓存

   async function checkIpStatusWithCache(apiKey, ipAddress) {
     // 检查缓存
     if (ipCache.has(ipAddress)) {
       const cachedData = ipCache.get(ipAddress);
       if (Date.now() - cachedData.timestamp < CACHE_TTL) {
         return cachedData.data;
       }
     }
     
     // 缓存未命中，调用API
     const result = await checkIpStatus(apiKey, ipAddress);
     
     // 更新缓存
     ipCache.set(ipAddress, {
       data: result,
       timestamp: Date.now()
     });
     
     return result;
   }
   ```

2. **批量操作**：如果需要检查多个IP地址，考虑使用批量API（如果系统支持）或实现并发请求

3. **异步处理**：对于非关键路径的IP检查，可以考虑异步处理，不阻塞主流程

4. **减少不必要的请求**：只在必要时进行API调用，避免冗余请求

## 安全建议

1. **不要在客户端代码中硬编码API密钥**：应当从服务器端环境变量或安全存储中获取

   ```javascript
   // 不推荐 - 在前端代码中硬编码API密钥
   const API_KEY = 'your-api-key-123';
   
   // 推荐 - 从服务器端获取API密钥
   async function getApiKey() {
     const response = await fetch('/get-api-key', {
       credentials: 'same-origin' // 确保请求包含cookies
     });
     const data = await response.json();
     return data.apiKey;
   }
   ```

2. **实现API密钥轮换机制**：定期更换API密钥，并确保系统能够平滑过渡

3. **监控异常访问模式**：实现监控系统，检测可能的API滥用行为

4. **限制API密钥权限范围**：根据实际需要分配最小权限

5. **实现IP白名单**：限制API密钥只能从特定IP地址使用

6. **记录详细的访问日志**：包括请求IP、时间、使用的API密钥（部分隐藏）等信息，便于审计和问题排查

7. **使用HTTPS**：确保所有API通信都通过HTTPS进行，防止中间人攻击

8. **实现请求签名**：对于高安全性要求的场景，可以考虑实现请求签名机制，确保请求未被篡改