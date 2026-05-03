#!/bin/bash
# Build Vue app and deploy to ~/web/yi/
# Used for production deployment

set -e
cd /root/yi-vue

echo "==> Building..."
npm run build

echo "==> Deploying to ~/web/yi/"
cp -r dist/* /root/web/yi/

echo "==> Done. http://8.136.25.169/yi/"
