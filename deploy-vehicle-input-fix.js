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

    // Upload files
    const filesToUpload = [
      {
        local: path.join(__dirname, 'src/components/employee/ZorinWorkstationConsole.tsx'),
        remote: '/var/www/newrepo/src/components/employee/ZorinWorkstationConsole.tsx'
      },
      {
        local: path.join(__dirname, 'src/styles/zorin-workstation.css'),
        remote: '/var/www/newrepo/src/styles/zorin-workstation.css'
      }
    ];

    for (const file of filesToUpload) {
      console.log(`Загружаю ${path.basename(file.local)}...`);
      await ssh.putFile(file.local, file.remote);
      console.log(`✓ Загружен: ${path.basename(file.remote)}`);
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

    console.log('\n✅ Деплой завершен успешно!');
    console.log('\n📝 Форма ввода номера улучшена:');
    console.log('  ✓ Поле ввода полноразмерное (18px шрифт, жирный)');
    console.log('  ✓ Автоматический uppercase и отступы между буквами');
    console.log('  ✓ Красивая рамка с фокусом (синяя подсветка)');
    console.log('  ✓ Кнопка "Проверить" перенесена вниз');
    console.log('  ✓ Кнопка на всю ширину (удобно нажимать)');
    console.log('  ✓ Адаптировано под мобильные устройства');

    ssh.dispose();
  } catch (error) {
    console.error('Ошибка деплоя:', error);
    process.exit(1);
  }
}

deploy();
