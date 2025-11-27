const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function findWashes() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Searching for ALL references to Топ Транс...\n');

    // Search in wash events for sourceId
    const grepResult = await ssh.execCommand('grep -r "agent_1750607702906_toptrans" /var/www/newrepo/data/wash-events/ 2>/dev/null || echo "No matches"');

    console.log('Grep results:');
    console.log(grepResult.stdout);
    console.log();

    // Also search by source name
    const nameResult = await ssh.execCommand('grep -r "Топ Транс" /var/www/newrepo/data/wash-events/ 2>/dev/null || echo "No matches"');

    console.log('Search by name "Топ Транс":');
    console.log(nameResult.stdout);
    console.log();

    // List all wash event files
    const listResult = await ssh.execCommand('ls -lh /var/www/newrepo/data/wash-events/ | tail -30');
    console.log('Recent wash event files:');
    console.log(listResult.stdout);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

findWashes();
