#!/bin/bash
# Yi Vue 构建脚本
# 流程：清理增量缓存 → 杀旧进程 → 加锁构建

# 构建前清理增量缓存（防止 build 爆盘）
rm -rf /root/.npm/_cacache/tmp/*  2>/dev/null || true
rm -rf /root/.cache/pip/*         2>/dev/null || true

# 防止并发 vite 进程堆积
pkill -f "vite build" 2>/dev/null
sleep 1

LOCK=/tmp/vite-build.lock
exec flock "$LOCK" -c "vite build"
