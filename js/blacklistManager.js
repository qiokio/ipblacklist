import { addToBlacklist, removeFromBlacklist, getBlacklist, checkKVConnection } from './ipBlacklist.js';

class BlacklistManager {
    constructor() {
        this.init();
    }

    async init() {
        console.log('初始化黑名单管理器');
        // 加载KV初始化脚本
        await this.loadKVInitScript();
        await this.checkConnection();
        this.bindEvents();
        await this.refreshBlacklist();
    }

    async loadKVInitScript() {
        return new Promise((resolve) => {
            // 设置超时计时器，如果5秒内脚本未加载完成，则继续执行
            const timeout = setTimeout(() => {
                console.warn('KV初始化脚本加载超时，尝试加载备用脚本');
                this.loadFallbackScript().then(resolve);
            }, 5000);

            // 使用fetch加载KV初始化脚本，而不是使用script标签
            console.log('使用fetch加载KV初始化脚本');
            
            const baseUrl = window.location.origin;
            fetch(`${baseUrl}/functions/api/init-kv.js`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API请求失败: ${response.status}`);
                    }
                    return response.text();
                })
                .then(scriptText => {
                    // 使用Function构造函数执行返回的脚本
                    const scriptFunction = new Function(scriptText);
                    scriptFunction();
                    console.log('KV初始化脚本加载完成（通过Functions API）');
                    clearTimeout(timeout);
                    resolve();
                })
                .catch(error => {
                    console.error('通过Functions API加载KV初始化脚本失败，尝试加载备用脚本', error);
                    clearTimeout(timeout);
                    this.loadFallbackScript().then(resolve);
                });
        });
    }

    async loadFallbackScript() {
        return new Promise((resolve) => {
            console.log('加载备用KV初始化脚本');
            const script = document.createElement('script');
            script.src = `${window.location.origin}/init-kv.js`;
            
            script.onload = () => {
                console.log('备用KV初始化脚本加载完成');
                resolve();
            };
            
            script.onerror = () => {
                console.error('备用KV初始化脚本也加载失败，尝试使用静态API路径');
                
                // 设置一个默认的KV状态
                window.ENV = window.ENV || {};
                window.ENV.KV_STATUS = {
                    connected: false,
                    message: "无法连接KV存储，系统将无法正常使用"
                };
                
                resolve();
            };
            
            document.head.appendChild(script);
        });
    }

    async checkConnection() {
        const status = await checkKVConnection();
        const statusElement = document.getElementById('kvStatus');
        if (statusElement) {
            if (status.connected) {
                statusElement.textContent = `KV状态: ${status.message}`;
                statusElement.className = 'status-ok';
            } else {
                statusElement.innerHTML = `<strong>KV连接错误:</strong> ${status.message}<br>
                <span style="font-size: 0.9em; margin-top: 5px; display: block;">
                    请确保在Cloudflare Pages中正确配置了"IP_BLACKLIST"的KV命名空间绑定。
                </span>`;
                statusElement.className = 'status-error';
            }
        }
    }

    bindEvents() {
        const addButton = document.getElementById('addIpBtn');
        const ipInput = document.getElementById('ipInput');
        
        console.log('绑定事件', { addButton, ipInput });
        
        // 添加IP按钮事件
        if (addButton) {
            addButton.addEventListener('click', () => {
                console.log('点击添加按钮');
                this.handleAddIP();
            });
        } else {
            console.error('未找到添加按钮元素');
        }
        
        // 添加回车键支持
        if (ipInput) {
            ipInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('按下回车键');
                    this.handleAddIP();
                }
            });
        }
        
        // 移除IP按钮事件（使用事件委托）
        const table = document.getElementById('blacklistTable');
        if (table) {
            table.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-ip-btn')) {
                    const ip = e.target.dataset.ip;
                    this.handleRemoveIP(ip);
                }
            });
        } else {
            console.error('未找到黑名单表格元素');
        }
    }

    async handleAddIP() {
        const ipInput = document.getElementById('ipInput');
        if (!ipInput) {
            console.error('未找到IP输入框');
            return;
        }

        const ip = ipInput.value.trim();
        console.log('处理添加IP:', ip);
        
        if (!this.validateIP(ip)) {
            alert('请输入有效的IP地址');
            return;
        }

        // 检查认证状态
        const token = localStorage.getItem('auth_token');
        if (!token) {
            alert('您需要登录才能添加IP到黑名单');
            window.location.href = '/login.html';
            return;
        }

        try {
            console.log('发送添加IP请求:', {
                url: '/functions/api/blacklist/add',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: { ip }
            });

            const response = await fetch('/functions/api/blacklist/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ip })
            });

            console.log('收到响应:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            // 检查响应状态
            if (!response.ok) {
                if (response.status === 401) {
                    alert('您的登录已过期，请重新登录');
                    window.location.href = '/login.html';
                    return;
                }

                // 尝试读取错误信息
                let errorMessage = '添加IP失败';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    console.error('解析错误响应失败:', e);
                    errorMessage = `添加IP失败 (${response.status} ${response.statusText})`;
                }
                throw new Error(errorMessage);
            }

            // 尝试解析响应数据
            let data;
            try {
                const text = await response.text();
                console.log('响应内容:', text);
                data = JSON.parse(text);
            } catch (e) {
                console.error('解析响应数据失败:', e);
                throw new Error('服务器返回的数据格式无效');
            }

            if (data.success) {
                ipInput.value = '';
                await this.refreshBlacklist();
                alert('IP已添加到黑名单');
            } else {
                throw new Error(data.message || '添加IP失败');
            }
        } catch (error) {
            console.error('添加IP时出错:', error);
            alert(error.message || '添加IP时发生错误，请查看控制台');
        }
    }

    async handleRemoveIP(ip) {
        if (!confirm(`确定要从黑名单中移除 ${ip} 吗？`)) {
            return;
        }

        try {
            const success = await removeFromBlacklist(ip);
            if (success) {
                await this.refreshBlacklist();
                alert('IP已从黑名单中移除');
            } else {
                alert('移除IP失败，请重试');
            }
        } catch (error) {
            console.error('移除IP时出错:', error);
            alert('移除IP时发生错误，请查看控制台');
        }
    }

    async refreshBlacklist() {
        try {
            const blacklist = await getBlacklist();
            const tableBody = document.getElementById('blacklistTableBody');
            
            if (!tableBody) {
                console.error('未找到表格主体元素');
                return;
            }

            if (blacklist.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="2" style="text-align: center;">黑名单为空</td></tr>';
                return;
            }

            // 判断是否为移动设备
            const isMobile = window.innerWidth <= 768;
            
            tableBody.innerHTML = blacklist.map(ip => {
                if (isMobile) {
                    // 移动端包含数据标题属性
                    return `
                        <tr>
                            <td data-title="IP地址">${ip}</td>
                            <td data-title="操作">
                                <button class="remove-ip-btn" data-ip="${ip}">移除</button>
                            </td>
                        </tr>
                    `;
                } else {
                    // 桌面端不需要数据标题
                    return `
                        <tr>
                            <td>${ip}</td>
                            <td>
                                <button class="remove-ip-btn" data-ip="${ip}">移除</button>
                            </td>
                        </tr>
                    `;
                }
            }).join('');
        } catch (error) {
            console.error('刷新黑名单时出错:', error);
            alert('刷新黑名单时发生错误，请查看控制台');
        }
    }

    validateIP(ip) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        
        if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
            return false;
        }

        // 验证IPv4每个数字是否在0-255范围内
        if (ipv4Regex.test(ip)) {
            const parts = ip.split('.');
            return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
        }

        return true;
    }
}

// 初始化黑名单管理器
document.addEventListener('DOMContentLoaded', () => {
    new BlacklistManager();
}); 