export const dynamic = "force-dynamic";


import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { CounterAgent } from '@/types';
import { invalidateCounterAgentsCache } from '@/lib/data-loader';

const dataDir = path.join(process.cwd(), 'data', 'counter-agents');

// Ensure the data directory exists
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

// GET request handler for a specific counter agent
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
  }
  const filePath = path.join(dataDir, `${id}.json`);

  try {
    await ensureDataDirectory();
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Counter agent not found' }, { status: 404 });
    }
    console.error(`Error reading counter agent data for ID ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT request handler (for updating or creating data)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Agent ID is required for PUT' }, { status: 400 });
  }
  const filePath = path.join(dataDir, `${id}.json`);

  try {
    await ensureDataDirectory();
    const updatedData: CounterAgent = await request.json();
    
    // Ensure the ID in the body matches the ID in the path, or set it if not present
    if (!updatedData.id || updatedData.id !== id) {
        updatedData.id = id;
    }

    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
    invalidateCounterAgentsCache();
    return NextResponse.json({ message: 'Data updated successfully', agent: updatedData });
  } catch (error) {
    console.error(`Error writing counter agent data for ID ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE request handler
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Agent ID is required for DELETE' }, { status: 400 });
  }
  const filePath = path.join(dataDir, `${id}.json`);

  try {
    await ensureDataDirectory();
    await fs.unlink(filePath);
    invalidateCounterAgentsCache();
    return NextResponse.json({ message: 'Counter agent deleted successfully' });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Counter agent not found' }, { status: 404 });
    }
    console.error(`Error deleting counter agent data for ID ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
