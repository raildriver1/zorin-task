const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function checkServer() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Проверяю файл на сервере...\n');

    // Read the file and check for our changes
    const result = await ssh.execCommand('grep -A 10 "Restore selectedEmployees from sessionStorage" /var/www/newrepo/src/components/employee/ZorinWorkstationConsole.tsx');

    console.log('Результат поиска наших изменений:');
    console.log(result.stdout);

    if (result.stdout.includes('sessionStorage.getItem')) {
      console.log('\n✓ Изменения найдены в файле на сервере');
    } else {
      console.log('\n✗ Изменения НЕ найдены в файле на сервере');
    }

    // Check PM2 status
    console.log('\n\nПроверяю статус PM2:');
    const pm2Result = await ssh.execCommand('pm2 list');
    console.log(pm2Result.stdout);

    // Check when the file was last modified
    console.log('\n\nВремя последнего изменения файла:');
    const modResult = await ssh.execCommand('ls -l /var/www/newrepo/src/components/employee/ZorinWorkstationConsole.tsx');
    console.log(modResult.stdout);

    ssh.dispose();
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

checkServer();
