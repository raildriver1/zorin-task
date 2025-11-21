
import { NextResponse } from 'next/server';
import { getCounterAgentsData } from '@/lib/data-loader';

export async function GET() {
  try {
    const agents = await getCounterAgentsData();
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error reading counter agents directory:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
