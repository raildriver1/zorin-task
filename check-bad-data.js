const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function checkData() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Checking for bad expenses data...\n');

    // Check expenses
    const expensesCmd = await ssh.execCommand('cd /var/www/newrepo/data/expenses && for f in *.json; do echo "=== $f ==="; cat "$f"; done');
    console.log('EXPENSES:');
    console.log(expensesCmd.stdout);
    console.log('\n\n');

    // Check employee transactions
    const txnCmd = await ssh.execCommand('cd /var/www/newrepo/data/employee-transactions && for f in *.json; do size=$(stat -c%s "$f"); if [ $size -gt 1000 ]; then echo "=== $f (size: $size) ==="; cat "$f"; fi; done');
    console.log('LARGE EMPLOYEE TRANSACTIONS:');
    console.log(txnCmd.stdout);
    console.log('\n\n');

    // Check inventory
    const invCmd = await ssh.execCommand('cat /var/www/newrepo/data/inventory.json');
    console.log('INVENTORY:');
    console.log(invCmd.stdout);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();
