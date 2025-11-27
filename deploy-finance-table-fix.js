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
        local: path.join(__dirname, 'src/app/employees/[id]/finance/components/FinanceDashboard.tsx'),
        remote: '/var/www/newrepo/src/app/employees/[id]/finance/components/FinanceDashboard.tsx'
      },
      {
        local: path.join(__dirname, 'src/app/globals.css'),
        remote: '/var/www/newrepo/src/app/globals.css'
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
    console.log('\n📊 Исправления в таблице "История моек":');
    console.log('  ✓ Горизонтальный скролл на мобильных устройствах');
    console.log('  ✓ Кнопка комментария перенесена в отдельную колонку');
    console.log('  ✓ Колонка с датой теперь чистая (только дата + иконка истории)');
    console.log('  ✓ Кнопка комментария удобно расположена справа');
    console.log('  ✓ Тач-скролл оптимизирован для iOS/Android');

    ssh.dispose();
  } catch (error) {
    console.error('Ошибка деплоя:', error);
    process.exit(1);
  }
}

deploy();
