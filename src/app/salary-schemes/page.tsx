
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/layout/PageHeader';
import { PlusCircle, Edit, Wallet, Percent, ListTodo, Globe } from 'lucide-react';
import type { SalaryScheme, Aggregator, CounterAgent } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationButton } from '@/components/common/DeleteConfirmationButton';
import { getSalarySchemesData, getAggregatorsData, getCounterAgentsData } from '@/lib/data-loader';


export default async function SalarySchemesPage() {
  let schemes: SalaryScheme[] = [];
  let aggregators: Aggregator[] = [];
  let counterAgents: CounterAgent[] = [];
  let fetchError: string | null = null;

  try {
    [schemes, aggregators, counterAgents] = await Promise.all([
      getSalarySchemesData(),
      getAggregatorsData(),
      getCounterAgentsData(),
    ]);
  } catch (error: any) {
    fetchError = error.message || "Не удалось загрузить данные.";
  }

  // Helper function to dynamically find the source name
  const getRateSourceName = (scheme: SalaryScheme): string => {
    const source = scheme.rateSource;
    if (!source) return 'Все прайс-листы (Универсальная)';

    if (source.type === 'retail') {
      return 'Розничный прайс-лист (Наличка)';
    }
    if (source.type === 'counterAgent') {
      const agent = counterAgents.find(a => a.id === source.id);
      return agent?.name || 'Не найден';
    }
    if (source.type === 'aggregator') {
      const aggregator = aggregators.find(a => a.id === source.id);
      if (!aggregator) return 'Не найден';
      return `${aggregator.name} (${source.priceListName || 'Активный'})`;
    }
    return 'Неизвестный источник';
  };


  return (
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title="Схемы зарплат"
        description="Управляйте схемами расчета зарплаты для сотрудников."
        actions={
          <Button asChild>
            <Link href="/salary-schemes/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Создать схему
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
                  <TableHead>Название схемы</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Значение</TableHead>
                  <TableHead className="text-right w-[120px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!fetchError && schemes.map((scheme) => (
                  <TableRow key={scheme.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-primary">{scheme.name}</TableCell>
                    <TableCell>
                       <Badge variant="outline">
                        {scheme.type === 'percentage' ? (
                          <>
                           <Percent className="h-3 w-3 mr-1.5" /> Процент
                          </>
                        ) : (
                          <>
                           <ListTodo className="h-3 w-3 mr-1.5" /> Ставка
                          </>
                        )}
                       </Badge>
                    </TableCell>
                    <TableCell>
                      {scheme.type === 'percentage' 
                        ? `${scheme.percentage}% от выручки ${scheme.fixedDeduction ? `(вычет ${scheme.fixedDeduction} руб.)` : ''}`
                        : (
                            <div className="flex items-center gap-1.5">
                                {!scheme.rateSource && <Globe className="h-4 w-4 text-muted-foreground" />}
                                <span>{`${scheme.rates?.length || 0} услуг по ставке из "${getRateSourceName(scheme)}"`}</span>
                            </div>
                          )
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="mr-1 text-muted-foreground hover:text-primary transition-colors">
                        <Link href={`/salary-schemes/${scheme.id}/edit`} aria-label={`Редактировать ${scheme.name}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteConfirmationButton
                        apiPath="/api/salary-schemes"
                        entityId={scheme.id}
                        entityName={scheme.name}
                        toastTitle="Схема удалена"
                        toastDescription={`Схема "${scheme.name}" успешно удалена.`}
                        description={
                          <>
                            Вы собираетесь безвозвратно удалить схему зарплаты <strong className="text-foreground">{scheme.name}</strong>.
                            Это действие нельзя отменить.
                          </>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!fetchError && schemes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-16">
                      <Wallet className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      Схемы зарплат не найдены.
                      <Button variant="link" asChild className="mt-2">
                        <Link href="/salary-schemes/new">Создайте свою первую схему</Link>
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
