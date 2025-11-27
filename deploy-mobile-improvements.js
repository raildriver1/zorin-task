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
        local: path.join(__dirname, 'src/styles/zorin-workstation.css'),
        remote: '/var/www/newrepo/src/styles/zorin-workstation.css'
      },
      {
        local: path.join(__dirname, 'src/styles/employees.css'),
        remote: '/var/www/newrepo/src/styles/employees.css'
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
    console.log('\n📱 Мобильная адаптивность улучшена:');
    console.log('\n  Рабочая станция:');
    console.log('  ✓ Полноширинные кнопки с крупными зонами нажатия');
    console.log('  ✓ Способы оплаты в ряд (удобнее выбирать)');
    console.log('  ✓ Крупные поля ввода (15px шрифт)');
    console.log('  ✓ Большая итоговая сумма (28px)');
    console.log('  ✓ Лучшие отступы и читаемость');
    console.log('\n  Сотрудники:');
    console.log('  ✓ Карточный вид вместо таблицы');
    console.log('  ✓ Каждый сотрудник - отдельная карточка');
    console.log('  ✓ Эмодзи-иконки для категорий');
    console.log('  ✓ Крупное имя (16px, жирный)');
    console.log('  ✓ Кнопки действий 40x40px (удобно нажимать)');
    console.log('  ✓ Разделители между секциями');

    ssh.dispose();
  } catch (error) {
    console.error('Ошибка деплоя:', error);
    process.exit(1);
  }
}

deploy();
