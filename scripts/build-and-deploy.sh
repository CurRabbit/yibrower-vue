#!/bin/bash
# Yi 浏览器构建 + 部署脚本
# 用法: bash /root/yi-vue/scripts/build-and-deploy.sh
set -e

DEPLOY_DIR="/var/www/html/yi"
SOURCE_DIR="/root/yi-vue/dist"
API_PORT=20224
API_URL="http://localhost:${API_PORT}/yi-api/images/latest"
API_CHECK_URL="http://8.136.25.169/yi-api/images/latest"
HTML_URL="http://8.136.25.169/yi/"

echo "=== Yi Build & Deploy ==="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"

# 1. 检查 build 产物
echo ""
echo "[1/6] 检查构建产物..."
if [ ! -f "${SOURCE_DIR}/index.html" ]; then
    echo "❌ 构建产物不存在，请先运行 npm run build"
    exit 1
fi
echo "✅ 构建产物就绪"

# 2. 备份
BAK_DIR="/var/www/html/yi.bak.$(date +%Y%m%d%H%M%S)"
echo ""
echo "[2/6] 备份当前部署到 ${BAK_DIR}..."
cp -r "${DEPLOY_DIR}" "${BAK_DIR}" 2>/dev/null && echo "✅ 备份完成" || echo "⚠️  备份跳过"

# 3. 同步文件
echo ""
echo "[3/6] 同步构建产物..."
rm -rf "${DEPLOY_DIR}/assets" "${DEPLOY_DIR}/_next" 2>/dev/null
cp -r "${SOURCE_DIR}/assets" "${DEPLOY_DIR}/"
cp -r "${SOURCE_DIR}/_next" "${DEPLOY_DIR}/" 2>/dev/null || true
cp -f "${SOURCE_DIR}/index.html" "${DEPLOY_DIR}/"
cp -f "${SOURCE_DIR}/favicon.svg" "${DEPLOY_DIR}/" 2>/dev/null || true
cp -f "${SOURCE_DIR}/icons.svg" "${DEPLOY_DIR}/" 2>/dev/null || true
chown -R www-data:www-data "${DEPLOY_DIR}/"
echo "✅ 文件同步完成"

# 4. API 自检
echo ""
echo "[4/6] API 自检..."
API_PID=$(ps aux | grep "[u]vicorn.*${API_PORT}" | awk '{print $2}')
if [ -n "${API_PID}" ]; then
    echo "   API 进程运行中 (PID=${API_PID})，检查健康状态..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_CHECK_URL}" 2>/dev/null || echo "000")
    if [ "${HTTP_CODE}" = "200" ]; then
        echo "   ✅ API 正常 (HTTP ${HTTP_CODE})"
    else
        echo "   ⚠️  API 返回异常 (HTTP ${HTTP_CODE})，尝试重启..."
        kill ${API_PID} 2>/dev/null
        sleep 2
    fi
fi

# 如果进程已停止或刚才被 kill，重启
API_PID=$(ps aux | grep "[u]vicorn.*${API_PORT}" | awk '{print $2}')
if [ -z "${API_PID}" ]; then
    echo "   🚀 启动 yi-images-api..."
    cd /root/yi-images-api
    nohup python3 -m uvicorn main:app --host 0.0.0.0 --port ${API_PORT} > /tmp/yi-images-api.log 2>&1 &
    sleep 4
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_CHECK_URL}" 2>/dev/null || echo "000")
    if [ "${HTTP_CODE}" = "200" ]; then
        echo "   ✅ API 重启成功 (HTTP ${HTTP_CODE})"
    else
        echo "   ❌ API 重启失败，请检查日志 /tmp/yi-images-api.log"
    fi
else
    echo "   ✅ API 进程正常"
fi

# 5. 验证部署
echo ""
echo "[5/6] 验证部署..."
HTML_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${HTML_URL}" 2>/dev/null || echo "000")
if [ "${HTML_CODE}" = "200" ]; then
    echo "✅ HTML 服务正常 (HTTP ${HTML_CODE})"
else
    echo "❌ HTML 服务异常 (HTTP ${HTML_CODE})"
fi

# 6. 清理旧备份（保留最近 5 个）
echo ""
echo "[6/6] 清理旧备份..."
BACKUP_COUNT=$(ls -d /var/www/html/yi.bak.* 2>/dev/null | wc -l)
if [ "${BACKUP_COUNT}" -gt 5 ]; then
    ls -dt /var/www/html/yi.bak.* | tail -$((BACKUP_COUNT - 5)) | xargs rm -rf 2>/dev/null
    echo "✅ 清理完成，保留最近 5 个备份"
else
    echo "   备份数量 ${BACKUP_COUNT}，无需清理"
fi

echo ""
echo "=== 部署完成 ==="
echo "访问: ${HTML_URL}"
echo "备份: ${BAK_DIR}"
