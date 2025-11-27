const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function deploy() {
  try {
    console.log('Connecting to server...');
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Connected successfully!');

    // Upload files
    const filesToUpload = [
      {
        local: path.join(__dirname, 'src/components/employee/ZorinWorkstationConsole.tsx'),
        remote: '/var/www/newrepo/src/components/employee/ZorinWorkstationConsole.tsx'
      },
      {
        local: path.join(__dirname, 'src/components/employee/WorkstationConsole.tsx'),
        remote: '/var/www/newrepo/src/components/employee/WorkstationConsole.tsx'
      },
      {
        local: path.join(__dirname, 'src/app/wash-log/page.tsx'),
        remote: '/var/www/newrepo/src/app/wash-log/page.tsx'
      },
      {
        local: path.join(__dirname, 'src/app/wash-log/components/WashLogPageWrapper.tsx'),
        remote: '/var/www/newrepo/src/app/wash-log/components/WashLogPageWrapper.tsx'
      },
      {
        local: path.join(__dirname, 'src/app/api/wash-events/route.ts'),
        remote: '/var/www/newrepo/src/app/api/wash-events/route.ts'
      },
      {
        local: path.join(__dirname, 'src/app/api/wash-events/[id]/route.ts'),
        remote: '/var/www/newrepo/src/app/api/wash-events/[id]/route.ts'
      },
      {
        local: path.join(__dirname, 'src/app/api/expenses/route.ts'),
        remote: '/var/www/newrepo/src/app/api/expenses/route.ts'
      },
      {
        local: path.join(__dirname, 'src/app/api/expenses/[id]/route.ts'),
        remote: '/var/www/newrepo/src/app/api/expenses/[id]/route.ts'
      }
    ];

    for (const file of filesToUpload) {
      console.log(`Uploading ${file.local} to ${file.remote}...`);
      await ssh.putFile(file.local, file.remote);
      console.log(`Uploaded: ${file.remote}`);
    }

    console.log('All files uploaded successfully!');

    // Rebuild the project
    console.log('Rebuilding project...');
    const result = await ssh.execCommand('npm run build', {
      cwd: '/var/www/newrepo'
    });

    console.log('Build output:', result.stdout);
    if (result.stderr) {
      console.log('Build stderr:', result.stderr);
    }

    // Restart PM2
    console.log('Restarting PM2...');
    const restartResult = await ssh.execCommand('pm2 restart all', {
      cwd: '/var/www/newrepo'
    });

    console.log('PM2 restart output:', restartResult.stdout);
    if (restartResult.stderr) {
      console.log('PM2 stderr:', restartResult.stderr);
    }

    console.log('Deployment completed successfully!');

    ssh.dispose();
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

deploy();
