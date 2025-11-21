
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { Employee } from '@/types';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get('employee_auth_sim');

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const employee: Employee = JSON.parse(token.value);
    return NextResponse.json({ employee });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
