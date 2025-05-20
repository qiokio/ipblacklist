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
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault(); // 阻止默认行为
            console.log('退出按钮被点击');
            logoutModal.style.display = 'block';
            
            // 使用setTimeout确保DOM更新后再添加show类，触发CSS过渡效果
            setTimeout(() => {
                logoutModal.classList.add('show');
            }, 10);
        });
    }
    
    // 确认退出按钮点击事件 - 执行退出操作
    if(confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', function() {
            // 清除登录信息
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            
            // 关闭弹窗
            closeModal();
            
            // 重定向到首页
            window.location.href = '/';
        });
    }
    
    // 取消退出按钮点击事件 - 关闭弹窗
    if(cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', function() {
            closeModal();
        });
    }
    
    // 点击弹窗背景关闭弹窗
    if(logoutModal) {
        logoutModal.addEventListener('click', function(e) {
            if(e.target === logoutModal) {
                closeModal();
            }
        });
    }
    
    // 关闭弹窗的统一函数
    function closeModal() {
        logoutModal.classList.remove('show');
        // 等待过渡效果完成后隐藏弹窗
        setTimeout(() => {
            logoutModal.style.display = 'none';
        }, 300);
    }
}); 