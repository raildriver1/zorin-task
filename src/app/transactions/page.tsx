
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/layout/PageHeader';
import { PlusCircle, Edit, DollarSign, CreditCard, Landmark, ListChecks, Car, Users } from 'lucide-react';
import type { WashEvent, PaymentType, Employee } from '@/types';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getWashEventsData, getEmployeesData } from '@/lib/data-loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { DeleteConfirmationButton } from '@/components/common/DeleteConfirmationButton';


const PaymentTypeIcon = ({ type }: { type: PaymentType }) => {
  switch (type) {
    case 'cash': return <DollarSign className="h-4 w-4 mr-1.5 text-green-600" />;
    case 'card': return <CreditCard className="h-4 w-4 mr-1.5 text-blue-600" />;
    case 'transfer': return <Landmark className="h-4 w-4 mr-1.5 text-purple-600" />;
    default: return null;
  }
};

const paymentTypeTranslations: Record<PaymentType, string> = {
  cash: 'Наличные',
  card: 'Карта',
  transfer: 'Перевод',
};


export default async function TransactionsPage() {
  let retailWashEvents: WashEvent[] = [];
  let employees: Employee[] = [];
  let fetchError: string | null = null;
  
  try {
    const [allWashEvents, allEmployees] = await Promise.all([
      getWashEventsData(),
      getEmployeesData()
    ]);
    retailWashEvents = allWashEvents.filter(event => 
      event.paymentMethod === 'cash' || event.paymentMethod === 'card' || event.paymentMethod === 'transfer'
    );
    employees = allEmployees;
  } catch (error: any) {
    fetchError = error.message || "Не удалось загрузить список транзакций.";
  }
  
  const employeeMap = new Map(employees.map(e => [e.id, e.fullName]));

  return (
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title="Розничные транзакции"
        description="Отслеживайте платежи от прямых клиентов (наличные, карта, перевод)."
      />
       {fetchError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ошибка загрузки</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}
      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Дата</TableHead>
                  <TableHead>Гос. номер</TableHead>
                  <TableHead>Тип оплаты</TableHead>
                  <TableHead>Исполнители</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead className="text-right w-[120px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!fetchError && retailWashEvents.map((transaction) => {
                    const formattedDate = format(new Date(transaction.timestamp), 'dd.MM.yyyy HH:mm', { locale: ru });
                    return (
                    <TableRow key={transaction.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell className="font-mono">{transaction.vehicleNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center w-fit text-sm py-1 px-2.5">
                            <PaymentTypeIcon type={transaction.paymentMethod as PaymentType} />
                            {paymentTypeTranslations[transaction.paymentMethod as PaymentType]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                            {transaction.employeeIds.map(id => (
                                <Badge key={id} variant="secondary" className="mr-1 mb-1">{employeeMap.get(id)?.split(' ')[0] || 'Неизв.'}</Badge>
                            ))}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{transaction.totalAmount.toFixed(2)} руб.</TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild className="mr-1 text-muted-foreground hover:text-primary transition-colors">
                            <Link href={`/wash-log/${transaction.id}/edit`} aria-label={`Редактировать мойку ${transaction.id}`}>
                            <Edit className="h-4 w-4" />
                            </Link>
                        </Button>
                        <DeleteConfirmationButton
                          apiPath="/api/wash-events"
                          entityId={transaction.id}
                          entityName={`${transaction.vehicleNumber} от ${formattedDate}`}
                          toastTitle="Транзакция удалена"
                          toastDescription={`Транзакция для машины ${transaction.vehicleNumber} от ${formattedDate} успешно удалена.`}
                          description={
                            <>
                              Вы собираетесь безвозвратно удалить транзакцию для машины <strong className="font-mono text-foreground">{transaction.vehicleNumber}</strong> от <strong className="text-foreground">{formattedDate}</strong>.
                              Это действие нельзя отменить.
                            </>
                          }
                        />
                        </TableCell>
                    </TableRow>
                    );
                })}
                {!fetchError && retailWashEvents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                      <ListChecks className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      Транзакции не найдены.
                       <p className="text-sm mt-2">Зарегистрируйте розничную мойку на рабочей станции, и она появится здесь.</p>
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
