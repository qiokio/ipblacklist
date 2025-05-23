// 增强的日志查询和管理API
// 提供高级过滤、搜索、统计和分析功能

import { createLogger, OPERATION_TYPES, LOG_LEVELS, OPERATION_STATUS } from '../../utils/logger.js';

/**
 * 解析时间范围参数
 * @param {string} timeRange - 时间范围字符串
 * @returns {Object} 开始和结束时间戳
 */
function parseTimeRange(timeRange) {
  const now = Date.now();
  const ranges = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  if (ranges[timeRange]) {
    return {
      startTime: now - ranges[timeRange],
      endTime: now
    };
  }
  
  return { startTime: null, endTime: null };
}

/**
 * 高级日志过滤器
 * @param {Array} logs - 日志数组
 * @param {Object} filters - 过滤条件
 * @returns {Array} 过滤后的日志
 */
function advancedFilter(logs, filters) {
  return logs.filter(log => {
    // 时间范围过滤
    if (filters.startTime && log.timestamp < filters.startTime) return false;
    if (filters.endTime && log.timestamp > filters.endTime) return false;
    
    // 操作类型过滤
    if (filters.operationType && log.operationType !== filters.operationType) return false;
    
    // 操作者过滤
    if (filters.operator && !log.operator.toLowerCase().includes(filters.operator.toLowerCase())) return false;
    
    // 状态过滤
    if (filters.status && log.status !== filters.status) return false;
    
    // 日志级别过滤
    if (filters.level && log.level !== filters.level) return false;
    
    // IP地址过滤
    if (filters.ip && !log.request?.ip.includes(filters.ip)) return false;
    
    // 关键词搜索（在消息、详情、错误信息中搜索）
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      const searchText = [
        log.message || '',
        JSON.stringify(log.details || {}),
        log.error?.message || '',
        log.request?.path || ''
      ].join(' ').toLowerCase();
      
      if (!searchText.includes(keyword)) return false;
    }
    
    // 请求方法过滤
    if (filters.method && log.request?.method !== filters.method) return false;
    
    // 请求路径过滤
    if (filters.path && !log.request?.path.includes(filters.path)) return false;
    
    // 用户代理过滤
    if (filters.userAgent && !log.request?.headers?.userAgent.toLowerCase().includes(filters.userAgent.toLowerCase())) return false;
    
    // 错误代码过滤
    if (filters.errorCode && log.error?.code !== filters.errorCode) return false;
    
    // 持续时间过滤
    if (filters.minDuration && (!log.details?.duration || parseInt(log.details.duration) < filters.minDuration)) return false;
    if (filters.maxDuration && (!log.details?.duration || parseInt(log.details.duration) > filters.maxDuration)) return false;
    
    return true;
  });
}

/**
 * 生成日志统计信息
 * @param {Array} logs - 日志数组
 * @returns {Object} 统计信息
 */
function generateStatistics(logs) {
  const stats = {
    total: logs.length,
    byStatus: {},
    byOperationType: {},
    byLevel: {},
    byOperator: {},
    byHour: {},
    byDay: {},
    errorRate: 0,
    avgDuration: 0,
    topIPs: {},
    topPaths: {},
    topErrors: {}
  };
  
  let totalDuration = 0;
  let durationCount = 0;
  let errorCount = 0;
  
  logs.forEach(log => {
    // 按状态统计
    stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
    
    // 按操作类型统计
    stats.byOperationType[log.operationType] = (stats.byOperationType[log.operationType] || 0) + 1;
    
    // 按日志级别统计
    stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    
    // 按操作者统计
    stats.byOperator[log.operator] = (stats.byOperator[log.operator] || 0) + 1;
    
    // 按小时统计
    const hour = new Date(log.timestamp).getHours();
    stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    
    // 按天统计
    const day = new Date(log.timestamp).toDateString();
    stats.byDay[day] = (stats.byDay[day] || 0) + 1;
    
    // 错误统计
    if (log.status === OPERATION_STATUS.FAILED || log.level === LOG_LEVELS.ERROR) {
      errorCount++;
    }
    
    // 持续时间统计
    if (log.details?.duration) {
      const duration = parseInt(log.details.duration);
      if (!isNaN(duration)) {
        totalDuration += duration;
        durationCount++;
      }
    }
    
    // IP统计
    if (log.request?.ip && log.request.ip !== 'unknown') {
      stats.topIPs[log.request.ip] = (stats.topIPs[log.request.ip] || 0) + 1;
    }
    
    // 路径统计
    if (log.request?.path && log.request.path !== 'unknown') {
      stats.topPaths[log.request.path] = (stats.topPaths[log.request.path] || 0) + 1;
    }
    
    // 错误统计
    if (log.error?.message) {
      stats.topErrors[log.error.message] = (stats.topErrors[log.error.message] || 0) + 1;
    }
  });
  
  // 计算错误率
  stats.errorRate = logs.length > 0 ? (errorCount / logs.length * 100).toFixed(2) : 0;
  
  // 计算平均持续时间
  stats.avgDuration = durationCount > 0 ? (totalDuration / durationCount).toFixed(2) : 0;
  
  // 排序Top统计
  stats.topIPs = Object.entries(stats.topIPs)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
  stats.topPaths = Object.entries(stats.topPaths)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
  stats.topErrors = Object.entries(stats.topErrors)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  
  return stats;
}

/**
 * 导出日志数据
 * @param {Array} logs - 日志数组
 * @param {string} format - 导出格式 (json, csv)
 * @returns {string} 导出的数据
 */
