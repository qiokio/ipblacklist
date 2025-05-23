// 统一日志记录模块
// 提供详细的操作日志记录功能，包含完整的上下文信息

// 日志级别定义
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// 操作类型定义
export const OPERATION_TYPES = {
  // 黑名单操作
  BLACKLIST_ADD: 'blacklist_add',
  BLACKLIST_REMOVE: 'blacklist_remove',
  BLACKLIST_CHECK: 'blacklist_check',
  BLACKLIST_GET: 'blacklist_get',
  BLACKLIST_BULK_ADD: 'blacklist_bulk_add',
  BLACKLIST_BULK_REMOVE: 'blacklist_bulk_remove',
  
  // API密钥操作
  APIKEY_CREATE: 'apikey_create',
  APIKEY_DELETE: 'apikey_delete',
  APIKEY_UPDATE: 'apikey_update',
  APIKEY_LIST: 'apikey_list',
  APIKEY_VERIFY: 'apikey_verify',
  
  // 认证操作
  AUTH_LOGIN: 'auth_login',
  AUTH_LOGOUT: 'auth_logout',
  AUTH_TOKEN_VERIFY: 'auth_token_verify',
  AUTH_TOKEN_REFRESH: 'auth_token_refresh',
  
  // 权限操作
  PERMISSION_CHECK: 'permission_check',
  PERMISSION_GRANT: 'permission_grant',
  PERMISSION_REVOKE: 'permission_revoke',
  
  // 系统操作
  SYSTEM_STARTUP: 'system_startup',
  SYSTEM_SHUTDOWN: 'system_shutdown',
  SYSTEM_ERROR: 'system_error',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  
  // 日志操作
  LOGS_VIEW: 'logs_view',
  LOGS_CLEANUP: 'logs_cleanup',
  LOGS_EXPORT: 'logs_export',
  LOGS_CLEAR_ALL: 'logs_clear_all',
  
  // 配置操作
  CONFIG_UPDATE: 'config_update',
  CONFIG_RESET: 'config_reset',
  
  // 数据操作
  DATA_IMPORT: 'data_import',
  DATA_EXPORT: 'data_export',
  DATA_BACKUP: 'data_backup',
  DATA_RESTORE: 'data_restore'
};

// 操作状态定义
export const OPERATION_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  TIMEOUT: 'timeout'
};

// 日志前缀
const LOG_PREFIX = 'log:';

/**
 * 生成唯一的日志ID
 * @returns {string} 日志ID
 */
