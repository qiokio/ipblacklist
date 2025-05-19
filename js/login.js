// 登录页面逻辑
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');

    console.log('login.js加载 - 当前页面:', window.location.pathname);
    
    // 检查是否已经登录
    checkAuthStatus();

    loginBtn.addEventListener('click', handleLogin);
    
    // 添加回车键登录功能
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });

    // 处理登录逻辑
    async function handleLogin() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        // 简单验证
        if (!username || !password) {
            showError('请输入用户名和密码');
            return;
        }
        
        console.log('尝试登录，用户名:', username);
        
        // 显示加载状态
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            
            console.log('登录响应状态:', response.status);
            const data = await response.json();
            console.log('登录响应数据:', data);
            
            if (response.ok && data.success) {
                // 登录成功，保存认证信息
                console.log('登录成功，保存令牌到localStorage');
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user', JSON.stringify({
                    username: username,
                    loginTime: new Date().toISOString()
                }));
                
                // 打印状态进行确认
                console.log('保存后的localStorage状态:', {
                    'auth_token': localStorage.getItem('auth_token') ? '已设置' : '未设置',
                    'user': localStorage.getItem('user')
                });
                
                // 确保令牌正确存储后再重定向
                setTimeout(() => {
                    // 重定向到管理页面
                    window.location.href = '/dashboard.html';
                }, 500);
            } else {
                // 移除加载状态
                loginBtn.classList.remove('loading');
                loginBtn.disabled = false;
                showError(data.message || '登录失败，请检查用户名和密码');
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            // 移除加载状态
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            showError('登录请求失败，请稍后再试');
        }
    }
    
    // 显示错误信息
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // 3秒后自动隐藏错误信息
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
    
    // 检查认证状态
    async function checkAuthStatus() {
        const token = localStorage.getItem('auth_token');
        console.log('checkAuthStatus - token存在:', !!token);
        
        if (token) {
            try {
                console.log('验证已保存的token...');
                const response = await fetch('/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('验证响应状态:', response.status);
                const data = await response.json();
                console.log('验证响应数据:', data);
                
                if (response.ok && data.valid) {
                    // 已登录，重定向到主页
                    console.log('令牌有效，重定向到控制台');
                    window.location.href = '/dashboard.html';
                } else {
                    // 令牌无效，清除
                    console.log('令牌无效，清除localStorage');
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error('验证登录状态失败:', error);
                // 清除可能无效的认证信息
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
            }
        }
    }
}); 