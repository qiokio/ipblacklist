/**
 * 简单的JWT实现
 * 注意：这是一个极简实现，仅用于演示目的
 * 生产环境中应使用专业的JWT库
 */

// Base64 URL 编码
function base64UrlEncode(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Base64 URL 解码
function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

// 创建JWT令牌
export function sign(payload, secret) {
  // 创建头部
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // 编码头部和负载
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  // 创建签名
  // 注意：这是一个简化的实现，实际上应该使用HMAC-SHA256
  // 实际应用中请使用专业的加密库
  const signature = base64UrlEncode(
    JSON.stringify({
      data: `${encodedHeader}.${encodedPayload}`,
      secret
    })
  );
  
  // 返回完整的JWT
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// 验证JWT令牌
export function verify(token, secret) {
  // 解析令牌
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('无效的JWT格式');
  }
  
  const [encodedHeader, encodedPayload, signature] = parts;
  
  // 验证签名
  // 注意：这是一个简化的实现
  const expectedSignature = base64UrlEncode(
    JSON.stringify({
      data: `${encodedHeader}.${encodedPayload}`,
      secret
    })
  );
  
  if (signature !== expectedSignature) {
    throw new Error('无效的签名');
  }
  
  // 解码负载
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    return payload;
  } catch (error) {
    throw new Error('无法解析令牌负载');
  }
} 