const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function fixInventory() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Исправляю склад для существующих расходов...\n');

    // Read current inventory
    const invResult = await ssh.execCommand('cat /var/www/newrepo/data/inventory.json');
    const inventory = JSON.parse(invResult.stdout);

    console.log(`Текущий остаток: ${inventory.chemicalStockGrams}g\n`);

    // Add the two existing chemical purchases manually
    // 1. 13.11.2025: 2kg
    // 2. 26.11.2025: 5kg
    const totalPurchases = (2 + 5) * 1000; // 7000g

    console.log('Добавляю существующие закупки химии:');
    console.log('  - 13.11.2025: 2кг (2000g)');
    console.log('  - 26.11.2025: 5кг (5000g)');
    console.log(`  Всего: 7кг (7000g)\n`);

    inventory.chemicalStockGrams += totalPurchases;

    console.log(`Новый остаток: ${inventory.chemicalStockGrams}g (${inventory.chemicalStockGrams / 1000}кг)`);

    // Write updated inventory
    await ssh.execCommand(`cat > /var/www/newrepo/data/inventory.json << 'EOFDATA'
${JSON.stringify(inventory, null, 2)}
EOFDATA`);

    console.log('\n✓ Склад обновлён!');
    console.log('\nТеперь:');
    console.log('  - Все НОВЫЕ расходы "Закупка химии" будут автоматически добавлять химию');
    console.log('  - Все НОВЫЕ мойки будут автоматически вычитать химию');

    // Restart PM2
    console.log('\nПерезапускаю PM2...');
    await ssh.execCommand('pm2 restart all', { cwd: '/var/www/newrepo' });
    console.log('✓ PM2 перезапущен');

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixInventory();
