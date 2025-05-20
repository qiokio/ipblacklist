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
    
    // 确保页面上有这些元素才继续执行
    if (!logoutBtn || !logoutModal || !confirmLogoutBtn || !cancelLogoutBtn) {
        console.log('退出功能所需元素不存在，退出JS初始化');
        return;
    }
    
    console.log('找到退出按钮，初始化退出功能');
    
    // 退出按钮点击事件 - 显示确认弹窗
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault(); // 阻止默认行为
        e.stopPropagation(); // 阻止事件冒泡
        
        console.log('退出按钮被点击');
        
        // 显示弹窗
        logoutModal.style.display = 'block';
        
        // 使用setTimeout确保DOM更新后再添加show类，触发CSS过渡效果
        setTimeout(() => {
            logoutModal.classList.add('show');
        }, 10);
        
        // 阻止退出操作继续
        return false;
    });
    
    // 确认退出按钮点击事件 - 执行退出操作
    confirmLogoutBtn.addEventListener('click', function(e) {
        e.preventDefault(); // 阻止默认行为
        e.stopPropagation(); // 阻止事件冒泡
        
        console.log('确认退出按钮被点击');
        
        // 清除登录信息
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        
        // 关闭弹窗
        closeModal();
        
        // 跳转到首页
        console.log('正在跳转到首页...');
        window.location.href = '/';
        
        return false;
    });
    
    // 取消退出按钮点击事件 - 关闭弹窗
    cancelLogoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('取消退出按钮被点击');
        closeModal();
        return false;
    });
    
    // 点击弹窗背景关闭弹窗
    logoutModal.addEventListener('click', function(e) {
        if(e.target === logoutModal) {
            console.log('点击了弹窗背景');
            closeModal();
        }
    });
    
    // 阻止弹窗内容点击事件冒泡
    document.querySelector('.confirm-modal-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // 关闭弹窗的统一函数
    function closeModal() {
        console.log('关闭弹窗');
        logoutModal.classList.remove('show');
        // 等待过渡效果完成后隐藏弹窗
        setTimeout(() => {
            logoutModal.style.display = 'none';
        }, 300);
    }
    
    // 禁用表单默认提交行为
    const form = logoutBtn.closest('form');
    if (form) {
        console.log('找到包含退出按钮的表单，禁用默认提交');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
    }
}); 