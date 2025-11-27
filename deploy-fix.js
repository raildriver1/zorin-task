const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const serverConfig = {
  host: '193.227.241.63',
  port: 18151,
  username: 'root',
  password: 'mRG1c6TBDIJJfSip',
  tryKeyboard: true,
  debug: console.log
};

const filesToUpload = [
  {
    local: path.join(__dirname, 'src/components/employee/ZorinWorkstationConsole.tsx'),
    remote: '/root/project-zorin/src/components/employee/ZorinWorkstationConsole.tsx'
  },
  {
    local: path.join(__dirname, 'src/components/employee/WorkstationConsole.tsx'),
    remote: '/root/project-zorin/src/components/employee/WorkstationConsole.tsx'
  }
];

conn.on('ready', () => {
  console.log('Connected to server');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }

    let uploadCount = 0;

    filesToUpload.forEach(file => {
      const readStream = fs.createReadStream(file.local);
      const writeStream = sftp.createWriteStream(file.remote);

      writeStream.on('close', () => {
        console.log(`Uploaded: ${file.remote}`);
        uploadCount++;

        if (uploadCount === filesToUpload.length) {
          console.log('All files uploaded successfully');

          // Now rebuild the project
          conn.exec('cd /root/project-zorin && npm run build && pm2 restart zorin-project', (err, stream) => {
            if (err) {
              console.error('Exec error:', err);
              conn.end();
              return;
            }

            stream.on('close', (code) => {
              console.log(`Rebuild completed with exit code: ${code}`);
              conn.end();
            }).on('data', (data) => {
              console.log('STDOUT: ' + data);
            }).stderr.on('data', (data) => {
              console.log('STDERR: ' + data);
            });
          });
        }
      });

      writeStream.on('error', (err) => {
        console.error(`Error uploading ${file.remote}:`, err);
        conn.end();
      });

      readStream.pipe(writeStream);
    });
  });
}).connect(serverConfig);

conn.on('error', (err) => {
  console.error('Connection error:', err);
});
