/**
 * 调试脚本 - 用于诊断退出按钮问题
 */

// 在页面加载完成后执行
window.addEventListener('load', function() {
    console.log('--------- 退出按钮调试信息 ---------');
    
    // 检查是否有退出按钮
    const logoutBtn = document.getElementById('logoutBtn');
    console.log('退出按钮存在:', !!logoutBtn);
    
    if (logoutBtn) {
        console.log('退出按钮类型:', logoutBtn.tagName);
        console.log('退出按钮HTML:', logoutBtn.outerHTML);
        
        // 查看按钮的所有事件监听器
        const eventListeners = getEventListeners(logoutBtn);
        console.log('按钮事件监听器:', eventListeners);
        
        // 覆盖原有的点击事件
        logoutBtn.addEventListener('click', function(e) {
            console.log('DEBUG: 退出按钮被点击 (调试处理器)');
            console.log('事件对象:', e);
            console.log('阻止默认行为和事件传播');
            
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // 显示确认弹窗
            const logoutModal = document.getElementById('logoutConfirmModal');
            if (logoutModal) {
                console.log('显示确认弹窗');
                logoutModal.style.display = 'block';
                
                setTimeout(() => {
                    logoutModal.classList.add('show');
                }, 10);
            } else {
                console.error('找不到确认弹窗元素');
            }
            
            return false;
        }, true);  // 使用捕获阶段确保这个处理器先执行
    }
    
    // 检查确认弹窗
    const logoutModal = document.getElementById('logoutConfirmModal');
    console.log('确认弹窗存在:', !!logoutModal);
    
    if (logoutModal) {
        console.log('确认弹窗HTML:', logoutModal.outerHTML);
        console.log('确认弹窗当前显示状态:', logoutModal.style.display);
        console.log('确认弹窗CSS类:', logoutModal.className);
    }
    
    // 临时工具函数，检查元素的事件侦听器(只能在Chrome开发者工具中使用)
    function getEventListeners(element) {
        try {
            return '请在浏览器控制台查看元素的事件侦听器';
        } catch (e) {
            return '无法查看事件侦听器：' + e.message;
        }
    }
}); 