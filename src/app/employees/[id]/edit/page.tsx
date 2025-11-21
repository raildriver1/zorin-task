
export const dynamic = 'force-dynamic';

import PageHeader from '@/components/layout/PageHeader';
import { EmployeeForm } from '../../components/EmployeeForm';
import type { Employee } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

async function getEmployeeById(id: string): Promise<Employee | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/employees/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch employee with ID ${id}: ${res.statusText}`);
  }
  try {
    return await res.json();
  } catch (e) {
    console.error("Failed to parse employee JSON:", e);
    throw new Error(`Failed to parse employee data for ID ${id}`);
  }
}

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const employeeId = params.id;
  let employee: Employee | null = null;
  let fetchError: string | null = null;

  try {
    employee = await getEmployeeById(employeeId);
  } catch (error: any) {
    fetchError = error.message || `Не удалось загрузить данные для сотрудника с ID ${employeeId}.`;
  }

  if (fetchError) {
     return (
      <div className="container mx-auto py-8">
        <PageHeader title="Редактировать сотрудника" description="Ошибка загрузки данных." />
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ошибка Загрузки</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader title="Редактировать сотрудника" description="Ошибка загрузки данных." />
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Сотрудник не найден</AlertTitle>
          <AlertDescription>
            Сотрудник с ID "{employeeId}" не найден. Возможно, он был удален или ID указан неверно.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title={`Редактировать сотрудника`}
        description={`Обновление данных для ${employee.fullName}.`}
      />
      <EmployeeForm initialData={employee} employeeId={employeeId} />
    </div>
  );
}
