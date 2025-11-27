const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function checkExpense() {
  try {
    await ssh.connect({
      host: '193.227.241.63',
      port: 22,
      username: 'root',
      password: 'mRG1c6TBDIJJfSip'
    });

    console.log('Проверяю расходы и склад...\n');

    // Check latest expenses
    const expensesResult = await ssh.execCommand('ls -t /var/www/newrepo/data/expenses/*.json | head -5');
    const expenseFiles = expensesResult.stdout.trim().split('\n');

    console.log('=== ПОСЛЕДНИЕ РАСХОДЫ ===\n');

    for (const file of expenseFiles) {
      if (file) {
        const expenseData = await ssh.execCommand(`cat ${file}`);
        const expense = JSON.parse(expenseData.stdout);

        console.log(`Файл: ${file.split('/').pop()}`);
        console.log(`  Дата: ${expense.date}`);
        console.log(`  Категория: "${expense.category}"`);
        console.log(`  Описание: ${expense.description}`);
        console.log(`  Количество: ${expense.quantity || 'не указано'}`);
        console.log(`  Единица: ${expense.unit || 'не указано'}`);
        console.log(`  Сумма: ${expense.amount} руб.`);
        console.log();
      }
    }

    // Check current inventory
    console.log('=== ТЕКУЩИЙ СКЛАД ===\n');
    const invResult = await ssh.execCommand('cat /var/www/newrepo/data/inventory.json');
    const inventory = JSON.parse(invResult.stdout);

    console.log(`Остаток химии: ${inventory.chemicalStockGrams}g (${inventory.chemicalStockGrams / 1000}kg)`);
    console.log();

    // Check for expenses with category "Закупка химии"
    console.log('=== ПОИСК РАСХОДОВ "Закупка химии" ===\n');
    const searchResult = await ssh.execCommand('grep -l "Закупка химии" /var/www/newrepo/data/expenses/*.json 2>/dev/null || echo "Не найдено"');

    if (searchResult.stdout.includes('Не найдено')) {
      console.log('❌ НЕ НАЙДЕНО расходов с категорией "Закупка химии"');
      console.log();
      console.log('ПРОБЛЕМА: Категория должна быть ТОЧНО "Закупка химии"');
      console.log('Проверьте как вы вводили категорию!');
    } else {
      const chemicalExpenses = searchResult.stdout.trim().split('\n');
      console.log(`✓ Найдено ${chemicalExpenses.length} расход(ов) с категорией "Закупка химии":\n`);

      for (const file of chemicalExpenses) {
        const expData = await ssh.execCommand(`cat ${file}`);
        const exp = JSON.parse(expData.stdout);
        console.log(`  - ${exp.date}: ${exp.quantity}${exp.unit} на сумму ${exp.amount} руб.`);
      }
    }

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkExpense();
