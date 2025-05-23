// 日志分析和监控API
// 提供实时监控、告警、趋势分析和性能指标功能

import { createLogger, OPERATION_TYPES, LOG_LEVELS, OPERATION_STATUS } from '../../utils/logger.js';

/**
 * 计算时间段内的趋势数据
 * @param {Array} logs - 日志数组
 * @param {string} interval - 时间间隔 (hour, day, week)
 * @param {number} periods - 时间段数量
 * @returns {Object} 趋势数据
 */
function calculateTrends(logs, interval = 'hour', periods = 24) {
  const now = Date.now();
  const intervalMs = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000
  }[interval];
  
  const trends = {
    labels: [],
    datasets: {
      total: [],
      success: [],
      failed: [],
      errors: [],
      warnings: []
    }
  };
  
  for (let i = periods - 1; i >= 0; i--) {
    const periodStart = now - (i + 1) * intervalMs;
    const periodEnd = now - i * intervalMs;
    
    // 生成标签
    const date = new Date(periodEnd);
    let label;
    if (interval === 'hour') {
      label = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (interval === 'day') {
      label = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    } else {
      label = `第${Math.ceil((now - periodEnd) / (7 * 24 * 60 * 60 * 1000))}周`;
    }
    trends.labels.push(label);
    
    // 统计该时间段的日志
    const periodLogs = logs.filter(log => 
      log.timestamp >= periodStart && log.timestamp < periodEnd
    );
    
    trends.datasets.total.push(periodLogs.length);
    trends.datasets.success.push(periodLogs.filter(log => log.status === OPERATION_STATUS.SUCCESS).length);
    trends.datasets.failed.push(periodLogs.filter(log => log.status === OPERATION_STATUS.FAILED).length);
    trends.datasets.errors.push(periodLogs.filter(log => log.level === LOG_LEVELS.ERROR).length);
    trends.datasets.warnings.push(periodLogs.filter(log => log.level === LOG_LEVELS.WARN).length);
  }
  
  return trends;
}

/**
 * 检测异常模式
 * @param {Array} logs - 日志数组
 * @returns {Array} 异常检测结果
 */
function detectAnomalies(logs) {
  const anomalies = [];
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const recentLogs = logs.filter(log => now - log.timestamp < oneHour);
  
  // 检测错误率异常
  const errorRate = recentLogs.length > 0 ? 
    (recentLogs.filter(log => log.status === OPERATION_STATUS.FAILED).length / recentLogs.length) * 100 : 0;
  
  if (errorRate > 10) {
    anomalies.push({
      type: 'high_error_rate',
      severity: errorRate > 25 ? 'critical' : 'warning',
      message: `错误率异常: ${errorRate.toFixed(2)}%`,
      value: errorRate,
      threshold: 10,
      timestamp: now
    });
  }
  
  // 检测请求量异常
  const requestCount = recentLogs.length;
  const avgRequestCount = logs.length > 0 ? logs.length / Math.ceil((now - Math.min(...logs.map(l => l.timestamp))) / oneHour) : 0;
  
  if (requestCount > avgRequestCount * 3) {
    anomalies.push({
      type: 'high_request_volume',
      severity: requestCount > avgRequestCount * 5 ? 'critical' : 'warning',
      message: `请求量异常: ${requestCount} (平均: ${avgRequestCount.toFixed(0)})`,
      value: requestCount,
      threshold: avgRequestCount * 3,
      timestamp: now
    });
  }
  
  // 检测响应时间异常
  const recentDurations = recentLogs
    .filter(log => log.details?.duration)
    .map(log => parseInt(log.details.duration))
    .filter(d => !isNaN(d));
    
  if (recentDurations.length > 0) {
    const avgDuration = recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length;
    const maxDuration = Math.max(...recentDurations);
    
    if (avgDuration > 5000) {
      anomalies.push({
        type: 'slow_response',
        severity: avgDuration > 10000 ? 'critical' : 'warning',
        message: `响应时间异常: 平均${avgDuration.toFixed(0)}ms`,
        value: avgDuration,
        threshold: 5000,
        timestamp: now
      });
    }
    
    if (maxDuration > 30000) {
      anomalies.push({
        type: 'timeout_risk',
        severity: 'warning',
        message: `检测到超长响应时间: ${maxDuration}ms`,
        value: maxDuration,
        threshold: 30000,
        timestamp: now
      });
    }
  }
  
  // 检测频繁失败的IP
  const ipFailures = {};
  recentLogs
    .filter(log => log.status === OPERATION_STATUS.FAILED && log.request?.ip)
    .forEach(log => {
      ipFailures[log.request.ip] = (ipFailures[log.request.ip] || 0) + 1;
    });
    
  Object.entries(ipFailures).forEach(([ip, count]) => {
    if (count > 10) {
      anomalies.push({
        type: 'suspicious_ip',
        severity: count > 50 ? 'critical' : 'warning',
        message: `可疑IP活动: ${ip} (${count}次失败)`,
        value: count,
        threshold: 10,
        details: { ip },
        timestamp: now
      });
    }
  });
  
  // 检测重复错误
  const errorMessages = {};
  recentLogs
    .filter(log => log.error?.message)
    .forEach(log => {
      errorMessages[log.error.message] = (errorMessages[log.error.message] || 0) + 1;
    });
    
  Object.entries(errorMessages).forEach(([message, count]) => {
    if (count > 5) {
      anomalies.push({
        type: 'recurring_error',
        severity: count > 20 ? 'critical' : 'warning',
        message: `重复错误: ${message} (${count}次)`,
        value: count,
        threshold: 5,
        details: { errorMessage: message },
        timestamp: now
      });
    }
  });
  
  return anomalies;
}

