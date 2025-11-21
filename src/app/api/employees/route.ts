
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Employee } from '@/types';
import { getEmployeesData, invalidateEmployeesCache } from '@/lib/data-loader';

const dataDir = path.join(process.cwd(), 'data', 'employees');

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
    const employees = await getEmployeesData();
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error reading employees directory:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDataDirectory();
    const newEmployee: Employee = await request.json();
    if (!newEmployee.id) {
       return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }
    const filePath = path.join(dataDir, `${newEmployee.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(newEmployee, null, 2), 'utf-8');
    invalidateEmployeesCache();
    return NextResponse.json({ message: 'Employee created successfully', employee: newEmployee }, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
