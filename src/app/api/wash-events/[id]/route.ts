export const dynamic = "force-dynamic";


import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { WashEvent } from '@/types';
import { invalidateWashEventsCache, getInventory, invalidateInventoryCache } from '@/lib/data-loader';

const dataDir = path.join(process.cwd(), 'data', 'wash-events');
const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');

// Calculate total chemical consumption for a wash event
function calculateTotalChemicalConsumption(washEvent: WashEvent): number {
  let total = 0;

  // Main service consumption
  if (washEvent.services.main.chemicalConsumption) {
    total += washEvent.services.main.chemicalConsumption;
  }

  // Additional services consumption
  if (washEvent.services.additional && washEvent.services.additional.length > 0) {
    washEvent.services.additional.forEach(service => {
      if (service.chemicalConsumption) {
        total += service.chemicalConsumption;
      }
    });
  }

  return total;
}

// Update inventory by a delta (positive = add, negative = subtract)
async function updateInventory(deltaGrams: number) {
  if (deltaGrams === 0) return;

  const inventory = await getInventory();
  inventory.chemicalStockGrams -= deltaGrams; // Negative delta = add back to stock
  await fs.writeFile(inventoryPath, JSON.stringify(inventory, null, 2), 'utf-8');
  invalidateInventoryCache();
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Wash Event ID is required' }, { status: 400 });
  }
  const filePath = path.join(dataDir, `${id}.json`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    let data = JSON.parse(fileContent);

    // Migration logic
    if (data.driverComment && !Array.isArray(data.driverComments)) {
        // Ensure driverComment is an object and not an array before wrapping
        if (typeof data.driverComment === 'object' && !Array.isArray(data.driverComment)) {
            data.driverComments = [data.driverComment];
        }
        delete data.driverComment;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Wash Event not found' }, { status: 404 });
    }
    console.error(`Error reading wash event data for ID ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id:string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Wash Event ID is required for PUT' }, { status: 400 });
  }
  const filePath = path.join(dataDir, `${id}.json`);

  try {
    // Read old wash event to get previous chemical consumption
    let oldConsumption = 0;
    try {
      const oldFileContent = await fs.readFile(filePath, 'utf-8');
      const oldEvent: WashEvent = JSON.parse(oldFileContent);
      oldConsumption = calculateTotalChemicalConsumption(oldEvent);
    } catch (error) {
      // File doesn't exist or can't be read - treat as new event
      oldConsumption = 0;
    }

    const updatedData: WashEvent = await request.json();

    if (!updatedData.id || updatedData.id !== id) {
        updatedData.id = id;
    }

    // Migration logic for data coming from client
    if ((updatedData as any).driverComment && !Array.isArray(updatedData.driverComments)) {
        const comment = (updatedData as any).driverComment;
        if (typeof comment === 'object' && !Array.isArray(comment)) {
             updatedData.driverComments = [comment];
        }
        delete (updatedData as any).driverComment;
    }

    // Write updated wash event
    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
    invalidateWashEventsCache();

    // Update inventory: add back old consumption, subtract new consumption
    const newConsumption = calculateTotalChemicalConsumption(updatedData);
    const delta = newConsumption - oldConsumption; // Positive if consumption increased
    await updateInventory(delta);

    return NextResponse.json({ message: 'Wash Event updated successfully', event: updatedData });
  } catch (error) {
    console.error(`Error writing wash event data for ID ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id:string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Wash Event ID is required for DELETE' }, { status: 400 });
  }
  const filePath = path.join(dataDir, `${id}.json`);

  try {
    // Read wash event before deleting to get chemical consumption
    let consumedChemicals = 0;
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const washEvent: WashEvent = JSON.parse(fileContent);
      consumedChemicals = calculateTotalChemicalConsumption(washEvent);
    } catch (error) {
      // File doesn't exist or can't be read
      consumedChemicals = 0;
    }

    // Delete the wash event file
    await fs.unlink(filePath);
    invalidateWashEventsCache();

    // Add chemicals back to inventory (reverse the consumption)
    if (consumedChemicals > 0) {
      await updateInventory(-consumedChemicals); // Negative = add back to stock
    }

    return NextResponse.json({ message: 'Wash event deleted successfully' });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Wash event not found' }, { status: 404 });
    }
    console.error(`Error deleting wash event data for ID ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
