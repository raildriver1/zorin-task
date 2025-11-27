const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();

const config = {
  host: '193.227.241.63',
  port: 22,
  username: 'root',
  password: 'mRG1c6TBDIJJfSip'
};

const remoteDir = '/var/www/newrepo';

async function fixDeploy() {
  try {
    console.log('🔌 Подключаюсь...');
    await ssh.connect(config);

    // Останавливаем Docker контейнер который занимает порт 8080
    console.log('🐳 Останавливаю Docker контейнеры на порту 8080...');
    const dockerStop = await ssh.execCommand('docker ps -q --filter "publish=8080" | xargs -r docker stop');
    console.log(dockerStop.stdout || 'Нет контейнеров');

    // Загружаем новый правильный Linux бинарник
    console.log('📤 Загружаю исправленный Go backend...');
    await ssh.putFile(
      path.join(__dirname, 'server-linux'),
      `${remoteDir}/server-linux`
    );
    await ssh.execCommand(`chmod +x ${remoteDir}/server-linux`);

    // Удаляем старые PM2 процессы
    console.log('🗑️  Удаляю старые процессы...');
    await ssh.execCommand('pm2 delete all');

    // Запускаем Go backend
    console.log('🚀 Запускаю Go backend...');
    const backend = await ssh.execCommand(
      `cd ${remoteDir} && PORT=8080 DATA_PATH=${remoteDir}/data pm2 start ./server-linux --name zorin-backend`
    );
    console.log(backend.stdout);

    // Ждём 2 секунды
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Запускаем Next.js frontend
    console.log('🚀 Запускаю Next.js frontend...');
    const frontend = await ssh.execCommand(
      `cd ${remoteDir}/frontend && pm2 start node --name zorin-frontend -- ${remoteDir}/frontend/server.js`
    );
    console.log(frontend.stdout);

    // Сохраняем конфиг
    await ssh.execCommand('pm2 save');

    // Проверяем статус
    console.log('\n📊 Финальный статус:');
    const status = await ssh.execCommand('pm2 list');
    console.log(status.stdout);

    // Проверяем порты
    console.log('\n🔍 Проверка портов:');
    const ports = await ssh.execCommand('netstat -tulpn | grep -E ":(8080|3000)"');
    console.log(ports.stdout);

    console.log('\n✅ Готово!');
    console.log('🌐 Backend: http://193.227.241.63:8080');
    console.log('🌐 Frontend: http://193.227.241.63:3000');

    ssh.dispose();
  } catch (error) {
    console.error('❌ Ошибка:', error);
    ssh.dispose();
    process.exit(1);
  }
}

fixDeploy();
