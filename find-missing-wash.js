const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function findMissing() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Searching for wash events with A123BC777...\n');

    // Search for A123BC777
    const grepResult = await ssh.execCommand('grep -l "A123BC777" /var/www/newrepo/data/wash-events/*.json 2>/dev/null || echo "No matches"');

    if (grepResult.stdout.includes('No matches')) {
      console.log('❌ No files found for A123BC777');
      console.log('This explains the "not found" error!\n');
    } else {
      const files = grepResult.stdout.trim().split('\n');
      console.log(`Found ${files.length} file(s) for A123BC777:\n`);

      for (const file of files) {
        const washData = await ssh.execCommand(`cat ${file}`);
        const wash = JSON.parse(washData.stdout);

        console.log(`File: ${file.split('/').pop()}`);
        console.log(`  ID: ${wash.id}`);
        console.log(`  Date: ${new Date(wash.timestamp).toLocaleString('ru-RU')}`);
        console.log(`  Vehicle: ${wash.vehicleNumber}`);
        console.log(`  Service: ${wash.services.main.serviceName}`);
        console.log(`  Amount: ${wash.totalAmount} руб.`);
        console.log(`  Payment: ${wash.paymentMethod}`);
        console.log();
      }
    }

    // List all wash events from Nov 26
    console.log('All washes from November 26, 2025:');
    const nov26Result = await ssh.execCommand('for f in /var/www/newrepo/data/wash-events/*.json; do grep -l "2025-11-26" "$f"; done 2>/dev/null || echo "No matches"');

    if (!nov26Result.stdout.includes('No matches')) {
      const nov26Files = nov26Result.stdout.trim().split('\n');
      console.log(`Found ${nov26Files.length} wash(es) on Nov 26:\n`);

      for (const file of nov26Files) {
        if (file) {
          const washData = await ssh.execCommand(`cat ${file}`);
          const wash = JSON.parse(washData.stdout);
          console.log(`  - ${new Date(wash.timestamp).toLocaleTimeString('ru-RU')} | ${wash.vehicleNumber} | ${wash.totalAmount} руб.`);
        }
      }
    }

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

findMissing();
