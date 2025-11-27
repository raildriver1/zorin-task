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

    console.log('Checking recent wash events...\n');

    // List recent wash event files
    const listResult = await ssh.execCommand('ls -lt /var/www/newrepo/data/wash-events/ | head -n 10');
    console.log('Recent wash event files:');
    console.log(listResult.stdout);

    // Read a few recent files to check employeeIds
    const filesResult = await ssh.execCommand('cd /var/www/newrepo/data/wash-events && ls -t | head -n 3');
    const files = filesResult.stdout.split('\n').filter(f => f.trim());

    console.log('\n\nChecking employeeIds in recent wash events:\n');
    for (const file of files) {
      const catResult = await ssh.execCommand(`cat /var/www/newrepo/data/wash-events/${file}`);
      const data = JSON.parse(catResult.stdout);
      console.log(`File: ${file}`);
      console.log(`  Vehicle: ${data.vehicleNumber}`);
      console.log(`  Timestamp: ${data.timestamp}`);
      console.log(`  Employee IDs: ${JSON.stringify(data.employeeIds)}`);
      console.log(`  Number of employees: ${data.employeeIds?.length || 0}`);
      console.log(`  Total Amount: ${data.totalAmount}`);
      console.log('');
    }

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();