/**
 * 生成性能指标
 * @param {Array} logs - 日志数组
 * @returns {Object} 性能指标
 */
function generatePerformanceMetrics(logs) {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;
  
  const recentLogs = logs.filter(log => now - log.timestamp < oneHour);
  const dailyLogs = logs.filter(log => now - log.timestamp < oneDay);
  
  // 基础指标
  const metrics = {
    current: {
      totalRequests: recentLogs.length,
      successRate: recentLogs.length > 0 ? 
        ((recentLogs.filter(log => log.status === OPERATION_STATUS.SUCCESS).length / recentLogs.length) * 100).toFixed(2) : 0,
      errorRate: recentLogs.length > 0 ? 
        ((recentLogs.filter(log => log.status === OPERATION_STATUS.FAILED).length / recentLogs.length) * 100).toFixed(2) : 0,
      avgResponseTime: 0,
      uniqueIPs: new Set(recentLogs.map(log => log.request?.ip).filter(ip => ip && ip !== 'unknown')).size
    },
    daily: {
      totalRequests: dailyLogs.length,
      successRate: dailyLogs.length > 0 ? 
        ((dailyLogs.filter(log => log.status === OPERATION_STATUS.SUCCESS).length / dailyLogs.length) * 100).toFixed(2) : 0,
      errorRate: dailyLogs.length > 0 ? 
        ((dailyLogs.filter(log => log.status === OPERATION_STATUS.FAILED).length / dailyLogs.length) * 100).toFixed(2) : 0,
      avgResponseTime: 0,
      uniqueIPs: new Set(dailyLogs.map(log => log.request?.ip).filter(ip => ip && ip !== 'unknown')).size
    }
  };
  
  // 计算响应时间
  const recentDurations = recentLogs
    .filter(log => log.details?.duration)
    .map(log => parseInt(log.details.duration))
    .filter(d => !isNaN(d));
    
  if (recentDurations.length > 0) {
    metrics.current.avgResponseTime = (recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length).toFixed(2);
  }
  
  const dailyDurations = dailyLogs
    .filter(log => log.details?.duration)
    .map(log => parseInt(log.details.duration))
    .filter(d => !isNaN(d));
    
  if (dailyDurations.length > 0) {
    metrics.daily.avgResponseTime = (dailyDurations.reduce((a, b) => a + b, 0) / dailyDurations.length).toFixed(2);
  }
  
  // 操作类型分布
  metrics.operationDistribution = {};
  recentLogs.forEach(log => {
    metrics.operationDistribution[log.operationType] = (metrics.operationDistribution[log.operationType] || 0) + 1;
  });
  
  // 热门路径
  metrics.topPaths = {};
  recentLogs.forEach(log => {
    if (log.request?.path && log.request.path !== 'unknown') {
      metrics.topPaths[log.request.path] = (metrics.topPaths[log.request.path] || 0) + 1;
    }
  });
  
  // 排序并限制数量
  metrics.topPaths = Object.entries(metrics.topPaths)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  
  return metrics;
}

