// 备用KV初始化脚本
// 当Cloudflare Pages Functions不可用时使用

// 暴露KV环境变量给前端代码
window.ENV = window.ENV || {};
window.ENV.KV_STATUS = {
    connected: false,
    message: "未能连接到KV服务，使用的是备用脚本"
};
console.log("使用备用KV初始化脚本");

// 设置标志
window.KV_API_READY = true; 