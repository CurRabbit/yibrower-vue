#!/bin/bash
# Start Yi Vue dev server (HMR enabled)
# Vite serves on port 5173, nginx proxies /yi/ -> 5173

cd /root/yi-vue
npm run dev -- --port 5173
