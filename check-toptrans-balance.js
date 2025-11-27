const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function checkBalance() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Checking Топ Транс data...\n');

    // Get counter-agent data
    const agentResult = await ssh.execCommand('cat /var/www/newrepo/data/counter-agents/agent_1750607702906_toptrans.json');
    const agent = JSON.parse(agentResult.stdout);

    console.log('Counter-agent info:');
    console.log('  Name:', agent.companyName);
    console.log('  Initial balance:', agent.initialBalance);
    console.log('  Created:', new Date(agent.createdAt).toLocaleString('ru-RU'));
    console.log();

    // Get all wash events for this counter-agent
    const washResult = await ssh.execCommand('grep -l "agent_1750607702906_toptrans" /var/www/newrepo/data/wash-events/*.json || echo "No washes found"');

    if (washResult.stdout.includes('No washes found')) {
      console.log('No wash events found for this counter-agent');
    } else {
      const washFiles = washResult.stdout.trim().split('\n');
      console.log(`Found ${washFiles.length} wash event(s):\n`);

      for (const file of washFiles) {
        const washData = await ssh.execCommand(`cat ${file}`);
        const wash = JSON.parse(washData.stdout);

        console.log(`  File: ${file.split('/').pop()}`);
        console.log(`    ID: ${wash.id}`);
        console.log(`    Date: ${new Date(wash.timestamp).toLocaleString('ru-RU')}`);
        console.log(`    Vehicle: ${wash.vehicleNumber}`);
        console.log(`    Amount: ${wash.totalAmount} руб.`);
        console.log(`    Source ID: ${wash.sourceId}`);
        console.log(`    Source Name: ${wash.sourceName}`);
        console.log();
      }
    }

    // Get client transactions
    const transResult = await ssh.execCommand('cat /var/www/newrepo/data/client-transactions/agent_1750607702906_toptrans.json 2>/dev/null || echo "[]"');
    const transactions = JSON.parse(transResult.stdout);

    console.log(`\nClient transactions: ${transactions.length}`);
    transactions.forEach((t, i) => {
      console.log(`  ${i + 1}. ${new Date(t.date).toLocaleString('ru-RU')} - ${t.type}: ${t.amount} руб. (${t.description})`);
    });

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBalance();
