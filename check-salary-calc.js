const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function checkSalary() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    // Read the wash event with 2 employees
    const washResult = await ssh.execCommand('cat /var/www/newrepo/data/wash-events/we_1764105874306_vy190xw.json');
    const washEvent = JSON.parse(washResult.stdout);

    console.log('Wash Event:');
    console.log('  Vehicle:', washEvent.vehicleNumber);
    console.log('  Employees:', washEvent.employeeIds);
    console.log('  Total Amount:', washEvent.totalAmount);
    console.log('  Net Amount:', washEvent.netAmount);
    console.log('  Services:', washEvent.services);
    console.log('');

    // Read employee data
    for (const empId of washEvent.employeeIds) {
      const empResult = await ssh.execCommand(`cat /var/www/newrepo/data/employees/${empId}.json`);
      const emp = JSON.parse(empResult.stdout);

      console.log(`Employee: ${emp.fullName} (${empId})`);
      console.log(`  Salary Scheme ID: ${emp.salarySchemeId}`);

      if (emp.salarySchemeId) {
        const schemeResult = await ssh.execCommand(`cat /var/www/newrepo/data/salary-schemes/${emp.salarySchemeId}.json`);
        const scheme = JSON.parse(schemeResult.stdout);
        console.log(`  Scheme Type: ${scheme.type}`);
        console.log(`  Scheme Details:`, JSON.stringify(scheme, null, 2));
      }
      console.log('');
    }

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSalary();
