const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

const config = {
  host: '193.227.241.63',
  port: 22,
  username: 'root',
  password: 'mRG1c6TBDIJJfSip'
};

async function checkLogs() {
  try {
    await ssh.connect(config);

    // Проверяем логи Go backend
    console.log('📋 Логи Go backend:');
    const logs = await ssh.execCommand('pm2 logs zorin-backend --lines 50 --nostream');
    console.log(logs.stdout);
    console.log(logs.stderr);

    // Проверяем какой процесс занимает порт 8080
    console.log('\n🔍 Процессы на порту 8080:');
    const netstat = await ssh.execCommand('netstat -tulpn | grep 8080');
    console.log(netstat.stdout);

    // Останавливаем старый процесс newrepo
    console.log('\n🛑 Останавливаю старый процесс newrepo...');
    await ssh.execCommand('pm2 delete newrepo');

    // Перезапускаем Go backend
    console.log('\n🚀 Перезапускаю Go backend...');
    const restart = await ssh.execCommand('cd /var/www/newrepo && pm2 restart zorin-backend || pm2 start ./server-linux --name zorin-backend');
    console.log(restart.stdout);

    // Проверяем статус
    console.log('\n📊 Итоговый статус:');
    const status = await ssh.execCommand('pm2 list');
    console.log(status.stdout);

    ssh.dispose();
  } catch (error) {
    console.error('❌ Ошибка:', error);
    ssh.dispose();
  }
}

checkLogs();
