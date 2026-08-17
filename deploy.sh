#!/bin/bash
# Деплой основного сайта svoboda.site
set -e

cd /var/www/svoboda-merch

echo "--- $(date '+%F %T') начало деплоя ---"

git pull origin main
npm install --production=false

# Кеш .next чистим перед каждой сборкой: при обрыве предыдущей сборки
# в нём остаются недописанные JSON-файлы, и следующая падает с
# «Unexpected end of JSON input». Пересборка с нуля надёжнее экономии минуты.
rm -rf .next

npm run build

# Схема CRM создаётся лениво, при первом обращении приложения к SQLite,
# а middleware редиректит неавторизованные запросы раньше — из-за этого
# новые таблицы и колонки не появлялись до первого входа сотрудника.
# Прогоняем миграцию явно, той же initSchema, что использует сайт.
npm run migrate

pm2 restart svoboda-site

echo "--- $(date '+%F %T') деплой завершён, коммит $(git rev-parse --short HEAD) ---"
