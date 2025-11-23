
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Expense } from '@/types';
import { invalidateExpensesCache, invalidateInventoryCache, getInventory } from '@/lib/data-loader';

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


export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
  }
  const filePath = path.join(dataDir, `${id}.json`);

  try {
    await ensureDataDirectory();
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    console.error(`Error reading expense data for ID ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Expense ID is required for PUT' }, { status: 400 });
  }
  const filePath = path.join(dataDir, `${id}.json`);

  try {
    await ensureDataDirectory();
    const updatedData: Expense = await request.json();
    
    if (!updatedData.id || updatedData.id !== id) {
        updatedData.id = id;
    }

    // Handle inventory change
    let oldChemicalAmountGrams = 0;
    try {
        const oldFileContent = await fs.readFile(filePath, 'utf-8');
        const oldData: Expense = JSON.parse(oldFileContent);
        if (oldData.category === 'Закупка химии' && oldData.unit === 'кг' && oldData.quantity) {
            oldChemicalAmountGrams = oldData.quantity * 1000;
        }
    } catch (e: any) {
      if (e.code !== 'ENOENT') console.error("Could not read old expense file:", e);
    }
    
    let newChemicalAmountGrams = 0;
    if (updatedData.category === 'Закупка химии' && updatedData.unit === 'кг' && updatedData.quantity) {
        newChemicalAmountGrams = updatedData.quantity * 1000;
    }

    const inventoryChange = newChemicalAmountGrams - oldChemicalAmountGrams;

    // Write file FIRST - if this fails, inventory won't be updated
    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
    invalidateExpensesCache();

    // Only update inventory after file is successfully written
    if (inventoryChange !== 0) {
        await updateInventory(inventoryChange);
    }

    return NextResponse.json({ message: 'Data updated successfully', expense: updatedData });
  } catch (error) {
    console.error(`Error writing expense data for ID ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Expense ID is required for DELETE' }, { status: 400 });
  }
  const filePath = path.join(dataDir, `${id}.json`);

  try {
    await ensureDataDirectory();

    let chemicalAmountToSubtractGrams = 0;
     try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data: Expense = JSON.parse(fileContent);
        if (data.category === 'Закупка химии' && data.unit === 'кг' && data.quantity) {
            chemicalAmountToSubtractGrams = data.quantity * 1000;
        }
    } catch (e: any) {
       if (e.code !== 'ENOENT') console.error("Could not read expense file before deleting:", e);
       else return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Update inventory FIRST - if this fails, we don't delete the file
    if (chemicalAmountToSubtractGrams > 0) {
        await updateInventory(-chemicalAmountToSubtractGrams);
    }

    // Only delete file after inventory is successfully updated
    await fs.unlink(filePath);
    invalidateExpensesCache();

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    console.error(`Error deleting expense data for ID ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
