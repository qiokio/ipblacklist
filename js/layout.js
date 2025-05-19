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
    const logoutBtn = document.getElementById('logoutBtn');
    
    // 获取认证令牌
    const token = localStorage.getItem('auth_token');
    
    if (token) {
        // 尝试获取用户信息
        fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                // 显示用户信息
                if (usernameElement) {
                    usernameElement.textContent = data.user.username;
                }
                if (userInfo) userInfo.style.display = 'flex';
                if (loginActions) loginActions.style.display = 'none';
            } else {
                // 令牌无效
                if (userInfo) userInfo.style.display = 'none';
                if (loginActions) loginActions.style.display = 'flex';
            }
        })
        .catch(error => {
            console.error('验证失败:', error);
            if (userInfo) userInfo.style.display = 'none';
            if (loginActions) loginActions.style.display = 'flex';
        });
    } else {
        // 未登录
        if (userInfo) userInfo.style.display = 'none';
        if (loginActions) loginActions.style.display = 'flex';
    }
    
    // 退出登录事件
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            if (userInfo) userInfo.style.display = 'none';
            if (loginActions) loginActions.style.display = 'flex';
        });
    }
    
    // 添加侧边栏收起按钮
    function addSidebarToggle() {
        if (!sidebar) return;
        
        const toggleButton = document.createElement('button');
        toggleButton.className = 'sidebar-toggle';
        toggleButton.setAttribute('aria-label', '收起侧边栏');
        toggleButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        
        toggleButton.addEventListener('click', () => {
            toggleSidebar();
        });
        
        sidebar.appendChild(toggleButton);
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