
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { WashEvent } from '@/types';
import { invalidateWashEventsCache } from '@/lib/data-loader';

const dataDir = path.join(process.cwd(), 'data', 'wash-events');

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


    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
    invalidateWashEventsCache();
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
    await fs.unlink(filePath);
    invalidateWashEventsCache();
    return NextResponse.json({ message: 'Wash event deleted successfully' });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Wash event not found' }, { status: 404 });
    }
    console.error(`Error deleting wash event data for ID ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
