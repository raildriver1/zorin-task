const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function clearBalance() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Обнуляю баланс Топ Транс...\n');

    // Read current data
    const agentResult = await ssh.execCommand('cat /var/www/newrepo/data/counter-agents/agent_1750607702906_toptrans.json');
    const agent = JSON.parse(agentResult.stdout);

    console.log(`Текущий баланс: ${agent.balance} руб.`);

    // Set balance to 0
    agent.balance = 0;

    // Write back
    const jsonStr = JSON.stringify(agent, null, 2);
    await ssh.execCommand(`cat > /var/www/newrepo/data/counter-agents/agent_1750607702906_toptrans.json << 'EOFDATA'
${jsonStr}
EOFDATA`);

    console.log('✓ Баланс обнулён!');
    console.log(`Новый баланс: ${agent.balance} руб.`);

    // Restart PM2
    console.log('\nПерезапускаю PM2...');
    await ssh.execCommand('pm2 restart all', { cwd: '/var/www/newrepo' });
    console.log('✓ PM2 перезапущен');

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

clearBalance();
