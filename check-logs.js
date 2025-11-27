const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function checkLogs() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Checking PM2 logs...\n');

    const result = await ssh.execCommand('pm2 logs newrepo --lines 30 --nostream');

    console.log(result.stdout);

    if (result.stderr) {
      console.log('Errors:', result.stderr);
    }

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkLogs();
