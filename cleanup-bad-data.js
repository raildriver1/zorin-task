const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function cleanup() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Reading employee transactions...');
    const readResult = await ssh.execCommand('cat /var/www/newrepo/data/employee-transactions/emp_1762757468682_a072ahl.json');
    const transactions = JSON.parse(readResult.stdout);

    console.log(`Found ${transactions.length} transactions`);

    // Keep only transactions with reasonable amounts (< 1 million)
    const cleanTransactions = transactions.filter(t => t.amount < 1000000);
    console.log(`Keeping ${cleanTransactions.length} reasonable transactions`);
    console.log(`Removing ${transactions.length - cleanTransactions.length} test transactions`);

    // Write cleaned data
    await ssh.execCommand(`cat > /var/www/newrepo/data/employee-transactions/emp_1762757468682_a072ahl.json << 'EOFDATA'
${JSON.stringify(cleanTransactions, null, 2)}
EOFDATA`);

    console.log('\nCleaned employee transactions!');

    // Fix inventory
    await ssh.execCommand(`cat > /var/www/newrepo/data/inventory.json << 'EOFDATA'
{
  "chemicalStockGrams": 0
}
EOFDATA`);

    console.log('Fixed inventory (set to 0 kg)!');

    // Invalidate caches by restarting PM2
    console.log('\nRestarting PM2...');
    const pm2Result = await ssh.execCommand('pm2 restart all', {
      cwd: '/var/www/newrepo'
    });
    console.log(pm2Result.stdout);

    ssh.dispose();
    console.log('\nCleanup completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

cleanup();