/**
 * 生成告警规则检查
 * @param {Array} logs - 日志数组
 * @param {Object} rules - 告警规则
 * @returns {Array} 触发的告警
 */
function checkAlertRules(logs, rules = {}) {
  const alerts = [];
  const now = Date.now();
  
  // 默认告警规则
  const defaultRules = {
    errorRateThreshold: 15, // 错误率阈值 (%)
    requestVolumeThreshold: 1000, // 请求量阈值 (每小时)
    responseTimeThreshold: 8000, // 响应时间阈值 (ms)
    failedLoginThreshold: 5, // 登录失败阈值
    suspiciousIPThreshold: 20, // 可疑IP阈值
    ...rules
  };
  
  const oneHour = 60 * 60 * 1000;
  const recentLogs = logs.filter(log => now - log.timestamp < oneHour);
  
  // 错误率告警
  const errorRate = recentLogs.length > 0 ? 
    (recentLogs.filter(log => log.status === OPERATION_STATUS.FAILED).length / recentLogs.length) * 100 : 0;
    
  if (errorRate > defaultRules.errorRateThreshold) {
    alerts.push({
      id: `error_rate_${now}`,
      type: 'error_rate',
      severity: errorRate > defaultRules.errorRateThreshold * 2 ? 'critical' : 'warning',
      title: '错误率过高',
      message: `当前错误率 ${errorRate.toFixed(2)}% 超过阈值 ${defaultRules.errorRateThreshold}%`,
      value: errorRate,
      threshold: defaultRules.errorRateThreshold,
      timestamp: now,
      actions: ['检查系统状态', '查看错误日志', '联系技术支持']
    });
  }
  
  // 请求量告警
  if (recentLogs.length > defaultRules.requestVolumeThreshold) {
    alerts.push({
      id: `request_volume_${now}`,
      type: 'request_volume',
      severity: recentLogs.length > defaultRules.requestVolumeThreshold * 2 ? 'critical' : 'warning',
      title: '请求量异常',
      message: `当前小时请求量 ${recentLogs.length} 超过阈值 ${defaultRules.requestVolumeThreshold}`,
      value: recentLogs.length,
      threshold: defaultRules.requestVolumeThreshold,
      timestamp: now,
      actions: ['检查流量来源', '启用限流', '扩容服务器']
    });
  }
  
  // 响应时间告警
  const recentDurations = recentLogs
    .filter(log => log.details?.duration)
    .map(log => parseInt(log.details.duration))
    .filter(d => !isNaN(d));
    
  if (recentDurations.length > 0) {
    const avgDuration = recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length;
    
    if (avgDuration > defaultRules.responseTimeThreshold) {
      alerts.push({
        id: `response_time_${now}`,
        type: 'response_time',
        severity: avgDuration > defaultRules.responseTimeThreshold * 2 ? 'critical' : 'warning',
        title: '响应时间过长',
        message: `平均响应时间 ${avgDuration.toFixed(0)}ms 超过阈值 ${defaultRules.responseTimeThreshold}ms`,
        value: avgDuration,
        threshold: defaultRules.responseTimeThreshold,
        timestamp: now,
        actions: ['检查数据库性能', '优化代码', '增加缓存']
      });
    }
  }
  
  // 登录失败告警
  const failedLogins = recentLogs.filter(log => 
    log.operationType === OPERATION_TYPES.AUTH_LOGIN && log.status === OPERATION_STATUS.FAILED
  ).length;
  
  if (failedLogins > defaultRules.failedLoginThreshold) {
    alerts.push({
      id: `failed_login_${now}`,
      type: 'failed_login',
      severity: failedLogins > defaultRules.failedLoginThreshold * 3 ? 'critical' : 'warning',
      title: '登录失败次数过多',
      message: `当前小时登录失败 ${failedLogins} 次，超过阈值 ${defaultRules.failedLoginThreshold} 次`,
      value: failedLogins,
      threshold: defaultRules.failedLoginThreshold,
      timestamp: now,
      actions: ['检查暴力破解', '启用验证码', '临时封禁IP']
    });
  }
  
  return alerts;
}

