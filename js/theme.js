// 主题切换功能
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 检查本地存储中的主题偏好
    const currentTheme = localStorage.getItem('theme');
    
    // 初始化主题
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        updateThemeIcon(true);
    } else if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        updateThemeIcon(false);
    } else {
        // 如果没有存储的偏好，则使用系统偏好
        if (prefersDarkScheme.matches) {
            document.body.classList.add('dark-theme');
            updateThemeIcon(true);
        } else {
            document.body.classList.add('light-theme');
            updateThemeIcon(false);
        }
    }
    
    // 主题切换按钮点击事件
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            // 检查当前主题
            const isDarkTheme = document.body.classList.contains('dark-theme');
            
            // 切换主题
            if (isDarkTheme) {
                document.body.classList.replace('dark-theme', 'light-theme');
                localStorage.setItem('theme', 'light');
                updateThemeIcon(false);
            } else {
                document.body.classList.replace('light-theme', 'dark-theme');
                localStorage.setItem('theme', 'dark');
                updateThemeIcon(true);
            }
            
            // 添加过渡动画类
            document.body.classList.add('theme-transition');
            setTimeout(() => {
                document.body.classList.remove('theme-transition');
            }, 1000);
        });
    }
    
    // 监听系统主题变化
    prefersDarkScheme.addEventListener('change', (e) => {
        // 只有在用户没有手动设置主题时才跟随系统
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.body.classList.replace('light-theme', 'dark-theme');
                updateThemeIcon(true);
            } else {
                document.body.classList.replace('dark-theme', 'light-theme');
                updateThemeIcon(false);
            }
        }
    });
    
    // 更新主题切换按钮图标
    function updateThemeIcon(isDark) {
        if (!themeToggle) return;
        
        const iconElement = themeToggle.querySelector('i');
        if (iconElement) {
            if (isDark) {
                iconElement.classList.replace('fa-sun', 'fa-moon');
            } else {
                iconElement.classList.replace('fa-moon', 'fa-sun');
            }
        }
    }
}); 