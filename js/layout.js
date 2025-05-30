// 布局交互功能
document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const gridContainer = document.querySelector('.grid-container');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const mainContent = document.querySelector('.main-content');
    
    // 定义菜单项
    const menuItems = [
        { icon: 'fas fa-home', text: '首页', href: 'index.html' },
        { icon: 'fas fa-tachometer-alt', text: '控制台', href: 'dashboard.html' },
        { icon: 'fas fa-key', text: 'API密钥', href: 'apikeys.html' },
        { icon: 'fas fa-vial', text: 'API测试', href: 'key-test.html' },
        { icon: 'fas fa-book', text: 'API文档', href: 'api-docs.html' },
        { icon: 'fas fa-history', text: '操作日志', href: 'logs.html' }
    ];

    // 生成侧边栏菜单
    const sidebarMenu = document.querySelector('.sidebar-menu');
    if (sidebarMenu) {
        sidebarMenu.innerHTML = menuItems.map(item => `
            <li class="sidebar-menu-item">
                <a href="${item.href}" class="sidebar-menu-link">
                    <span class="sidebar-menu-icon"><i class="${item.icon}"></i></span>
                    <span class="sidebar-menu-text">${item.text}</span>
                </a>
            </li>
        `).join('');
    }
    
    // 处理移动端菜单切换
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            
            // 添加遮罩层
            if (sidebar.classList.contains('active')) {
                const overlay = document.createElement('div');
                overlay.classList.add('sidebar-overlay');
                document.body.appendChild(overlay);
                
                overlay.addEventListener('click', () => {
                    sidebar.classList.remove('active');
                    document.body.removeChild(overlay);
                });
            } else {
                const overlay = document.querySelector('.sidebar-overlay');
                if (overlay) {
                    document.body.removeChild(overlay);
                }
            }
        });
    }
    
    // 处理侧边栏收起按钮点击
    if (sidebarToggle && gridContainer) {
        sidebarToggle.addEventListener('click', () => {
            toggleSidebar();
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
            link.parentElement.classList.add('active-item');
        }
    });
    
    // 为菜单项添加波纹效果
    document.querySelectorAll('.sidebar-menu-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const rect = link.getBoundingClientRect();
            const ripple = document.createElement('span');
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.className = 'ripple';
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            link.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // 初始化侧边栏状态
    initSidebarState();
    
    // 登录状态管理
    const userInfo = document.getElementById('userInfo');
    const loginActions = document.getElementById('loginActions');
    const usernameElement = document.getElementById('username');
    
    // 获取认证令牌
    const token = localStorage.getItem('auth_token');
    
    if (token) {
        // 尝试获取用户信息
        fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            return response.json();
        })
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
        if (userInfo) userInfo.style.display = 'none';
        if (loginActions) loginActions.style.display = 'flex';
    }
    
    // 切换侧边栏状态
    function toggleSidebar() {
        if (!gridContainer) return;
        
        const isCollapsed = gridContainer.classList.toggle('sidebar-collapsed');
        const toggleButton = document.querySelector('.sidebar-toggle');
        
        if (toggleButton) {
            toggleButton.setAttribute('aria-label', 
                isCollapsed ? '展开侧边栏' : '收起侧边栏');
        }
        
        // 添加过渡动画
        if (mainContent) {
            mainContent.style.transition = 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
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
                toggleButton.setAttribute('aria-label', '展开侧边栏');
            }
        }
    }
    
    // 添加窗口大小变化监听，在移动设备上自动收起侧边栏
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            if (sidebar && sidebar.classList.contains('active')) {
                const overlay = document.querySelector('.sidebar-overlay');
                if (overlay) {
                    document.body.removeChild(overlay);
                }
                sidebar.classList.remove('active');
            }
        }
    });
}); 