#!/bin/bash
# Build Vue app and deploy to /var/www/html/yi/
# nginx runs as www-data, so /var/www/html/yi/ is the correct target

set -e
cd /root/yi-vue

echo "==> Building..."
npm run build

echo "==> Deploying to /var/www/html/yi/"
sudo rm -rf /var/www/html/yi/assets
sudo cp -r dist/* /var/www/html/yi/

echo "==> Done. http://8.136.25.169/yi/"
