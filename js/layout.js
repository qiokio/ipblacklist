// 布局交互功能
document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const gridContainer = document.querySelector('.grid-container');
    
    // 添加侧边栏收起按钮
    addSidebarToggle();
    
    // 处理移动端菜单切换
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // 当前页面激活样式
    const currentPath = window.location.pathname;
    const menuLinks = document.querySelectorAll('.sidebar-menu-link');
    
    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || 
            (currentPath === '/' && href === '/index.html') ||
            (href !== '/' && href !== '/index.html' && currentPath.includes(href))) {
            link.classList.add('active');
        }
        
        // 为每个菜单链接添加span包裹文本内容
        const textContent = link.innerHTML.replace(/<span class="sidebar-menu-icon">.*?<\/span>\s*/g, '');
        link.innerHTML = link.innerHTML.replace(textContent, `<span class="sidebar-menu-text">${textContent}</span>`);
    });
    
    // 初始化侧边栏状态
    initSidebarState();
    
    // 登录状态管理
    const userInfo = document.getElementById('userInfo');
    const loginActions = document.getElementById('loginActions');
    const usernameElement = document.getElementById('username');
    
    // 获取认证令牌
    const token = localStorage.getItem('auth_token');
    console.log('当前页面路径:', window.location.pathname);
    console.log('localStorage中的token:', token ? '存在' : '不存在');
    
    if (token) {
        console.log('正在验证token...');
        // 尝试获取用户信息
        fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            console.log('验证响应状态:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('验证响应数据:', data);
            if (data.valid) {
                // 显示用户信息
                console.log('令牌有效，用户名:', data.user.username);
                if (usernameElement) {
                    usernameElement.textContent = data.user.username;
                }
                if (userInfo) userInfo.style.display = 'flex';
                if (loginActions) loginActions.style.display = 'none';
            } else {
                // 令牌无效
                console.log('令牌无效');
                localStorage.removeItem('auth_token'); // 移除无效令牌
                localStorage.removeItem('user');
                if (userInfo) userInfo.style.display = 'none';
                if (loginActions) loginActions.style.display = 'flex';
            }
        })
        .catch(error => {
            console.error('验证失败:', error);
            localStorage.removeItem('auth_token'); // 出错时也移除令牌
            localStorage.removeItem('user');
            if (userInfo) userInfo.style.display = 'none';
            if (loginActions) loginActions.style.display = 'flex';
        });
    } else {
        // 未登录
        console.log('未检测到令牌，显示未登录状态');
        if (userInfo) userInfo.style.display = 'none';
        if (loginActions) loginActions.style.display = 'flex';
    }
    
    // 注意：退出登录功能已移至logout.js
    
    // 添加侧边栏收起按钮
    function addSidebarToggle() {
        if (!sidebar) return;
        
        // 移除已存在的按钮（防止重复）
        const existingToggle = document.querySelector('.sidebar-toggle-container');
        if (existingToggle) {
            existingToggle.remove();
        }
        
        // 创建一个容器div来放置按钮
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'sidebar-toggle-container';
        
        const toggleButton = document.createElement('button');
        toggleButton.className = 'sidebar-toggle';
        toggleButton.setAttribute('aria-label', '收起侧边栏');
        toggleButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        
        toggleButton.addEventListener('click', () => {
            toggleSidebar();
        });
        
        toggleContainer.appendChild(toggleButton);
        
        // 将按钮添加到顶栏
        const topBar = document.querySelector('.top-bar');
        if (topBar) {
            // 在移动端菜单按钮之前插入
            const mobileMenuToggle = document.getElementById('mobileMenuToggle');
            if (mobileMenuToggle) {
                topBar.insertBefore(toggleContainer, mobileMenuToggle);
            } else {
                topBar.insertBefore(toggleContainer, topBar.firstChild);
            }
        }
    }
    
    // 切换侧边栏状态
    function toggleSidebar() {
        if (!gridContainer) return;
        
        const isCollapsed = gridContainer.classList.toggle('sidebar-collapsed');
        const toggleButton = document.querySelector('.sidebar-toggle');
        
        if (toggleButton) {
            toggleButton.innerHTML = isCollapsed ? 
                '<i class="fas fa-chevron-right"></i>' : 
                '<i class="fas fa-chevron-left"></i>';
            
            toggleButton.setAttribute('aria-label', 
                isCollapsed ? '展开侧边栏' : '收起侧边栏');
        }
        
        // 保存状态到本地存储
        localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
    }
    
    // 初始化侧边栏状态
    function initSidebarState() {
        const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        
        if (isCollapsed && gridContainer) {
            gridContainer.classList.add('sidebar-collapsed');
            
            const toggleButton = document.querySelector('.sidebar-toggle');
            if (toggleButton) {
                toggleButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
                toggleButton.setAttribute('aria-label', '展开侧边栏');
            }
        }
    }
}); 