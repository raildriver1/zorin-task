
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/layout/PageHeader';
import { PlusCircle, Edit, ShoppingCart, TrendingUp, Scale, Droplets } from 'lucide-react';
import type { Expense, WashEvent } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DeleteConfirmationButton } from '@/components/common/DeleteConfirmationButton';
import { getExpensesData, getWashEventsData, getInventory } from '@/lib/data-loader';

export default async function ExpensesPage() {
  let expenses: Expense[] = [];
  let washEvents: WashEvent[] = [];
  let inventory: { chemicalStockGrams: number } = { chemicalStockGrams: 0 };
  let fetchError: string | null = null;

  try {
    [expenses, washEvents, inventory] = await Promise.all([
        getExpensesData(),
        getWashEventsData(),
        getInventory(),
    ]);
  } catch (error: any)
 {
    fetchError = error.message || "Не удалось загрузить финансовые данные.";
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalRevenue = washEvents.reduce((sum, event) => sum + (event.netAmount ?? event.totalAmount), 0);
  const profit = totalRevenue - totalExpenses;


  return (
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title="Расходы и рентабельность"
        description="Управляйте операционными расходами и отслеживайте общую прибыльность."
        actions={
          <Button asChild>
            <Link href="/expenses/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Добавить расход
            </Link>
          </Button>
        }
      />
       {fetchError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ошибка загрузки</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {/* Profitability Dashboard */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
        <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
                <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-headline text-green-600">
                    {totalRevenue.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                </div>
                <p className="text-xs text-muted-foreground">За все время (за вычетом комиссий)</p>
            </CardContent>
        </Card>
        <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего расходов</CardTitle>
                <ShoppingCart className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-headline text-destructive">
                    {totalExpenses.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                </div>
                 <p className="text-xs text-muted-foreground">За все время</p>
            </CardContent>
        </Card>
         <Card className="shadow-md bg-accent/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Прибыль</CardTitle>
                <Scale className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold font-headline ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {profit.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                </div>
                 <p className="text-xs text-muted-foreground">Выручка - Расходы</p>
            </CardContent>
        </Card>
        <Card className="shadow-md bg-sky-50 border-sky-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-sky-800">Остаток химии на складе</CardTitle>
                <Droplets className="h-5 w-5 text-sky-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-headline text-sky-700">
                    {(inventory.chemicalStockGrams / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} кг
                </div>
                 <p className="text-xs text-muted-foreground">На основе занесенных закупок</p>
            </CardContent>
        </Card>
      </div>


      <Card className="shadow-md">
        <CardHeader>
            <CardTitle>Журнал расходов</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Дата</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Детали</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead className="text-right w-[120px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!fetchError && expenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      {format(new Date(expense.date), 'dd.MM.yyyy', { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{expense.description}</p>
                      <Badge variant="outline" className="mt-1">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {expense.quantity && expense.pricePerUnit ? (
                        <span>{expense.quantity} {expense.unit || 'шт.'} × {expense.pricePerUnit.toLocaleString('ru-RU')} руб.</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      - {expense.amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="mr-1 text-muted-foreground hover:text-primary transition-colors">
                        <Link href={`/expenses/${expense.id}/edit`} aria-label={`Редактировать ${expense.description}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteConfirmationButton
                        apiPath="/api/expenses"
                        entityId={expense.id}
                        entityName={`расход "${expense.description}"`}
                        toastTitle="Расход удален"
                        toastDescription={`Запись о расходе "${expense.description}" успешно удалена.`}
                        description={
                          <>
                            Вы собираетесь безвозвратно удалить запись о расходе <strong className="text-foreground">{expense.description}</strong> на сумму {expense.amount} руб.
                            Это действие нельзя отменить.
                          </>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!fetchError && expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-16">
                      <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      Записей о расходах нет.
                      <Button variant="link" asChild className="mt-2">
                        <Link href="/expenses/new">Добавьте первую запись</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
