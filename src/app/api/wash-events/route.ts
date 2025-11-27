export const dynamic = "force-dynamic";


import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { WashEvent } from '@/types';
import { getWashEventsData, invalidateWashEventsCache, getInventory, invalidateInventoryCache } from '@/lib/data-loader';

const dataDir = path.join(process.cwd(), 'data', 'wash-events');
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

// Update inventory by subtracting consumed chemicals
async function updateInventoryAfterWash(consumedGrams: number) {
  if (consumedGrams <= 0) return; // No chemicals consumed

  const inventory = await getInventory();
  inventory.chemicalStockGrams -= consumedGrams; // SUBTRACT chemicals used
  await fs.writeFile(inventoryPath, JSON.stringify(inventory, null, 2), 'utf-8');
  invalidateInventoryCache();
}

export async function GET() {
  try {
    const events = await getWashEventsData();
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error reading wash events directory:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDataDirectory();
    const newEvent: WashEvent = await request.json();
    if (!newEvent.id) {
       return NextResponse.json({ error: 'Wash event ID is required' }, { status: 400 });
    }

    // Ensure driverComments is an array
    if (newEvent.driverComment) {
        newEvent.driverComments = [newEvent.driverComment];
        delete (newEvent as any).driverComment;
    }

    const filePath = path.join(dataDir, `${newEvent.id}.json`);

    // Write wash event file FIRST - if this fails, inventory won't be updated
    await fs.writeFile(filePath, JSON.stringify(newEvent, null, 2), 'utf-8');
    invalidateWashEventsCache();

    // Update inventory AFTER wash event is successfully saved
    const consumedChemicals = calculateTotalChemicalConsumption(newEvent);
    await updateInventoryAfterWash(consumedChemicals);

    return NextResponse.json({ message: 'Wash event created successfully', event: newEvent }, { status: 201 });
  } catch (error) {
    console.error('Error creating wash event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
