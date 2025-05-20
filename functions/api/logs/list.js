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
    // 获取查询参数
    const page = parseInt(url.searchParams.get('page')) || 1;
    const pageSize = parseInt(url.searchParams.get('pageSize')) || 20;
    const startTime = url.searchParams.get('startTime');
    const endTime = url.searchParams.get('endTime');
    const operationType = url.searchParams.get('operationType');
    const operator = url.searchParams.get('operator');
    const cursor = url.searchParams.get('cursor');
    
    // 获取所有日志
    const logs = await env.API_LOGS.list({ prefix: 'log:' });
    
    // 过滤日志
    let filteredLogs = logs.keys.map(key => {
      const timestamp = parseInt(key.name.replace('log:', ''));
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
          cursor: endIndex < total ? endIndex : null
        }
      }
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '获取日志列表失败: ' + error.message
    }), {
      status: 500,
      headers
    });
  }
} 