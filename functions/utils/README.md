# 日志记录系统文档

## 概述

本项目的日志记录系统经过完全重构，提供了更详细、结构化和可扩展的操作日志记录功能。新系统包含以下核心组件：

- **统一日志记录模块** (`logger.js`)
- **高级日志查询API** (`logs/advanced.js`)
- **日志分析和监控API** (`logs/analytics.js`)
- **基础日志管理API** (`logs/list.js`, `logs/cleanup.js`)

## 核心功能

### 1. 结构化日志记录

新的日志系统提供了详细的结构化日志记录，包含以下信息：

- **基础信息**：时间戳、操作类型、操作者、状态
- **请求信息**：IP地址、请求方法、路径、User-Agent
- **操作详情**：具体操作参数、结果数据
- **性能指标**：操作耗时、响应时间
- **错误信息**：错误类型、错误消息、堆栈跟踪

### 2. 多级日志等级

支持以下日志等级：
- `DEBUG` - 调试信息
- `INFO` - 一般信息
- `WARN` - 警告信息
- `ERROR` - 错误信息
- `CRITICAL` - 严重错误

### 3. 操作类型分类

系统定义了完整的操作类型常量：

#### 系统操作
- `SYSTEM_START` - 系统启动
- `SYSTEM_ERROR` - 系统错误
- `SYSTEM_MAINTENANCE` - 系统维护

#### 认证操作
- `AUTH_LOGIN` - 用户登录
- `AUTH_LOGOUT` - 用户登出
- `AUTH_TOKEN_VERIFY` - Token验证
- `APIKEY_VERIFY` - API密钥验证
- `PERMISSION_CHECK` - 权限检查

#### 黑名单操作
- `BLACKLIST_ADD` - 添加IP到黑名单
- `BLACKLIST_REMOVE` - 从黑名单移除IP
- `BLACKLIST_CHECK` - 检查IP是否在黑名单
- `BLACKLIST_GET` - 获取黑名单列表

#### 日志操作
- `LOGS_QUERY` - 查询日志
- `LOGS_CLEANUP` - 清理日志
- `LOGS_CLEAR_ALL` - 清空所有日志

## 使用方法

### 基础使用

```javascript
import { createLogger, OPERATION_TYPES, OPERATION_STATUS } from '../utils/logger.js';

export async function onRequest(context) {
  const { request, env } = context;
  const logger = createLogger(env);
  
  try {
    // 记录成功操作
    await logger.success(OPERATION_TYPES.BLACKLIST_ADD, '成功添加IP到黑名单', {
      request,
      operator: 'admin',
      details: {
        ip: '192.168.1.1',
        reason: '恶意访问'
      }
    });
    
    return new Response(JSON.stringify({ success: true }));
    
  } catch (error) {
    // 记录错误
    await logger.error(OPERATION_TYPES.BLACKLIST_ADD, '添加IP失败', {
      request,
      operator: 'admin',
      error,
      details: {
        ip: '192.168.1.1',
        errorType: error.constructor.name
      }
    });
    
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}
```

### 高级功能

#### 1. 性能计时

```javascript
const logger = createLogger(env);
const endTimer = logger.startTimer(OPERATION_TYPES.BLACKLIST_ADD);

// 执行操作...

// 结束计时并记录
await endTimer({
  status: OPERATION_STATUS.SUCCESS,
  details: { result: 'operation completed' }
});
```

#### 2. 设置日志上下文

```javascript
const logger = createLogger(env);
logger.setContext({
  service: 'blacklist',
  version: '1.0.0',
  environment: 'production'
});
```

#### 3. 批量日志记录

```javascript
const logger = createLogger(env);

// 记录多个相关操作
await logger.info(OPERATION_TYPES.BLACKLIST_CHECK, '开始批量检查IP');

for (const ip of ipList) {
  // 检查每个IP...
  await logger.debug(OPERATION_TYPES.BLACKLIST_CHECK, `检查IP: ${ip}`);
}

await logger.success(OPERATION_TYPES.BLACKLIST_CHECK, '批量检查完成');
```

## API接口

### 1. 高级日志查询 (`/api/logs/advanced`)

提供强大的日志查询和分析功能：

