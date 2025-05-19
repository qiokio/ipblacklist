#!/bin/bash
# 简单的构建脚本，复制所有文件到输出目录
echo "正在处理静态文件..."
mkdir -p public
cp -r index.html js functions init-kv.js public/
echo "构建完成！" 