const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function deploy() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Загружаю исправление...');
    await ssh.putFile(
      path.join(__dirname, 'src/styles/wash-log.css'),
      '/var/www/newrepo/src/styles/wash-log.css'
    );
    console.log('✓ Файл загружен');

    console.log('Пересобираю...');
    await ssh.execCommand('npm run build', { cwd: '/var/www/newrepo' });

    console.log('Перезапускаю PM2...');
    await ssh.execCommand('pm2 restart all', { cwd: '/var/www/newrepo' });

    console.log('\n✅ Исправлено! Таблица теперь видна на мобильных');
    ssh.dispose();
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

deploy();
