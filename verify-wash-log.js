const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function verify() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Connected to server\n');

    // Check how many wash events exist
    const countResult = await ssh.execCommand('ls -1 /var/www/newrepo/data/wash-events/ | wc -l');
    console.log(`Total wash events in database: ${countResult.stdout.trim()}`);

    // Get the 3 most recent wash events
    const listResult = await ssh.execCommand('ls -t /var/www/newrepo/data/wash-events/ | head -n 3');
    const recentFiles = listResult.stdout.trim().split('\n');

    console.log('\nRecent wash events:');
    for (const file of recentFiles) {
      if (file) {
        const washResult = await ssh.execCommand(`cat /var/www/newrepo/data/wash-events/${file}`);
        const wash = JSON.parse(washResult.stdout);

        console.log(`\n  ${file}:`);
        console.log(`    Vehicle: ${wash.vehicleNumber}`);
        console.log(`    Time: ${new Date(wash.timestamp).toLocaleString('ru-RU')}`);
        console.log(`    Employees: ${wash.employeeIds?.length || 0} (${wash.employeeIds?.join(', ')})`);
        console.log(`    Main service: ${wash.services.main.name} - ${wash.services.main.totalPrice}₽`);

        if (wash.services.main.employeeConsumptions) {
          console.log(`    Chemical consumption:`);
          wash.services.main.employeeConsumptions.forEach(ec => {
            console.log(`      ${ec.employeeId}: ${ec.chemicalGrams}g`);
          });
        }
      }
    }

    console.log('\n✓ Wash log should now be displaying these events');

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

verify();