```bash
# 查询最近24小时的错误日志
GET /api/logs/advanced?level=ERROR&timeRange=24h

# 按操作类型筛选
GET /api/logs/advanced?operationType=BLACKLIST_ADD&page=1&pageSize=50

# 关键词搜索
GET /api/logs/advanced?keyword=192.168.1.1&timeRange=7d

# 导出CSV格式
GET /api/logs/advanced?export=csv&timeRange=30d

# 获取统计信息
GET /api/logs/advanced?stats=true&timeRange=24h
```

### 2. 日志分析监控 (`/api/logs/analytics`)

提供实时监控和趋势分析：

```bash
# 获取系统概览
GET /api/logs/analytics?type=overview&timeRange=24h

# 趋势分析
GET /api/logs/analytics?type=trends&timeRange=7d&interval=day

# 性能指标
GET /api/logs/analytics?type=performance&timeRange=1h

# 异常检测
GET /api/logs/analytics?type=anomalies&timeRange=24h

# 告警检查
GET /api/logs/analytics?type=alerts&timeRange=1h
```

### 3. 基础日志管理

```bash
# 查询日志列表
GET /api/logs/list?page=1&pageSize=20

# 清理过期日志
POST /api/logs/cleanup
{
  "retentionDays": 30
}

# 清空所有日志
DELETE /api/logs/cleanup
```

## 配置选项

### 环境变量

- `API_LOGS` - 日志存储的KV命名空间
- `LOG_RETENTION_DAYS` - 日志保留天数（默认30天）
- `LOG_LEVEL` - 最低日志级别（默认INFO）

### 日志格式

每条日志记录包含以下字段：

```json
{
  "id": "log_1703123456789_abc123",
  "timestamp": 1703123456789,
  "level": "INFO",
  "operationType": "BLACKLIST_ADD",
  "operator": "admin",
  "status": "SUCCESS",
  "message": "成功添加IP到黑名单",
  "requestInfo": {
    "method": "POST",
    "path": "/api/blacklist/add",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  },
  "details": {
    "ip": "192.168.1.1",
    "reason": "恶意访问"
  },
  "duration": 150,
  "error": null,
  "context": {
    "service": "blacklist",
    "version": "1.0.0"
  }
}
```

## 最佳实践

### 1. 日志记录原则

- **关键操作必须记录**：所有涉及数据修改的操作
- **错误必须记录**：包含完整的错误信息和上下文
- **性能监控**：记录重要操作的执行时间
- **安全审计**：记录所有认证和权限检查

### 2. 性能考虑

- 使用异步日志记录，避免阻塞主流程
- 合理设置日志级别，避免过多的DEBUG日志
- 定期清理过期日志，控制存储空间

### 3. 安全注意事项

- 不要记录敏感信息（密码、密钥等）
- 对IP地址等敏感数据进行适当脱敏
- 确保日志访问权限控制

## 迁移指南

### 从旧系统迁移

1. **替换导入语句**：
   ```javascript
   // 旧方式
   await logOperation(env, { ... });
   
   // 新方式
   import { createLogger, OPERATION_TYPES } from '../utils/logger.js';
   const logger = createLogger(env);
   await logger.success(OPERATION_TYPES.BLACKLIST_ADD, 'message', { ... });
   ```

2. **更新操作类型**：
   使用预定义的 `OPERATION_TYPES` 常量替换字符串

3. **增强错误处理**：
   传递完整的 `error` 对象而不是仅错误消息

4. **添加性能监控**：
   对重要操作使用 `startTimer()` 进行性能监控

## 故障排除

### 常见问题

1. **日志记录失败**
   - 检查KV命名空间配置
   - 验证环境变量设置
   - 查看控制台错误信息

2. **查询性能问题**
   - 使用时间范围限制查询
   - 避免过大的页面大小
   - 考虑使用索引优化

3. **存储空间问题**
   - 定期执行日志清理
   - 调整日志保留策略
   - 监控存储使用情况

## 更新日志

### v2.0.0 (当前版本)
- 完全重构日志记录系统
- 添加结构化日志支持
- 实现高级查询和分析功能
- 增加性能监控和异常检测
- 提供统一的日志记录接口

### v1.x (旧版本)
- 基础日志记录功能
- 简单的查询和清理接口