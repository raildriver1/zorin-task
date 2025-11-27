const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function checkSync() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Checking wash events sync...\n');

    // Get list of actual files
    const filesResult = await ssh.execCommand('ls /var/www/newrepo/data/wash-events/*.json | wc -l');
    const fileCount = parseInt(filesResult.stdout.trim());

    console.log(`Files on disk: ${fileCount}`);

    // Get list of file names
    const listResult = await ssh.execCommand('ls /var/www/newrepo/data/wash-events/*.json');
    const files = listResult.stdout.trim().split('\n');

    console.log('\nAll wash event files:');
    files.forEach((f, i) => {
      const filename = f.split('/').pop();
      console.log(`  ${i + 1}. ${filename}`);
    });

    // Try to read each file to make sure they're valid JSON
    console.log('\nValidating files...');
    let invalidCount = 0;
    for (const file of files) {
      const readResult = await ssh.execCommand(`cat ${file}`);
      try {
        const wash = JSON.parse(readResult.stdout);
        if (!wash.id || !wash.timestamp) {
          console.log(`  ⚠ ${file.split('/').pop()} - missing id or timestamp`);
          invalidCount++;
        }
      } catch (e) {
        console.log(`  ✗ ${file.split('/').pop()} - invalid JSON`);
        invalidCount++;
      }
    }

    console.log(`\n✓ Valid files: ${fileCount - invalidCount}`);
    console.log(`✗ Invalid/corrupt files: ${invalidCount}`);

    // Check cache status
    console.log('\nChecking if cache is fresh...');
    const cacheResult = await ssh.execCommand('pm2 describe newrepo | grep "uptime"');
    console.log(cacheResult.stdout);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSync();