function generateLogId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${LOG_PREFIX}${timestamp}_${random}`;
}

/**
 * 获取客户端IP地址
 * @param {Request} request - HTTP请求对象
 * @returns {string} IP地址
 */
function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For') || 
         request.headers.get('X-Real-IP') || 
         'unknown';
}

/**
 * 获取用户代理信息
 * @param {Request} request - HTTP请求对象
 * @returns {string} 用户代理字符串
 */
function getUserAgent(request) {
  return request.headers.get('User-Agent') || 'unknown';
}

/**
 * 获取请求来源
 * @param {Request} request - HTTP请求对象
 * @returns {string} 来源URL
 */
function getReferer(request) {
  return request.headers.get('Referer') || 'direct';
}

/**
 * 解析请求体数据
 * @param {Request} request - HTTP请求对象
 * @returns {Object} 解析后的请求体数据
 */
async function parseRequestBody(request) {
  try {
    const contentType = request.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      const clonedRequest = request.clone();
      return await clonedRequest.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const clonedRequest = request.clone();
      const formData = await clonedRequest.formData();
      const data = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
      return data;
    }
  } catch (error) {
    console.warn('解析请求体失败:', error.message);
  }
  return null;
}

/**
 * 创建详细的日志条目
 * @param {Object} options - 日志选项
 * @returns {Object} 格式化的日志条目
 */
function createLogEntry(options) {
  const {
    operationType,
    operator = 'system',
    level = LOG_LEVELS.INFO,
    status = OPERATION_STATUS.SUCCESS,
    message,
    details = {},
    request,
    error = null,
    duration = null,
    metadata = {}
  } = options;

  const timestamp = Date.now();
  const logEntry = {
    // 基本信息
    id: generateLogId(),
    timestamp,
    operationType,
    operator,
    level,
    status,
    message: message || `执行操作: ${operationType}`,
    
    // 请求信息
    request: {
      method: request?.method || 'unknown',
      url: request?.url || 'unknown',
      path: request ? new URL(request.url).pathname : 'unknown',
      query: request ? Object.fromEntries(new URL(request.url).searchParams) : {},
      headers: {
        userAgent: request ? getUserAgent(request) : 'unknown',
        referer: request ? getReferer(request) : 'unknown',
        contentType: request?.headers.get('Content-Type') || 'unknown'
      },
      ip: request ? getClientIP(request) : 'unknown'
    },
    
    // 操作详情
    details: {
      ...details,
      duration: duration ? `${duration}ms` : null
    },
    
    // 错误信息
    error: error ? {
      message: error.message || error,
      stack: error.stack || null,
      code: error.code || null
    } : null,
    
    // 元数据
    metadata: {
      ...metadata,
      version: '2.0',
      environment: 'production'
    },
    
    // 格式化时间
    formattedTime: new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  };

  return logEntry;
}

/**
 * 日志记录器类
 */
export class Logger {
  constructor(env) {
    this.env = env;
    this.context = {};
  }

  /**
   * 设置日志上下文
   * @param {Object} context - 上下文信息
   */
  setContext(context) {
    this.context = { ...this.context, ...context };
  }

  /**
   * 记录操作日志
   * @param {Object} options - 日志选项
   * @returns {Promise<boolean>} 是否记录成功
   */
  async log(options) {
    try {
      // 合并上下文信息
      const mergedOptions = {
        ...options,
        details: { ...this.context, ...options.details },
        metadata: { ...this.context.metadata, ...options.metadata }
      };

      // 创建日志条目
      const logEntry = createLogEntry(mergedOptions);
      
      // 存储到KV
      await this.env.API_LOGS.put(logEntry.id, JSON.stringify(logEntry));
      
      // 在开发环境下输出到控制台
      if (this.env.ENVIRONMENT === 'development') {
        console.log(`[${logEntry.level.toUpperCase()}] ${logEntry.message}`, logEntry);
      }
      
      return true;
    } catch (error) {
      console.error('记录日志失败:', error);
      return false;
    }
  }

  /**
   * 记录成功操作
   * @param {string} operationType - 操作类型
   * @param {Object} options - 其他选项
   */
  async success(operationType, options = {}) {
    return this.log({
      operationType,
      level: LOG_LEVELS.INFO,
      status: OPERATION_STATUS.SUCCESS,
      ...options
    });
  }

  /**
   * 记录失败操作
   * @param {string} operationType - 操作类型
   * @param {Error|string} error - 错误信息
   * @param {Object} options - 其他选项
   */
  async error(operationType, error, options = {}) {
    return this.log({
      operationType,
      level: LOG_LEVELS.ERROR,
      status: OPERATION_STATUS.FAILED,
      error,
      ...options
    });
  }

  /**
   * 记录警告
   * @param {string} operationType - 操作类型
   * @param {string} message - 警告消息
   * @param {Object} options - 其他选项
   */
  async warn(operationType, message, options = {}) {
    return this.log({
      operationType,
      level: LOG_LEVELS.WARN,
      status: OPERATION_STATUS.SUCCESS,
      message,
      ...options
    });
  }

  /**
   * 记录调试信息
   * @param {string} operationType - 操作类型
   * @param {string} message - 调试消息
   * @param {Object} options - 其他选项
   */
  async debug(operationType, message, options = {}) {
    return this.log({
      operationType,
      level: LOG_LEVELS.DEBUG,
      status: OPERATION_STATUS.SUCCESS,
      message,
      ...options
    });
  }

  /**
   * 记录关键错误
   * @param {string} operationType - 操作类型
   * @param {Error|string} error - 错误信息
   * @param {Object} options - 其他选项
   */
  async critical(operationType, error, options = {}) {
    return this.log({
      operationType,
      level: LOG_LEVELS.CRITICAL,
      status: OPERATION_STATUS.FAILED,
      error,
      ...options
    });
  }

  /**
   * 开始计时操作
   * @param {string} operationType - 操作类型
   * @returns {Function} 结束计时的函数
   */
  startTimer(operationType) {
    const startTime = Date.now();
    
    return async (options = {}) => {
      const duration = Date.now() - startTime;
      return this.log({
        operationType,
        duration,
        ...options
      });
    };
  }
}

/**
 * 创建日志记录器实例
 * @param {Object} env - 环境变量
 * @returns {Logger} 日志记录器实例
 */
export function createLogger(env) {
  return new Logger(env);
}

/**
 * 兼容性函数 - 保持与现有代码的兼容性
 * @param {Object} env - 环境变量
 * @param {Object} data - 日志数据
 * @returns {Promise<boolean>} 是否记录成功
 */
export async function logOperation(env, data) {
  const logger = createLogger(env);
  return logger.log({
    operationType: data.operationType,
    operator: data.operator,
    details: data.details || {},
    request: data.request,
    status: data.status,
    error: data.error,
    message: data.message
  });
}

export default {
  Logger,
  createLogger,
  logOperation,
  LOG_LEVELS,
  OPERATION_TYPES,
  OPERATION_STATUS
};