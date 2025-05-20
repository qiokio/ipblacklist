/**
 * 退出确认功能的JavaScript代码
 * 处理退出按钮点击、确认和取消事件
 */
document.addEventListener('DOMContentLoaded', function() {
    // 初始化函数
    function initLogout() {
        console.log('初始化退出登录功能');
        
        // 获取DOM元素
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutModal = document.getElementById('logoutConfirmModal');
        const confirmBtn = document.getElementById('confirmLogoutBtn');
        const cancelBtn = document.getElementById('cancelLogoutBtn');
        
        // 检查必要元素是否存在
        if (!logoutBtn || !logoutModal || !confirmBtn || !cancelBtn) {
            console.warn('退出功能缺少必要的DOM元素');
            return;
        }
        
        // 退出按钮点击 - 显示确认弹窗
        logoutBtn.onclick = function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log('退出按钮被点击');
            showModal();
            return false;
        };
        
        // 确认退出 - 执行退出操作
        confirmBtn.onclick = function(event) {
            event.preventDefault();
            console.log('确认退出');
            logout();
            return false;
        };
        
        // 取消退出 - 关闭弹窗
        cancelBtn.onclick = function(event) {
            event.preventDefault();
            console.log('取消退出');
            hideModal();
            return false;
        };
        
        // 点击弹窗背景关闭弹窗
        logoutModal.onclick = function(event) {
            if (event.target === logoutModal) {
                console.log('点击弹窗背景');
                hideModal();
            }
        };
        
        // 阻止弹窗内容点击事件冒泡
        const modalContent = logoutModal.querySelector('.confirm-modal-content');
        if (modalContent) {
            modalContent.onclick = function(event) {
                event.stopPropagation();
            };
        }
        
        // 显示确认弹窗
        function showModal() {
            console.log('显示确认弹窗');
            logoutModal.style.display = 'block';
            setTimeout(function() {
                logoutModal.classList.add('show');
            }, 10);
        }
        
        // 隐藏确认弹窗
        function hideModal() {
            console.log('隐藏确认弹窗');
            logoutModal.classList.remove('show');
            setTimeout(function() {
                logoutModal.style.display = 'none';
            }, 300);
        }
        
        // 执行退出登录
        function logout() {
            console.log('执行退出登录操作');
            // 清除登录信息
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            
            // 隐藏弹窗
            hideModal();
            
            // 延迟跳转到首页
            setTimeout(function() {
                window.location.href = '/';
            }, 100);
        }
    }
    
    // 执行初始化
    initLogout();
}); 