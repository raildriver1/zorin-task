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

    // Read Топ Транс counter agent
    const agentResult = await ssh.execCommand('cat /var/www/newrepo/data/counter-agents/agent_1750607702906_toptrans.json');
    const agent = JSON.parse(agentResult.stdout);

    console.log('Counter Agent: Топ Транс');
    console.log('  ID:', agent.id);
    console.log('  Name:', agent.name);
    console.log('  Balance:', agent.balance);
    console.log('');

    // Read client transactions
    try {
      const txnResult = await ssh.execCommand('cat /var/www/newrepo/data/client-transactions/agent_1750607702906_toptrans.json');
      const transactions = JSON.parse(txnResult.stdout);
      console.log('Transactions:');
      transactions.forEach(txn => {
        console.log(`  ${txn.date}: ${txn.type} ${txn.amount} руб - ${txn.description}`);
      });
      console.log('');
      console.log('Total from transactions:', transactions.reduce((sum, t) => sum + t.amount, 0));
    } catch (e) {
      console.log('No transactions file found');
    }

    // Find wash events for this counter agent
    const washesResult = await ssh.execCommand('grep -l "agent_1750607702906_toptrans" /var/www/newrepo/data/wash-events/*.json');
    const washFiles = washesResult.stdout.split('\n').filter(f => f.trim());

    console.log(`\nFound ${washFiles.length} wash events for this counter agent:`);
    let totalWashAmount = 0;
    for (const file of washFiles) {
      const washResult = await ssh.execCommand(`cat ${file}`);
      const wash = JSON.parse(washResult.stdout);
      console.log(`  ${wash.timestamp}: ${wash.vehicleNumber} - ${wash.totalAmount} руб`);
      totalWashAmount += wash.totalAmount;
    }
    console.log(`\nTotal wash amount: ${totalWashAmount} руб`);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBalance();
