
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/layout/PageHeader';
import { PlusCircle, Edit, UserCog, Check, XIcon, Wallet, WalletCards } from 'lucide-react';
import type { Employee, SalaryScheme } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationButton } from '@/components/common/DeleteConfirmationButton';
import { getEmployeesData, getSalarySchemesData } from '@/lib/data-loader';


export default async function EmployeesPage() {
  let employees: Employee[] = [];
  let salarySchemes: SalaryScheme[] = [];
  let fetchError: string | null = null;

  try {
    [employees, salarySchemes] = await Promise.all([
        getEmployeesData(),
        getSalarySchemesData()
    ]);
  } catch (error: any) {
    fetchError = error.message || "Не удалось загрузить список сотрудников.";
  }

  const schemeMap = new Map(salarySchemes.map(scheme => [scheme.id, scheme.name]));

  return (
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title="Сотрудники"
        description="Управляйте информацией о ваших сотрудниках и их доступом."
        actions={
          <Button asChild>
            <Link href="/employees/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Добавить сотрудника
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
      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Логин</TableHead>
                  <TableHead>Схема зарплаты</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Платежные реквизиты</TableHead>
                  <TableHead className="text-center">Есть машина</TableHead>
                  <TableHead className="text-right w-[120px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!fetchError && employees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-primary">{employee.fullName}</TableCell>
                    <TableCell>{employee.username || '-'}</TableCell>
                    <TableCell>
                      {employee.salarySchemeId ? (
                        <Badge variant="outline" className="flex items-center w-fit">
                           <Wallet className="h-3 w-3 mr-1.5" />
                           {schemeMap.get(employee.salarySchemeId) || 'Неизвестная схема'}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{employee.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{employee.paymentDetails}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={employee.hasCar ? "secondary" : "outline"} className={employee.hasCar ? "border-green-400" : ""}>
                        {employee.hasCar ? <Check className="h-4 w-4 text-green-600" /> : <XIcon className="h-4 w-4 text-destructive" />}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" asChild className="mr-1 text-muted-foreground hover:text-primary transition-colors">
                        <Link href={`/employees/${employee.id}/finance`} aria-label={`Финансы ${employee.fullName}`}>
                          <WalletCards className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild className="mr-1 text-muted-foreground hover:text-primary transition-colors">
                        <Link href={`/employees/${employee.id}/edit`} aria-label={`Редактировать ${employee.fullName}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteConfirmationButton
                        apiPath="/api/employees"
                        entityId={employee.id}
                        entityName={employee.fullName}
                        toastTitle="Сотрудник удален"
                        toastDescription={`Сотрудник "${employee.fullName}" успешно удален.`}
                        description={
                          <>
                            Вы собираетесь безвозвратно удалить сотрудника <strong className="text-foreground">{employee.fullName}</strong>.
                            Это действие нельзя отменить.
                          </>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!fetchError && employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                      <UserCog className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      Сотрудники не найдены.
                      <Button variant="link" asChild className="mt-2">
                        <Link href="/employees/new">Добавьте своего первого сотрудника</Link>
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
