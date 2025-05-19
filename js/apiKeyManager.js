// API密钥管理模块

// API密钥前缀(用于KV存储)
const API_KEY_PREFIX = 'apikey:';

// 生成随机API密钥
function generateApiKey(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        result += chars.charAt(randomValues[i] % chars.length);
    }
    return result;
}

// 创建API密钥
async function createApiKey(note) {
    try {
        const key = generateApiKey();
        const apiKeyData = {
            key,
            note: note || '',
            createdAt: new Date().toISOString()
        };
        
        const response = await fetch('/api/apikey/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(apiKeyData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '创建API密钥失败');
        }
        
        return apiKeyData;
    } catch (error) {
        console.error('创建API密钥出错:', error);
        throw error;
    }
}

// 获取所有API密钥
async function getAllApiKeys() {
    try {
        const response = await fetch('/api/apikey/list', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '获取API密钥列表失败');
        }
        
        return await response.json();
    } catch (error) {
        console.error('获取API密钥列表出错:', error);
        throw error;
    }
}

// 更新API密钥备注
async function updateApiKeyNote(key, note) {
    try {
        const response = await fetch('/api/apikey/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({ key, note })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '更新API密钥备注失败');
        }
        
        return true;
    } catch (error) {
        console.error('更新API密钥备注出错:', error);
        throw error;
    }
}

// 删除API密钥
async function deleteApiKey(key) {
    try {
        const response = await fetch('/api/apikey/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({ key })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '删除API密钥失败');
        }
        
        return true;
    } catch (error) {
        console.error('删除API密钥出错:', error);
        throw error;
    }
}

export {
    generateApiKey,
    createApiKey,
    getAllApiKeys,
    updateApiKeyNote,
    deleteApiKey
}; 