function exportLogs(logs, format = 'json') {
  if (format === 'csv') {
    const headers = [
      'ID', '时间戳', '格式化时间', '操作类型', '操作者', '级别', '状态',
      '消息', 'IP地址', '请求方法', '请求路径', '用户代理', '持续时间',
      '错误消息', '详情'
    ];
    
    const rows = logs.map(log => [
      log.id,
      log.timestamp,
      log.formattedTime,
      log.operationType,
      log.operator,
      log.level,
      log.status,
      log.message,
      log.request?.ip || '',
      log.request?.method || '',
      log.request?.path || '',
      log.request?.headers?.userAgent || '',
      log.details?.duration || '',
      log.error?.message || '',
      JSON.stringify(log.details || {})
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }
  
  return JSON.stringify(logs, null, 2);
}

/**
 * 高级日志查询API
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const logger = createLogger(env);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  
  try {
    // 验证认证信息
    if (!context.data?.user) {
      await logger.error(OPERATION_TYPES.LOGS_VIEW, '未授权访问', {
        request,
        details: { reason: '缺少认证信息' }
      });
      
      return new Response(JSON.stringify({
        success: false,
        message: '未授权访问'
      }), {
        status: 401,
        headers
      });
    }
    
    // 解析查询参数
    const params = {
      page: parseInt(url.searchParams.get('page')) || 1,
      pageSize: Math.min(parseInt(url.searchParams.get('pageSize')) || 20, 100),
      startTime: url.searchParams.get('startTime'),
      endTime: url.searchParams.get('endTime'),
      timeRange: url.searchParams.get('timeRange'),
      operationType: url.searchParams.get('operationType'),
      operator: url.searchParams.get('operator'),
      status: url.searchParams.get('status'),
      level: url.searchParams.get('level'),
      ip: url.searchParams.get('ip'),
      keyword: url.searchParams.get('keyword'),
      method: url.searchParams.get('method'),
      path: url.searchParams.get('path'),
      userAgent: url.searchParams.get('userAgent'),
      errorCode: url.searchParams.get('errorCode'),
      minDuration: url.searchParams.get('minDuration') ? parseInt(url.searchParams.get('minDuration')) : null,
      maxDuration: url.searchParams.get('maxDuration') ? parseInt(url.searchParams.get('maxDuration')) : null,
      sortBy: url.searchParams.get('sortBy') || 'timestamp',
      sortOrder: url.searchParams.get('sortOrder') || 'desc',
      includeStats: url.searchParams.get('includeStats') === 'true',
      export: url.searchParams.get('export'),
      exportFormat: url.searchParams.get('exportFormat') || 'json'
    };
    
    // 处理时间范围
    if (params.timeRange) {
      const timeRange = parseTimeRange(params.timeRange);
      if (timeRange.startTime) {
        params.startTime = timeRange.startTime;
        params.endTime = timeRange.endTime;
      }
    } else {
      if (params.startTime) params.startTime = parseInt(params.startTime);
      if (params.endTime) params.endTime = parseInt(params.endTime);
    }
    
    // 获取所有日志
    const allLogs = await env.API_LOGS.list({ prefix: 'log:' });
    
    // 获取日志详情
    const logDetails = await Promise.all(
      allLogs.keys.map(async (key) => {
        try {
          const value = await env.API_LOGS.get(key.name);
          return value ? JSON.parse(value) : null;
        } catch (error) {
          console.warn(`解析日志失败: ${key.name}`, error);
          return null;
        }
      })
    );
    
    // 过滤掉无效日志
    const validLogs = logDetails.filter(log => log !== null);
    
    // 应用高级过滤
    const filteredLogs = advancedFilter(validLogs, params);
    
    // 排序
    filteredLogs.sort((a, b) => {
      let aValue = a[params.sortBy];
      let bValue = b[params.sortBy];
      
      // 处理嵌套属性
      if (params.sortBy.includes('.')) {
        const keys = params.sortBy.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }
      
      if (params.sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });
    
    // 处理导出请求
    if (params.export === 'true') {
      const exportData = exportLogs(filteredLogs, params.exportFormat);
      const filename = `logs_${new Date().toISOString().split('T')[0]}.${params.exportFormat}`;
      
      await logger.success(OPERATION_TYPES.LOGS_EXPORT, {
        request,
        operator: context.data.user.id,
        details: {
          format: params.exportFormat,
          count: filteredLogs.length,
          filename
        }
      });
      
      return new Response(exportData, {
        headers: {
          'Content-Type': params.exportFormat === 'csv' ? 'text/csv' : 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 分页
    const total = filteredLogs.length;
    const totalPages = Math.ceil(total / params.pageSize);
    const startIndex = (params.page - 1) * params.pageSize;
    const endIndex = startIndex + params.pageSize;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    
    // 生成统计信息
    let statistics = null;
    if (params.includeStats) {
      statistics = generateStatistics(filteredLogs);
    }
    
    // 记录查询操作
    await logger.success(OPERATION_TYPES.LOGS_VIEW, {
      request,
      operator: context.data.user.id,
      details: {
        filters: params,
        resultCount: paginatedLogs.length,
        totalCount: total
      }
    });
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        logs: paginatedLogs,
        pagination: {
          page: params.page,
          pageSize: params.pageSize,
          total,
          totalPages,
          hasMore: endIndex < total
        },
        filters: params,
        statistics
      }
    }), { headers });
    
  } catch (error) {
    await logger.error(OPERATION_TYPES.LOGS_VIEW, error, {
      request,
      operator: context.data?.user?.id || 'unknown'
    });
    
    return new Response(JSON.stringify({
      success: false,
      message: '获取日志失败: ' + error.message
    }), {
      status: 500,
      headers
    });
  }
}

/**
 * 处理OPTIONS请求
 */
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