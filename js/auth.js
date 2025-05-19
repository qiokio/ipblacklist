// 身份认证管理
document.addEventListener('DOMContentLoaded', () => {
    // DOM元素
    const userInfo = document.getElementById('userInfo');
    const usernameElement = document.getElementById('username');
    const loginActions = document.getElementById('loginActions');
    const loginPageBtn = document.getElementById('loginPageBtn');
    const authMessage = document.getElementById('authMessage');
    const mainContent = document.getElementById('mainContent');
    
    console.log('auth.js加载 - 当前页面:', window.location.pathname);
    console.log('DOM元素状态:', {
        userInfo: !!userInfo,
        usernameElement: !!usernameElement,
        loginActions: !!loginActions,
        authMessage: !!authMessage,
        mainContent: !!mainContent
    });
    
    // 初始化认证状态
    initAuth();
    
    // 事件监听
    // 注意：退出登录功能已移至logout.js
    
    if (loginPageBtn) {
        loginPageBtn.addEventListener('click', () => {
            window.location.href = '/login.html';
        });
    }
    
    // 初始化认证
    async function initAuth() {
        const token = localStorage.getItem('auth_token');
        console.log('initAuth - token存在:', !!token);
        
        if (token) {
            try {
                console.log('正在验证token...');
                // 验证令牌
                const response = await fetch('/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('验证响应状态:', response.status);
                const data = await response.json();
                console.log('验证响应数据:', data);
                
                if (response.ok && data.valid) {
                    // 已登录
                    console.log('令牌有效，显示已登录UI');
                    showAuthenticatedUI(data.user);
                } else {
                    // 令牌无效
                    console.log('令牌无效，显示未登录UI');
                    showUnauthenticatedUI();
                }
            } catch (error) {
                console.error('验证认证失败:', error);
                showUnauthenticatedUI();
            }
        } else {
            // 未登录
            console.log('无token，显示未登录UI');
            showUnauthenticatedUI();
        }
    }
    
    // 显示已认证界面
    function showAuthenticatedUI(user) {
        console.log('显示已认证界面，用户:', user.username);
        
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
        console.log('显示未认证界面');
        
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
}); 