/**
 * 分析API - 获取日志分析数据
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
      return new Response(JSON.stringify({
        success: false,
        message: '未授权访问'
      }), {
        status: 401,
        headers
      });
    }
    
    // 解析查询参数
    const analysisType = url.searchParams.get('type') || 'overview';
    const timeRange = url.searchParams.get('timeRange') || '24h';
    const interval = url.searchParams.get('interval') || 'hour';
    const includeAlerts = url.searchParams.get('includeAlerts') === 'true';
    
    // 获取所有日志
    const allLogs = await env.API_LOGS.list({ prefix: 'log:' });
    const logDetails = await Promise.all(
      allLogs.keys.map(async (key) => {
        try {
          const value = await env.API_LOGS.get(key.name);
          return value ? JSON.parse(value) : null;
        } catch (error) {
          return null;
        }
      })
    );
    
    const validLogs = logDetails.filter(log => log !== null);
    
    // 根据时间范围过滤日志
    const now = Date.now();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '3d': 3 * 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[timeRange] || 24 * 60 * 60 * 1000;
    
    const filteredLogs = validLogs.filter(log => 
      now - log.timestamp < timeRangeMs
    );
    
    let result = {
      success: true,
      data: {
        timeRange,
        analysisType,
        timestamp: now
      }
    };
    
    // 根据分析类型返回不同数据
    switch (analysisType) {
      case 'overview':
        result.data.metrics = generatePerformanceMetrics(filteredLogs);
        result.data.anomalies = detectAnomalies(filteredLogs);
        if (includeAlerts) {
          result.data.alerts = checkAlertRules(filteredLogs);
        }
        break;
        
      case 'trends':
        const periods = {
          'hour': 24,
          'day': 30,
          'week': 12
        }[interval] || 24;
        result.data.trends = calculateTrends(filteredLogs, interval, periods);
        break;
        
      case 'performance':
        result.data.metrics = generatePerformanceMetrics(filteredLogs);
        break;
        
      case 'anomalies':
        result.data.anomalies = detectAnomalies(filteredLogs);
        break;
        
      case 'alerts':
        result.data.alerts = checkAlertRules(filteredLogs);
        break;
        
      default:
        result.data.metrics = generatePerformanceMetrics(filteredLogs);
        result.data.trends = calculateTrends(filteredLogs, interval, 24);
        result.data.anomalies = detectAnomalies(filteredLogs);
    }
    
    // 记录分析操作
    await logger.success(OPERATION_TYPES.LOGS_VIEW, {
      request,
      operator: context.data.user.id,
      details: {
        analysisType,
        timeRange,
        logCount: filteredLogs.length
      }
    });
    
    return new Response(JSON.stringify(result), { headers });
    
  } catch (error) {
    await logger.error(OPERATION_TYPES.LOGS_VIEW, error, {
      request,
      operator: context.data?.user?.id || 'unknown'
    });
    
    return new Response(JSON.stringify({
      success: false,
      message: '获取分析数据失败: ' + error.message
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