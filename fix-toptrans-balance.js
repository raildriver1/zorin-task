const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function fixBalance() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Fixing Топ Транс balance...\n');

    // Read current data
    const agentResult = await ssh.execCommand('cat /var/www/newrepo/data/counter-agents/agent_1750607702906_toptrans.json');
    const agent = JSON.parse(agentResult.stdout);

    console.log('Current balance:', agent.balance);
    console.log('Should be: -1800 (one wash of 1800 rubles)');
    console.log();

    // Update balance to match actual washes
    agent.balance = -1800;

    // Add initialBalance field set to 0 (no prior debt)
    agent.initialBalance = 0;

    // Write back
    const jsonStr = JSON.stringify(agent, null, 2);
    await ssh.execCommand(`cat > /var/www/newrepo/data/counter-agents/agent_1750607702906_toptrans.json << 'EOFDATA'
${jsonStr}
EOFDATA`);

    console.log('✓ Updated counter-agent file');
    console.log('  New balance: -1800');
    console.log('  Added initialBalance: 0');
    console.log();

    // Restart PM2 to clear cache
    console.log('Restarting PM2...');
    const pm2Result = await ssh.execCommand('pm2 restart all', {
      cwd: '/var/www/newrepo'
    });
    console.log('✓ PM2 restarted');

    console.log('\nBalance fixed! Refresh the page to see the changes.');

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixBalance();
