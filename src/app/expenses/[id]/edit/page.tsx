
export const dynamic = 'force-dynamic';

import PageHeader from '@/components/layout/PageHeader';
import { ExpenseForm } from '../../components/ExpenseForm';
import type { Expense } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

async function getExpenseById(id: string): Promise<Expense | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/expenses/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch expense with ID ${id}: ${res.statusText}`);
  }
  try {
    return await res.json();
  } catch (e) {
    console.error("Failed to parse expense JSON:", e);
    throw new Error(`Failed to parse expense data for ID ${id}`);
  }
}

export default async function EditExpensePage({ params }: { params: { id: string } }) {
  const expenseId = params.id;
  let expense: Expense | null = null;
  let fetchError: string | null = null;

  try {
    expense = await getExpenseById(expenseId);
  } catch (error: any) {
    fetchError = error.message || `Не удалось загрузить данные для расхода с ID ${expenseId}.`;
  }

  if (fetchError) {
     return (
      <div className="container mx-auto py-8">
        <PageHeader title="Редактировать расход" description="Ошибка загрузки данных." />
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ошибка Загрузки</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader title="Редактировать расход" description="Ошибка загрузки данных." />
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Расход не найден</AlertTitle>
          <AlertDescription>
            Запись о расходе с ID "{expenseId}" не найдена. Возможно, она была удалена.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title={`Редактировать расход`}
        description={`Обновление данных для "${expense.description}".`}
      />
      <ExpenseForm initialData={expense} expenseId={expenseId} />
    </div>
  );
}
