const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();

const config = {
  host: '193.227.241.63',
  port: 22,
  username: 'root',
  password: 'mRG1c6TBDIJJfSip'
};

const remoteDir = '/var/www/newrepo';

async function deploy() {
  try {
    console.log('🔌 Подключаюсь к серверу...');
    await ssh.connect(config);
    console.log('✅ Подключено!');

    // Останавливаем старые процессы
    console.log('🛑 Останавливаю старые процессы...');
    try {
      await ssh.execCommand('pm2 delete zorin-backend', { cwd: remoteDir });
      await ssh.execCommand('pm2 delete zorin-frontend', { cwd: remoteDir });
    } catch (e) {
      console.log('   (процессы не были запущены)');
    }

    // Создаём директорию если нет
    console.log('📁 Создаю директорию...');
    await ssh.execCommand(`mkdir -p ${remoteDir}`);

    // Заливаем Go backend
    console.log('📤 Загружаю Go backend...');
    await ssh.putFile(
      path.join(__dirname, 'server-linux'),
      `${remoteDir}/server-linux`
    );
    await ssh.execCommand(`chmod +x ${remoteDir}/server-linux`);

    // Заливаем данные
    console.log('📤 Загружаю папку data...');
    await ssh.putDirectory(
      path.join(__dirname, 'data'),
      `${remoteDir}/data`,
      {
        recursive: true,
        concurrency: 10,
      }
    );

    // Заливаем Next.js standalone
    console.log('📤 Загружаю Next.js frontend...');
    await ssh.putDirectory(
      path.join(__dirname, '.next/standalone'),
      `${remoteDir}/frontend`,
      {
        recursive: true,
        concurrency: 10,
      }
    );

    // Заливаем статические файлы Next.js
    console.log('📤 Загружаю статические файлы...');
    await ssh.putDirectory(
      path.join(__dirname, '.next/static'),
      `${remoteDir}/frontend/.next/static`,
      {
        recursive: true,
        concurrency: 10,
      }
    );

    await ssh.putDirectory(
      path.join(__dirname, 'public'),
      `${remoteDir}/frontend/public`,
      {
        recursive: true,
        concurrency: 10,
      }
    );

    // Создаём .env для Go backend
    console.log('⚙️  Настраиваю конфигурацию...');
    await ssh.execCommand(`cat > ${remoteDir}/.env << 'EOF'
PORT=8080
DATA_PATH=${remoteDir}/data
EOF`);

    // Запускаем Go backend через PM2
    console.log('🚀 Запускаю Go backend на порту 8080...');
    const backendResult = await ssh.execCommand(
      `pm2 start ${remoteDir}/server-linux --name zorin-backend --env PORT=8080`,
      { cwd: remoteDir }
    );
    console.log(backendResult.stdout);
    if (backendResult.stderr) console.error(backendResult.stderr);

    // Запускаем Next.js frontend через PM2
    console.log('🚀 Запускаю Next.js frontend на порту 3000...');
    const frontendResult = await ssh.execCommand(
      `pm2 start node --name zorin-frontend -- ${remoteDir}/frontend/server.js`,
      { cwd: remoteDir }
    );
    console.log(frontendResult.stdout);
    if (frontendResult.stderr) console.error(frontendResult.stderr);

    // Сохраняем PM2 конфигурацию
    console.log('💾 Сохраняю PM2 конфигурацию...');
    await ssh.execCommand('pm2 save');

    // Проверяем статус
    console.log('\n📊 Статус сервисов:');
    const statusResult = await ssh.execCommand('pm2 list');
    console.log(statusResult.stdout);

    console.log('\n✅ Деплой завершён!');
    console.log('🌐 Backend API: http://193.227.241.63:8080');
    console.log('🌐 Frontend: http://193.227.241.63:3000');
    console.log('\n⚠️  Не забудь настроить nginx для проксирования портов!');

    ssh.dispose();
  } catch (error) {
    console.error('❌ Ошибка деплоя:', error);
    ssh.dispose();
    process.exit(1);
  }
}

deploy();
