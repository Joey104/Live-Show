#!/bin/bash
# 下载 AdminLTE 及相关依赖到本地

set -e

cd "$(dirname "$0")/assets"

echo "📥 正在下载 AdminLTE 3 及相关依赖..."

# AdminLTE CSS
echo "⬇️  AdminLTE CSS..."
curl -sL "https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css" -o css/adminlte.min.css

# AdminLTE JS
echo "⬇️  AdminLTE JS..."
curl -sL "https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/js/adminlte.min.js" -o js/adminlte.min.js

# Bootstrap CSS
echo "⬇️  Bootstrap CSS..."
curl -sL "https://cdn.jsdelivr.net/npm/bootstrap@4.6.1/dist/css/bootstrap.min.css" -o css/bootstrap.min.css

# Bootstrap JS
echo "⬇️  Bootstrap JS..."
curl -sL "https://cdn.jsdelivr.net/npm/bootstrap@4.6.1/dist/js/bootstrap.bundle.min.js" -o js/bootstrap.bundle.min.js

# jQuery
echo "⬇️  jQuery..."
curl -sL "https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js" -o js/jquery.min.js

# FontAwesome CSS
echo "⬇️  FontAwesome..."
curl -sL "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/css/all.min.css" -o css/fontawesome.min.css

# FontAwesome Webfonts
mkdir -p webfonts
cd webfonts
echo "⬇️  FontAwesome Webfonts..."
curl -sL "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/webfonts/fa-solid-900.woff2" -o fa-solid-900.woff2
curl -sL "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/webfonts/fa-regular-400.woff2" -o fa-regular-400.woff2
curl -sL "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/webfonts/fa-brands-400.woff2" -o fa-brands-400.woff2

cd ..

echo ""
echo "✅ 所有资源下载完成！"
echo ""
ls -la css/
ls -la js/
