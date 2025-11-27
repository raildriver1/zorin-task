const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function checkFile() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Reading counter-agent file...\n');

    const result = await ssh.execCommand('cat /var/www/newrepo/data/counter-agents/agent_1750607702906_toptrans.json');

    console.log('Raw file contents:');
    console.log(result.stdout);
    console.log();

    if (result.stdout) {
      try {
        const parsed = JSON.parse(result.stdout);
        console.log('Parsed JSON:');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Failed to parse JSON:', e.message);
      }
    }

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFile();
