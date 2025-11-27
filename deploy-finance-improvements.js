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
    console.log('\n📊 Улучшения страницы Финансы:');
    console.log('\n  Кнопка комментария:');
    console.log('  ✓ Перенесена в футер диалога (рядом с "Закрыть")');
    console.log('  ✓ Полноразмерная кнопка, заметная');
    console.log('  ✓ Если есть комментарии - синяя с счетчиком');
    console.log('  ✓ Если нет - обычная "Добавить комментарий"');
    console.log('\n  Таблица "История моек":');
    console.log('  ✓ ТЕПЕРЬ СКРОЛЛИТСЯ по горизонтали на мобильных!');
    console.log('  ✓ Убрал ScrollArea, который блокировал');
    console.log('  ✓ Добавил min-width колонкам для читаемости');
    console.log('  ✓ Тач-скролл оптимизирован (iOS/Android)');
    console.log('  ✓ На десктопе - только вертикальный скролл');
    console.log('  ✓ На мобильных - оба направления');

    ssh.dispose();
  } catch (error) {
    console.error('Ошибка деплоя:', error);
    process.exit(1);
  }
}

deploy();
