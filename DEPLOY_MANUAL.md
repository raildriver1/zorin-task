# Инструкция по ручному деплою на сервер

## Файлы для загрузки

Загрузите этот файл на сервер:
- `server-linux` (12 MB) - Go backend

## Подключение к серверу

```bash
ssh root@193.227.241.63
# Пароль: mRG1c6TBDIJJfSip
```

## Команды для выполнения на сервере

### 1. Остановить Docker контейнер на порту 8080
```bash
docker ps -q --filter "publish=8080" | xargs -r docker stop
```

### 2. Перейти в папку проекта
```bash
cd /var/www/newrepo
```

### 3. Загрузить server-linux через SFTP/SCP
Используйте любой SFTP клиент (FileZilla, WinSCP) или команду:
```bash
# На вашем компьютере (Windows):
# Откройте WinSCP или FileZilla и загрузите server-linux в /var/www/newrepo/
```

**Параметры подключения для SFTP клиента:**
- Host: 193.227.241.63
- Port: 22
- Username: root
- Password: mRG1c6TBDIJJfSip
- Путь на сервере: /var/www/newrepo/

### 4. Дать права на выполнение
```bash
chmod +x /var/www/newrepo/server-linux
```

### 5. Удалить все старые PM2 процессы
```bash
pm2 delete all
```

### 6. Запустить Go backend
```bash
cd /var/www/newrepo
PORT=8080 DATA_PATH=/var/www/newrepo/data pm2 start ./server-linux --name zorin-backend
```

### 7. Запустить Next.js frontend
```bash
cd /var/www/newrepo/frontend
pm2 start node --name zorin-frontend -- /var/www/newrepo/frontend/server.js
```

### 8. Сохранить PM2 конфигурацию
```bash
pm2 save
```

### 9. Проверить статус
```bash
pm2 list
pm2 logs --lines 20
```

### 10. Проверить порты
```bash
netstat -tulpn | grep -E ":(8080|3000)"
```

## Проверка работы

- Backend API: http://193.227.241.63:8080/health
- Frontend: http://193.227.241.63:3000

## Если что-то пошло не так

Посмотреть логи:
```bash
pm2 logs zorin-backend --lines 50
pm2 logs zorin-frontend --lines 50
```

Перезапустить:
```bash
pm2 restart zorin-backend
pm2 restart zorin-frontend
```

Остановить всё:
```bash
pm2 stop all
```
