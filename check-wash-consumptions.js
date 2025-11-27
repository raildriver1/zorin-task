const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function checkWash() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    // Get the most recent wash event
    const listResult = await ssh.execCommand('ls -t /var/www/newrepo/data/wash-events/ | head -n 1');
    const latestFile = listResult.stdout.trim();

    console.log(`Latest wash event: ${latestFile}\n`);

    const washResult = await ssh.execCommand(`cat /var/www/newrepo/data/wash-events/${latestFile}`);
    const wash = JSON.parse(washResult.stdout);

    console.log('Wash Event Details:');
    console.log('  ID:', wash.id);
    console.log('  Vehicle:', wash.vehicleNumber);
    console.log('  Timestamp:', wash.timestamp);
    console.log('  Employee IDs:', wash.employeeIds);
    console.log('  Number of employees:', wash.employeeIds?.length);
    console.log('  Main Service:', wash.services.main);
    console.log('\n  Employee Consumptions:');

    if (wash.services.main.employeeConsumptions) {
      wash.services.main.employeeConsumptions.forEach(ec => {
        console.log(`    Employee ${ec.employeeId}: ${ec.chemicalGrams}g`);
      });

      const totalConsumption = wash.services.main.employeeConsumptions.reduce((sum, ec) => sum + ec.chemicalGrams, 0);
      console.log(`\n  Total consumption: ${totalConsumption}g`);
      console.log(`  Main service chemicalConsumption: ${wash.services.main.chemicalConsumption}g`);

      if (wash.employeeIds.length > 1) {
        const perEmployee = wash.services.main.chemicalConsumption / wash.employeeIds.length;
        console.log(`\n  Expected per employee (50/50): ${perEmployee}g each`);
      }
    }

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkWash();
