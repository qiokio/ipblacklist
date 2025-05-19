// IP黑名单管理模块
// 使用 Cloudflare KV 存储黑名单数据

// 通过Functions API访问KV
const API_BASE = '/functions/api/blacklist';

/**
 * 检测KV连接状态
 * @returns {Promise<{connected: boolean, message: string}>} 连接状态信息
 */
async function checkKVConnection() {
    try {
        // 如果window.ENV中有KV状态信息，直接使用
        if (window.ENV && window.ENV.KV_STATUS) {
            return window.ENV.KV_STATUS;
        }
        
        // 否则通过API检查连接状态（使用Functions API）
        const response = await fetch(`${API_BASE}/check`);
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('KV连接测试失败:', error);
        return {
            connected: false,
            message: `KV连接错误: ${error.message}`
        };
    }
}

/**
 * 检查IP是否在黑名单中
 * @param {string} ip - 要检查的IP地址
 * @returns {Promise<boolean>} - 如果IP在黑名单中返回true
 */
async function isIPBlacklisted(ip) {
    try {
        const blacklist = await getBlacklist();
        return blacklist.includes(ip);
    } catch (error) {
        console.error('检查IP黑名单时出错:', error);
        return false;
    }
}

/**
 * 添加IP到黑名单
 * @param {string} ip - 要添加到黑名单的IP地址
 * @returns {Promise<boolean>} - 操作是否成功
 */
async function addToBlacklist(ip) {
    try {
        const response = await fetch(`${API_BASE}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ip })
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('添加IP到黑名单时出错:', error);
        return false;
    }
}

/**
 * 从黑名单中移除IP
 * @param {string} ip - 要从黑名单中移除的IP地址
 * @returns {Promise<boolean>} - 操作是否成功
 */
async function removeFromBlacklist(ip) {
    try {
        const response = await fetch(`${API_BASE}/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ip })
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('从黑名单移除IP时出错:', error);
        return false;
    }
}

/**
 * 获取完整的黑名单列表
 * @returns {Promise<string[]>} - 黑名单IP数组
 */
async function getBlacklist() {
    try {
        const response = await fetch(`${API_BASE}/get`);
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('获取黑名单时出错:', error);
        return [];
    }
}

export {
    isIPBlacklisted,
    addToBlacklist,
    removeFromBlacklist,
    getBlacklist,
    checkKVConnection
}; 