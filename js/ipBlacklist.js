// IP黑名单管理模块
// 使用 Cloudflare KV 存储黑名单数据

// 通过Functions API访问KV
const API_BASE = '/functions/api/blacklist';

// 获取认证令牌
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

// 创建认证头信息
function createAuthHeaders() {
    // 只返回Content-Type头，不再在请求头中包含认证令牌
    return {
        'Content-Type': 'application/json'
    };
}

// 获取认证数据（用于请求体）
function getAuthData() {
    const token = getAuthToken();
    return token ? { token } : {};
}

/**
 * 检测KV连接状态
 * @returns {Promise<{connected: boolean, message: string}>} 连接状态信息
 */
async function checkKVConnection() {
    try {
        const response = await fetch('/api/blacklist/check', {
            method: 'POST',
            headers: createAuthHeaders(),
            body: JSON.stringify(getAuthData())
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('检查KV连接失败:', errorData);
            if (response.status === 401) {
                // 对于KV连接检查，如果未认证，我们返回一个友好的错误而不是强制跳转
                return {
                    connected: false,
                    message: '需要登录才能访问KV存储'
                };
            }
            return {
                connected: false,
                message: `检查KV连接失败: ${response.statusText}`
            };
        }
        
        return await response.json();
    } catch (error) {
        console.error('检查KV连接接口错误:', error);
        return {
            connected: false,
            message: `检查KV连接接口错误: ${error.message}`
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
        // 获取认证数据
        const authData = getAuthData();
        
        const response = await fetch(`${API_BASE}/add`, {
            method: 'POST',
            headers: createAuthHeaders(),
            body: JSON.stringify({ 
                ...authData,
                ip 
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('添加IP到黑名单失败:', errorData);
            if (response.status === 401) {
                // 认证失败，提示用户登录
                alert('您的登录已过期，请重新登录');
                window.location.href = '/login.html';
            }
            return false;
        }
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('添加IP到黑名单接口错误:', error);
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
        // 获取认证数据
        const authData = getAuthData();
        
        const response = await fetch('/api/blacklist/remove', {
            method: 'POST',
            headers: createAuthHeaders(),
            body: JSON.stringify({ 
                ...authData,
                ip 
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('从黑名单移除IP失败:', errorData);
            if (response.status === 401) {
                // 认证失败，提示用户登录
                alert('您的登录已过期，请重新登录');
                window.location.href = '/login.html';
            }
            return false;
        }
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('从黑名单移除IP接口错误:', error);
        return false;
    }
}

/**
 * 获取完整的黑名单列表
 * @returns {Promise<string[]>} - 黑名单IP数组
 */
async function getBlacklist() {
    try {
        // 获取认证数据
        const authData = getAuthData();
        
        const response = await fetch('/api/blacklist/get', {
            method: 'POST',
            headers: createAuthHeaders(),
            body: JSON.stringify(authData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('获取黑名单失败:', errorData);
            if (response.status === 401) {
                // 认证失败，提示用户登录
                alert('您的登录已过期，请重新登录');
                window.location.href = '/login.html';
            }
            return [];
        }
        
        return await response.json();
    } catch (error) {
        console.error('获取黑名单接口错误:', error);
        return [];
    }
}

// 检查IP是否在黑名单中
async function checkIP(ip) {
    try {
        const response = await fetch(`/api/blacklist/check-api?ip=${encodeURIComponent(ip)}`);
        
        if (!response.ok) {
            console.error('检查IP状态失败:', response.statusText);
            return { blocked: false, error: true, message: '检查IP状态失败' };
        }
        
        return await response.json();
    } catch (error) {
        console.error('检查IP接口错误:', error);
        return { blocked: false, error: true, message: '检查IP接口错误' };
    }
}

export {
    isIPBlacklisted,
    addToBlacklist,
    removeFromBlacklist,
    getBlacklist,
    checkKVConnection,
    checkIP
};