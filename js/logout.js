/**
 * 退出确认功能的JavaScript代码
 * 处理退出按钮点击、确认和取消事件
 */
document.addEventListener('DOMContentLoaded', function() {
    // 获取元素引用
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutConfirmModal');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    
    // 退出按钮点击事件 - 显示确认弹窗
    if(logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logoutModal.style.display = 'block';
            logoutModal.classList.add('show');
        });
    }
    
    // 确认退出按钮点击事件 - 执行退出操作
    if(confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', function() {
            // 清除登录信息
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            
            // 关闭弹窗
            logoutModal.style.display = 'none';
            logoutModal.classList.remove('show');
            
            // 重定向到首页
            window.location.href = '/';
        });
    }
    
    // 取消退出按钮点击事件 - 关闭弹窗
    if(cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', function() {
            logoutModal.style.display = 'none';
            logoutModal.classList.remove('show');
        });
    }
}); 