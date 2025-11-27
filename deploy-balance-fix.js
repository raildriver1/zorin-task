const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function deploy() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Uploading fixed file...');
    await ssh.putFile(
      path.join(__dirname, 'src/components/common/ClientFinanceDashboard.tsx'),
      '/var/www/newrepo/src/components/common/ClientFinanceDashboard.tsx'
    );
    console.log('Uploaded!');

    console.log('\nRebuilding project...');
    const buildResult = await ssh.execCommand('npm run build', {
      cwd: '/var/www/newrepo'
    });
    console.log(buildResult.stdout);

    console.log('\nRestarting PM2...');
    const pm2Result = await ssh.execCommand('pm2 restart all', {
      cwd: '/var/www/newrepo'
    });
    console.log(pm2Result.stdout);

    ssh.dispose();
    console.log('\nDeployment completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

deploy();
