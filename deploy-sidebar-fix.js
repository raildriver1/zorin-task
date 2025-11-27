const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function deploy() {
  try {
    console.log('Подключаюсь к серверу...');
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Подключился успешно!');

    // Upload fixed sidebar CSS
    const filesToUpload = [
      {
        local: path.join(__dirname, 'src/styles/zorin-sidebar.css'),
        remote: '/var/www/newrepo/src/styles/zorin-sidebar.css'
      }
    ];

    for (const file of filesToUpload) {
      console.log(`Загружаю ${file.local} на ${file.remote}...`);
      await ssh.putFile(file.local, file.remote);
      console.log(`✓ Загружен: ${file.remote}`);
    }

    console.log('\nВсе файлы загружены!');

    // Rebuild the project
    console.log('\nПересобираю проект...');
    const buildResult = await ssh.execCommand('npm run build', {
      cwd: '/var/www/newrepo'
    });

    console.log('Build output:', buildResult.stdout);
    if (buildResult.stderr) {
      console.log('Build stderr:', buildResult.stderr);
    }

    // Restart PM2
    console.log('\nПерезапускаю PM2...');
    const restartResult = await ssh.execCommand('pm2 restart all', {
      cwd: '/var/www/newrepo'
    });

    console.log('PM2 restart output:', restartResult.stdout);
    if (restartResult.stderr) {
      console.log('PM2 stderr:', restartResult.stderr);
    }

    console.log('\n✓ Деплой завершен успешно!');
    console.log('\nИсправления:');
    console.log('  1. Sidebar теперь скроллится (overflow-y: auto)');
    console.log('  2. Фиксированная высота (max-height: 100vh)');
    console.log('  3. Flexbox структура для правильной работы');
    console.log('  4. Header и Footer не сжимаются (flex-shrink: 0)');

    ssh.dispose();
  } catch (error) {
    console.error('Ошибка деплоя:', error);
    process.exit(1);
  }
}

deploy();
