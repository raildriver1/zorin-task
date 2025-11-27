const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function checkChemicals() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('=== ПРОВЕРКА СИСТЕМЫ ХИМИИ ===\n');

    // 1. Check current inventory
    const invResult = await ssh.execCommand('cat /var/www/newrepo/data/inventory.json');
    const inventory = JSON.parse(invResult.stdout);

    console.log('1. СКЛАД:');
    console.log(`   Остаток химии: ${inventory.chemicalStockGrams}g (${inventory.chemicalStockGrams / 1000}kg)`);
    console.log(`   ${inventory.chemicalStockGrams >= 0 ? '✓ Положительный' : '✗ ОТРИЦАТЕЛЬНЫЙ!'}`);
    console.log();

    // 2. Get recent washes with 2 employees
    console.log('2. МОЙКИ С 2 СОТРУДНИКАМИ:\n');

    const washFiles = await ssh.execCommand('ls -t /var/www/newrepo/data/wash-events/*.json | head -5');
    const files = washFiles.stdout.trim().split('\n');

    for (const file of files) {
      const washData = await ssh.execCommand(`cat ${file}`);
      const wash = JSON.parse(washData.stdout);

      if (wash.employeeIds && wash.employeeIds.length === 2) {
        console.log(`   Файл: ${file.split('/').pop()}`);
        console.log(`   Дата: ${new Date(wash.timestamp).toLocaleString('ru-RU')}`);
        console.log(`   Машина: ${wash.vehicleNumber}`);
        console.log(`   Услуга: ${wash.services.main.serviceName}`);
        console.log(`   Сотрудники: ${wash.employeeIds.length} человека`);
        console.log();

        console.log(`   Основная услуга:`);
        console.log(`     - Норма расхода: ${wash.services.main.chemicalConsumption}g`);

        if (wash.services.main.employeeConsumptions) {
          console.log(`     - Распределение по сотрудникам:`);
          let totalDistributed = 0;
          wash.services.main.employeeConsumptions.forEach((ec, i) => {
            console.log(`       Сотрудник ${i + 1}: ${ec.chemicalGrams}g`);
            totalDistributed += ec.chemicalGrams || 0;
          });
          console.log(`     - ИТОГО распределено: ${totalDistributed}g`);

          const diff = wash.services.main.chemicalConsumption - totalDistributed;
          if (Math.abs(diff) > 0.01) {
            console.log(`     ⚠ НЕДОЧЁТ/ПЕРЕРАСХОД: ${diff}g`);
          } else {
            console.log(`     ✓ Расчёт верный`);
          }
        } else {
          console.log(`     ✗ НЕТ данных employeeConsumptions!`);
        }

        // Check additional services
        if (wash.services.additional && wash.services.additional.length > 0) {
          console.log(`   Дополнительные услуги (${wash.services.additional.length}):`);
          wash.services.additional.forEach((service, idx) => {
            console.log(`     ${idx + 1}. ${service.serviceName}`);
            console.log(`        Норма: ${service.chemicalConsumption || 0}g`);
            if (service.employeeConsumptions) {
              const addTotal = service.employeeConsumptions.reduce((sum, ec) => sum + (ec.chemicalGrams || 0), 0);
              console.log(`        Распределено: ${addTotal}g`);
            }
          });
        }

        console.log('\n   ---\n');
        break; // Show only first wash with 2 employees
      }
    }

    // 3. Calculate total consumption from all washes
    console.log('3. ОБЩИЙ РАСХОД ХИМИИ ПО ВСЕМ МОЙКАМ:\n');

    const allWashFiles = await ssh.execCommand('ls /var/www/newrepo/data/wash-events/*.json');
    const allFiles = allWashFiles.stdout.trim().split('\n');

    let totalConsumed = 0;
    let washCount = 0;

    for (const file of allFiles) {
      const washData = await ssh.execCommand(`cat ${file}`);
      const wash = JSON.parse(washData.stdout);

      // Main service consumption
      if (wash.services.main.chemicalConsumption) {
        totalConsumed += wash.services.main.chemicalConsumption;
      }

      // Additional services consumption
      if (wash.services.additional) {
        wash.services.additional.forEach(svc => {
          if (svc.chemicalConsumption) {
            totalConsumed += svc.chemicalConsumption;
          }
        });
      }

      washCount++;
    }

    console.log(`   Всего моек: ${washCount}`);
    console.log(`   Общий расход химии: ${totalConsumed}g (${(totalConsumed / 1000).toFixed(2)}kg)`);
    console.log();

    // 4. Calculate expected inventory
    console.log('4. ЛОГИКА РАСЧЁТА:\n');
    console.log(`   Текущий остаток на складе: ${inventory.chemicalStockGrams}g`);
    console.log(`   Израсходовано всего: ${totalConsumed}g`);
    console.log();
    console.log(`   Ожидаемая логика:`);
    console.log(`   - Когда добавляем химию на склад → остаток растёт (в +)`);
    console.log(`   - Когда делаем мойку → остаток уменьшается`);
    console.log(`   - Формула: Остаток = Пополнения - Расход`);
    console.log();

    if (inventory.chemicalStockGrams < 0) {
      console.log(`   ⚠ ПРОБЛЕМА: Остаток отрицательный!`);
      console.log(`   Возможные причины:`);
      console.log(`   1. Не учтены пополнения склада`);
      console.log(`   2. Система вычитает вместо того чтобы прибавлять при пополнении`);
      console.log(`   3. Неправильная начальная инициализация`);
    } else {
      console.log(`   ✓ Остаток положительный - нормально`);
    }

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkChemicals();
