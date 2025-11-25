
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Expense } from '@/types';
import { getExpensesData, invalidateExpensesCache, invalidateInventoryCache, getInventory } from '@/lib/data-loader';

const dataDir = path.join(process.cwd(), 'data', 'expenses');
const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');


async function ensureDataDirectory() {
  try {
    await fs.access(dataDir);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dataDir, { recursive: true });
    } else {
      throw error;
    }
  }
}

async function updateInventory(changeInGrams: number) {
    const inventory = await getInventory();
    inventory.chemicalStockGrams += changeInGrams;
    await fs.writeFile(inventoryPath, JSON.stringify(inventory, null, 2), 'utf-8');
    invalidateInventoryCache();
}


export async function GET() {
  try {
    const expenses = await getExpensesData();
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error reading expenses directory:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDataDirectory();
    const newExpense: Expense = await request.json();
    if (!newExpense.id) {
       return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const filePath = path.join(dataDir, `${newExpense.id}.json`);

    // Write expense file FIRST - if this fails, inventory won't be updated
    await fs.writeFile(filePath, JSON.stringify(newExpense, null, 2), 'utf-8');
    invalidateExpensesCache();

    // Only update inventory after expense is successfully saved
    if (newExpense.category === 'Закупка химии' && newExpense.unit === 'кг' && newExpense.quantity) {
        const amountInGrams = newExpense.quantity * 1000;
        await updateInventory(amountInGrams);
    }

    return NextResponse.json({ message: 'Expense created successfully', expense: newExpense }, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
