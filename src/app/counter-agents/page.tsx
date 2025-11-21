
export const dynamic = 'force-dynamic'; // Ensures the page is dynamically rendered

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/layout/PageHeader';
import { PlusCircle, Edit, Users, ListChecks, Cog, Scale, WalletCards } from 'lucide-react';
import type { CounterAgent } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { DeleteConfirmationButton } from '@/components/common/DeleteConfirmationButton';
import { getCounterAgentsData } from '@/lib/data-loader';
import { CompanyDetails } from '@/components/common/CompanyDetails';


export default async function CounterAgentsPage() {
  let counterAgents: CounterAgent[] = [];
  let fetchError: string | null = null;

  try {
    counterAgents = await getCounterAgentsData();
  } catch (error: any) {
    fetchError = error.message || "Не удалось загрузить список контрагентов.";
  }

  return (
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title="Контрагенты"
        description="Управляйте вашими корпоративными клиентами, их автопарками и индивидуальными прайс-листами."
        actions={
          <Button asChild>
            <Link href="/counter-agents/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Добавить нового агента
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
                  <TableHead className="w-[250px] min-w-[200px]">Имя агента</TableHead>
                  <TableHead className="min-w-[400px]">Компании / Реквизиты</TableHead>
                  <TableHead className="text-center">Машин</TableHead>
                  <TableHead className="text-center">Услуг в прайсе</TableHead>
                  <TableHead className="text-center">Баланс</TableHead>
                  <TableHead className="text-right w-[120px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!fetchError && counterAgents.map((agent) => (
                  <TableRow key={agent.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-primary align-top pt-4">{agent.name}</TableCell>
                    <TableCell className="align-top pt-4 text-xs">
                      <CompanyDetails companies={agent.companies} parentId={agent.id} />
                      
                       {(agent.additionalPriceList && agent.additionalPriceList.length > 0) || (agent.allowCustomServices !== undefined) ? (
                            <>
                                <Separator className="my-2" />
                                <div className="space-y-1 pt-1">
                                    <div className="flex items-center gap-2">
                                        <Cog className="h-3 w-3" />
                                        <span className="font-medium text-foreground/80">Произвольные доп. услуги:</span>
                                        <Badge variant={(agent.allowCustomServices === undefined || agent.allowCustomServices === true) ? "secondary" : "outline"} className={(agent.allowCustomServices === undefined || agent.allowCustomServices === true) ? 'border-green-400' : 'border-red-400'}>
                                            {(agent.allowCustomServices === undefined || agent.allowCustomServices === true) ? "Разрешены" : "Запрещены"}
                                        </Badge>
                                    </div>
                                    {agent.additionalPriceList && agent.additionalPriceList.length > 0 && (
                                        <div>
                                            <p className="font-medium text-foreground/80 mt-1">Предустановленные доп. услуги:</p>
                                            <ul className="list-disc pl-5 text-muted-foreground">
                                                {agent.additionalPriceList.map(item => (
                                                    <li key={item.serviceName}>{item.serviceName} ({item.price} руб.)</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}

                    </TableCell>
                    <TableCell className="text-center align-top pt-4">{agent.cars.length}</TableCell>
                    <TableCell className="text-center align-top pt-4">
                      {agent.priceList && agent.priceList.length > 0 ? (
                        <Badge variant="secondary" className="gap-1">
                          <ListChecks className="h-3 w-3" />
                          {agent.priceList.length}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                     <TableCell className="text-center align-top pt-4 font-semibold">
                      <div className={`flex items-center justify-center gap-2 ${(agent.balance ?? 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                        <Scale className="h-4 w-4"/>
                        <span>{(agent.balance ?? 0).toLocaleString('ru-RU')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top pt-4">
                      <Button variant="ghost" size="icon" asChild className="mr-1 text-muted-foreground hover:text-primary transition-colors">
                        <Link href={`/counter-agents/${agent.id}/finance`} aria-label={`Финансы ${agent.name}`}>
                          <WalletCards className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild className="mr-1 text-muted-foreground hover:text-primary transition-colors">
                        <Link href={`/counter-agents/${agent.id}/edit`} aria-label={`Редактировать ${agent.name}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteConfirmationButton
                        apiPath="/api/counter-agents"
                        entityId={agent.id}
                        entityName={agent.name}
                        toastTitle="Контрагент удален"
                        toastDescription={`Контрагент "${agent.name}" успешно удален.`}
                        description={
                          <>
                            Вы собираетесь безвозвратно удалить контрагента <strong className="text-foreground">{agent.name}</strong>.
                            Это действие нельзя отменить.
                          </>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!fetchError && counterAgents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      Контрагенты не найдены.
                      <Button variant="link" asChild className="mt-2">
                        <Link href="/counter-agents/new">Добавьте своего первого агента</Link>
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
