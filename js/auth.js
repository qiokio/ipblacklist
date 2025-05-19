// 身份认证管理
document.addEventListener('DOMContentLoaded', () => {
    // DOM元素
    const userInfo = document.getElementById('userInfo');
    const usernameElement = document.getElementById('username');
    const loginActions = document.getElementById('loginActions');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginPageBtn = document.getElementById('loginPageBtn');
    const authMessage = document.getElementById('authMessage');
    const mainContent = document.getElementById('mainContent');
    
    // 初始化认证状态
    initAuth();
    
    // 事件监听
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (loginPageBtn) {
        loginPageBtn.addEventListener('click', () => {
            window.location.href = '/login.html';
        });
    }
    
    // 初始化认证
    async function initAuth() {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
            try {
                // 验证令牌
                const response = await fetch('/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                
                if (response.ok && data.valid) {
                    // 已登录
                    showAuthenticatedUI(data.user);
                } else {
                    // 令牌无效
                    showUnauthenticatedUI();
                }
            } catch (error) {
                console.error('验证认证失败:', error);
                showUnauthenticatedUI();
            }
        } else {
            // 未登录
            showUnauthenticatedUI();
        }
    }
    
    // 显示已认证界面
    function showAuthenticatedUI(user) {
        if (usernameElement) {
            usernameElement.textContent = user.username;
        }
        
        if (userInfo) {
            userInfo.style.display = 'flex';
        }
        
        if (loginActions) {
            loginActions.style.display = 'none';
        }
        
        if (authMessage) {
            authMessage.style.display = 'none';
        }
        
        if (mainContent) {
            mainContent.style.display = 'block';
        }
        
        // 显示使用指南
        const usageGuide = document.getElementById('usageGuide');
        if (usageGuide) {
            usageGuide.style.display = 'block';
        }
    }
    
    // 显示未认证界面
    function showUnauthenticatedUI() {
        // 清除认证信息
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        
        if (userInfo) {
            userInfo.style.display = 'none';
        }
        
        if (loginActions) {
            loginActions.style.display = 'block';
        }
        
        if (authMessage) {
            authMessage.style.display = 'block';
        }
        
        if (mainContent) {
            mainContent.style.display = 'none';
        }
        
        // 隐藏使用指南
        const usageGuide = document.getElementById('usageGuide');
        if (usageGuide) {
            usageGuide.style.display = 'none';
        }
    }
    
    // 处理退出登录
    function handleLogout() {
        showUnauthenticatedUI();
    }
}); 