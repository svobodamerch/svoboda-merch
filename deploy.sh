#!/bin/bash
# Деплой основного сайта svoboda.site
set -e

cd /var/www/svoboda-merch

echo "--- $(date '+%F %T') начало деплоя ---"

git pull origin main
npm install --production=false

# Собираем в отдельный каталог: удалять .next под работающим сервером нельзя —
# он читает чанки лениво, и сайт отдаёт 502 всю минуту сборки. Заодно уходит
# старая проблема с недописанными JSON от оборванной сборки: каталог всегда чистый.
rm -rf .next-build
NEXT_DIST_DIR=.next-build npm run build

# Схема CRM создаётся лениво, при первом обращении приложения к SQLite,
# а middleware редиректит неавторизованные запросы раньше — из-за этого
# новые таблицы и колонки не появлялись до первого входа сотрудника.
# Прогоняем миграцию явно, той же initSchema, что использует сайт.
npm run migrate

# Подмена готовой сборки — одно перемещение, сайт недоступен только
# на время перезапуска процесса, а не всей сборки
rm -rf .next-old
if [ -d .next ]; then mv .next .next-old; fi
mv .next-build .next

pm2 restart svoboda-site
rm -rf .next-old

echo "--- $(date '+%F %T') деплой завершён, коммит $(git rev-parse --short HEAD) ---"
