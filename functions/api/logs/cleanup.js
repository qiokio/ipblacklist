// 日志清理API
import { createLogger, OPERATION_TYPES } from '../../utils/logger.js';

export async function onRequest(context) {
  const { request, env } = context;
  const logger = createLogger(env);
  
  // 只允许管理员访问
  if (!context.data?.user?.isAdmin) {
    return new Response(JSON.stringify({
      success: false,
      error: '需要管理员权限'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: '方法不允许'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  try {
    const url = new URL(request.url);
    const operator = context.data?.user?.id || 'system';
    
    // 检查是否为清空所有日志的请求
    const clearAll = url.searchParams.get('clearAll') === 'true';
    
    if (clearAll) {
      // 获取所有日志
      const logs = await env.API_LOGS.list({ prefix: 'log:' });
      
      // 删除所有日志
      const deletePromises = logs.keys.map(key => env.API_LOGS.delete(key.name));
      
      await Promise.all(deletePromises);
      
      // 记录清空日志操作
      await logger.success(OPERATION_TYPES.LOGS_CLEAR_ALL, {
        request,
        operator,
        details: { 
          clearedCount: deletePromises.length,
          action: 'clear_all'
        }
      });
      
      return new Response(JSON.stringify({
        success: true,
        message: '已清空所有日志',
        deletedCount: deletePromises.length
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      // 原有的按保留天数清理功能
      const retentionDays = parseInt(url.searchParams.get('retentionDays') || '30');
      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
      
      // 获取所有日志
      const logs = await env.API_LOGS.list({ prefix: 'log:' });
      
      // 删除过期日志
      const deletePromises = logs.keys
        .filter(key => {
          const timestamp = parseInt(key.name.split('_')[0].replace('log:', ''));
          return timestamp < cutoffTime;
        })
        .map(key => env.API_LOGS.delete(key.name));
      
      await Promise.all(deletePromises);
      
      // 记录清理操作
      await logger.success(OPERATION_TYPES.LOGS_CLEANUP, {
        request,
        operator,
        details: { 
          retentionDays,
          cutoffTime,
          deletedCount: deletePromises.length,
          action: 'cleanup_expired'
        }
      });
      
      return new Response(JSON.stringify({
        success: true,
        message: '日志清理完成',
        deletedCount: deletePromises.length
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    // 记录错误
    await logger.error(OPERATION_TYPES.LOGS_CLEANUP, error, {
      request,
      operator: context.data?.user?.id || 'system'
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: '清理日志失败',
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

// 处理预检请求
export function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}