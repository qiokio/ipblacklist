// API密钥创建接口

// API密钥前缀(用于KV存储)
const API_KEY_PREFIX = 'apikey:';
// API密钥列表的键名
const API_KEY_LIST = 'apikeys_list';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  
  try {
    // 解析请求体中的API密钥数据
    const { key, note, permissions, createdAt } = await request.json();
    
    if (!key) {
      return new Response(JSON.stringify({
        success: false,
        message: '无效的API密钥'
      }), {
        status: 400,
        headers
      });
    }
    
    // 验证权限格式
    const defaultPermissions = {
      read: true,   // 查看IP是否在黑名单的权限
      list: false,  // 获取IP列表的权限
      add: false,   // 添加IP的权限
      delete: false // 删除IP的权限
    };
    
    // 使用提供的权限或默认权限
    const keyPermissions = permissions || defaultPermissions;
    
    // 存储API密钥到KV - 使用新的API_KEYS命名空间
    const keyData = {
      key,
      note: note || '',
      permissions: keyPermissions,
      createdAt: createdAt || new Date().toISOString()
    };
    
    await env.API_KEYS.put(`${API_KEY_PREFIX}${key}`, JSON.stringify(keyData));
    
    // 添加到API密钥列表
    let keysList = [];
    try {
      const existingList = await env.API_KEYS.get(API_KEY_LIST);
      if (existingList) {
        keysList = JSON.parse(existingList);
      }
    } catch (error) {
      console.error('获取API密钥列表失败:', error);
    }
    
    // 确保不添加重复密钥
    if (!keysList.includes(key)) {
      keysList.push(key);
      await env.API_KEYS.put(API_KEY_LIST, JSON.stringify(keysList));
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'API密钥创建成功'
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '创建API密钥失败: ' + error.message
    }), {
      status: 500,
      headers
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