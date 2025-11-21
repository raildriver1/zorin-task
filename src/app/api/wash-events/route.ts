
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { WashEvent } from '@/types';
import { getWashEventsData, invalidateWashEventsCache } from '@/lib/data-loader';

const dataDir = path.join(process.cwd(), 'data', 'wash-events');

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
    await fs.writeFile(filePath, JSON.stringify(newEvent, null, 2), 'utf-8');
    invalidateWashEventsCache();
    return NextResponse.json({ message: 'Wash event created successfully', event: newEvent }, { status: 201 });
  } catch (error) {
    console.error('Error creating wash event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
