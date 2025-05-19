// Cloudflare Pages 额外配置

// 直接使用当前目录作为输出
export const config = {
  outputDirectory: ".",
  buildCommand: null,  // 无需构建命令
  routes: [
    // 处理静态文件
    { pattern: "**/*.{js,html,css,png,jpg,gif,svg,woff,woff2,ttf,eot}", path: ":asset" },
    
    // 处理Functions
    { pattern: "/functions/*", path: "/functions/:splat*" },
    
    // 回退到index.html
    { pattern: "**/*", path: "/index.html" }
  ]
}; 