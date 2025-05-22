// 日志查询API
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // 获取查询参数
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
  const startTime = url.searchParams.get('startTime');
  const endTime = url.searchParams.get('endTime');
  const operationType = url.searchParams.get('operationType');
  const operator = url.searchParams.get('operator');
  
  try {
    // 构建查询条件
    const prefix = 'log:';
    let listOptions = {
      prefix,
      limit: pageSize,
      cursor: url.searchParams.get('cursor')
    };
    
    // 获取日志列表
    const logs = await env.API_LOGS.list(listOptions);
    
    // 获取日志详情
    const logDetails = await Promise.all(
      logs.keys.map(async (key) => {
        const value = await env.API_LOGS.get(key.name);
        return JSON.parse(value);
      })
    );
    
    // 过滤日志
    let filteredLogs = logDetails.filter(log => {
      if (startTime && log.timestamp < parseInt(startTime)) return false;
      if (endTime && log.timestamp > parseInt(endTime)) return false;
      if (operationType && log.operationType !== operationType) return false;
      if (operator && log.operator !== operator) return false;
      return true;
    });
    
    // 按时间戳排序（降序）
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
    
    // 分页
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedLogs = filteredLogs.slice(start, end);
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        logs: paginatedLogs,
        pagination: {
          page,
          pageSize,
          total: filteredLogs.length,
          hasMore: end < filteredLogs.length,
          cursor: logs.cursor
        }
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: '获取日志失败',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 日志列表获取接口
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  
  try {
    // 验证认证信息
    if (!context.data?.user) {
      return new Response(JSON.stringify({
        success: false,
        message: '未授权访问'
      }), {
        status: 401,
        headers
      });
    }
    
    // 获取查询参数
    const page = parseInt(url.searchParams.get('page')) || 1;
    const pageSize = parseInt(url.searchParams.get('pageSize')) || 20;
    const startTime = url.searchParams.get('startTime');
    const endTime = url.searchParams.get('endTime');
    const operationType = url.searchParams.get('operationType');
    const operator = url.searchParams.get('operator');
    const status = url.searchParams.get('status'); // 添加状态过滤
    const cursor = url.searchParams.get('cursor');
    
    // 获取所有日志
    const logs = await env.API_LOGS.list({ prefix: 'log:' });
    
    // 过滤日志
    let filteredLogs = logs.keys.map(key => {
      const timestamp = parseInt(key.name.split('_')[0].replace('log:', ''));
      return {
        key: key.name,
        timestamp
      };
    });
    
    // 应用时间过滤
    if (startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= parseInt(startTime));
    }
    if (endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= parseInt(endTime));
    }
    
    // 按时间戳降序排序
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
    
    // 计算分页
    const total = filteredLogs.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    
    // 获取日志详情
    const logDetails = await Promise.all(
      paginatedLogs.map(async log => {
        const logData = await env.API_LOGS.get(log.key);
        if (logData) {
          const logEntry = JSON.parse(logData);
          
          // 应用操作类型和操作者过滤
          if (operationType && logEntry.operationType !== operationType) {
            return null;
          }
          if (operator && logEntry.operator !== operator) {
            return null;
          }
          if (status && logEntry.status !== status) {
            return null;
          }
          
          // 确保详细信息字段存在
          if (!logEntry.details) {
            logEntry.details = {};
          }
          
          // 根据操作类型增强日志详情
          switch (logEntry.operationType) {
            case 'blacklist_add':
              if (logEntry.details.ip) {
                logEntry.description = `添加IP ${logEntry.details.ip} 到黑名单`;
              } else {
                logEntry.description = '添加IP到黑名单';
              }
              break;
              
            case 'blacklist_remove':
              if (logEntry.details.ip) {
                logEntry.description = `从黑名单移除IP ${logEntry.details.ip}`;
              } else {
                logEntry.description = '从黑名单移除IP';
              }
              break;
              
            case 'blacklist_check':
              if (logEntry.details.ip) {
                const blocked = logEntry.details.blocked ? '在黑名单中' : '不在黑名单中';
                logEntry.description = `查询IP ${logEntry.details.ip} ${blocked}`;
                if (logEntry.details.result) {
                  logEntry.details.resultMessage = logEntry.details.result;
                }
              } else {
                logEntry.description = '查询IP黑名单状态';
              }
              break;
              
            case 'blacklist_get':
              logEntry.description = '获取IP黑名单列表';
              if (logEntry.details.count !== undefined) {
                logEntry.description += ` (共${logEntry.details.count}个IP)`;
                if (logEntry.details.ips && Array.isArray(logEntry.details.ips)) {
                  logEntry.details.ipList = logEntry.details.ips.join(', ');
                }
              }
              break;
              
            case 'api_key_verification':
              logEntry.description = 'API密钥验证';
              if (logEntry.details.key) {
                logEntry.description += ` (密钥: ${logEntry.details.key.substring(0, 4)}...)`;
              }
              break;
              
            case 'authentication':
              logEntry.description = '用户认证';
              if (logEntry.details.username) {
                logEntry.description += ` (用户: ${logEntry.details.username})`;
              }
              break;
              
            case 'permission_check':
              logEntry.description = '权限检查';
              if (logEntry.details.permission) {
                logEntry.description += ` (权限: ${logEntry.details.permission})`;
              }
              break;
              
            case 'system_error':
              logEntry.description = '系统错误';
              if (logEntry.details.errorType) {
                logEntry.description += ` (类型: ${logEntry.details.errorType})`;
              }
              break;
              
            default:
              logEntry.description = logEntry.operationType.replace(/_/g, ' ');
          }
          
          // 格式化时间戳
          logEntry.formattedTime = new Date(logEntry.timestamp).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          
          return logEntry;
        }
        return null;
      })
    );
    
    // 过滤掉null值
    const validLogs = logDetails.filter(log => log !== null);
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        logs: validLogs,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          cursor: endIndex < total ? endIndex : null
        }
      }
    }), { headers });
    
  } catch (error) {
    // 记录错误日志
    try {
      const requestIp = request.headers.get('CF-Connecting-IP') || 'unknown';
      await env.API_LOGS.put(`log:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, JSON.stringify({
        operationType: 'logs_list',
        operator: context.data?.user?.id || 'system',
        details: { error: error.message },
        requestIp,
        requestPath: '/api/logs/list',
        status: 'failed',
        error: error.message,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('记录错误日志失败:', e);
    }
    
    return new Response(JSON.stringify({
      success: false,
      message: '获取日志列表失败: ' + error.message
    }), {
      status: 500,
      headers
    });
  }
}

// 处理OPTIONS请求，支持CORS预检
export function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}