// 登录页面逻辑
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');

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
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // 登录成功，保存认证信息
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user', username);
                
                // 重定向到管理页面
                window.location.href = '/';
            } else {
                showError(data.message || '登录失败，请检查用户名和密码');
            }
        } catch (error) {
            console.error('登录请求失败:', error);
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
        
        if (token) {
            try {
                const response = await fetch('/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                
                if (response.ok && data.valid) {
                    // 已登录，重定向到主页
                    window.location.href = '/';
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