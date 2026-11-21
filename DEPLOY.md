# Деплой unitymini.app (VPS + Nginx + systemd)

Параметры:
- Домен: `unitymini.app` (и `www.unitymini.app`)
- Сервер: `89.126.192.32` (Ubuntu 26.04, root)
- Веб-сервер: Nginx (reverse proxy → `127.0.0.1:3000`)
- Приложение: Next.js (`npm run build` + `npm start`)
- Процесс: systemd
- HTTPS: Let’s Encrypt (certbot)
- Обновление кода: `git pull`

## 0. DNS (сделать заранее/сейчас)
В панели DNS домена `unitymini.app` создать записи:
- `A`  `@`   → `89.126.192.32`
- `A`  `www` → `89.126.192.32` (если нужен `www`)

Проверка распространения: `ping unitymini.app` должен показывать `89.126.192.32`.

## 1. Подготовка кода (на вашем ПК, `E:\camp-race`)
На сервере планируется `git pull`, поэтому проект должен быть в удалённом git-репозитории.
Если remote ещё не настроен:
```bash
git remote add origin <URL_ВАШЕГО_РЕПОЗИТОРИЯ>
git push -u origin master
```
(Создайте приватный репозиторий на GitHub/GitLab и используйте его URL.)

Локально перед выкладкой полезно убедиться: `npm run build`.

## 2. Базовая настройка сервера (SSH: root@89.126.192.32)
```bash
ssh root@89.126.192.32

apt update
apt install -y nginx git curl ca-certificates
```

### Node.js (нужен 20+ для Next.js 16)
Проверьте: `node -v` и `npm -v`.
Если Node нет или версия старая, установите LTS (пример Node.js 22):
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v
npm -v
```
> При необходимости можно использовать `setup_20.x`.

## 3. Загрузка приложения на сервер
```bash
mkdir -p /var/www
cd /var/www
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> camp-race
cd /var/www/camp-race
```
Если репозиторий уже клонирован — используйте `git pull` (см. раздел обновления).

## 4. Сборка и первый запуск
```bash
cd /var/www/camp-race
npm ci
npm run build
```
Быстрая проверка (временно): `PORT=3000 npm start` → сайт должен открыться на `http://89.126.192.32:3000` (если порт открыт). Остановите `Ctrl+C`.

## 5. Секреты админки (только на сервере!)
Пароль админки **не хранится в коде и не попадает в GitHub**. Он читается из переменных окружения.
Создайте файл с правами только для root:
```bash
umask 077
cat >/etc/camp-race.env <<'EOF'
ADMIN_PASSWORD=ваш_надёжный_пароль
AUTH_SECRET=случайная_строка_64_символа
EOF
chmod 600 /etc/camp-race.env
```
Пример генерации `AUTH_SECRET`: `openssl rand -hex 32`.
После изменения пароля перезапустите сервис: `systemctl restart camp-race`.

## 6. systemd-сервис
В репозитории есть готовый unit: `deploy/camp-race.service` (подключает `/etc/camp-race.env`).
```bash
cp /var/www/camp-race/deploy/camp-race.service /etc/systemd/system/camp-race.service
# при необходимости отредактируйте ExecStart (путь к npm: `which npm`)
systemctl daemon-reload
systemctl enable --now camp-race
systemctl status camp-race --no-pager
journalctl -u camp-race -f
```
Приложение будет слушать `127.0.0.1:3000`.

## 7. Nginx (reverse proxy)
Готовый конфиг: `deploy/nginx-unitymini.app.conf`.
```bash
cp /var/www/camp-race/deploy/nginx-unitymini.app.conf /etc/nginx/sites-available/unitymini.app
ln -s /etc/nginx/sites-available/unitymini.app /etc/nginx/sites-enabled/unitymini.app
# опционально удалить дефолтный сайт, если мешает:
# rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```
После этого `http://unitymini.app` должен проксироваться на приложение (когда DNS указывает на сервер).

## 8. HTTPS (Let’s Encrypt)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d unitymini.app -d www.unitymini.app
```
Certbot автоматически настроит SSL в Nginx и редирект на HTTPS. Проверка автообновления: `certbot renew --dry-run`.

## 9. Обновление приложения
```bash
cd /var/www/camp-race
git pull
npm ci
npm run build
systemctl restart camp-race
systemctl status camp-race --no-pager
```

## Примечания
- В проекте включены `cacheComponents`/partial prefetching — production-запуск через `next start` (Node-сервер) обязателен.
- Состояние гонки хранится на сервере в JSON-файле (по умолчанию `data/camp-race-state.json` в рабочей директории приложения). Путь можно переопределить переменной `DATA_FILE` в `/etc/camp-race.env`. Каталог `data/` добавлен в `.gitignore`, поэтому `git pull` его не затирает.
- Публичный API `/api/state` отдаёт данные без персональных записей; полное состояние доступно только авторизованному админу.
- Доступ к `/camp2026/admin` проверяется на сервере: пароль и секрет берутся из `/etc/camp-race.env`, в браузер попадает только httpOnly-cookie. Если `AUTH_SECRET` не задан — вход в админку невозможен (это защита от работы без секретов).
- Если `ExecStart=/usr/bin/npm` не подходит, замените на фактический путь из `which npm`.
- Рекомендуется позже создать отдельного пользователя для сервиса и ограничить права вместо запуска от root.
