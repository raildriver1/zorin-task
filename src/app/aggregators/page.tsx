
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/layout/PageHeader';
import { PlusCircle, Edit, Star, Briefcase, WalletCards, Scale } from 'lucide-react';
import type { Aggregator, NamedPriceList } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationButton } from '@/components/common/DeleteConfirmationButton';
import { getAggregatorsData } from '@/lib/data-loader';
import { CompanyDetails } from '@/components/common/CompanyDetails';


export default async function AggregatorsPage() {
  let aggregators: Aggregator[] = [];
  let fetchError: string | null = null;

  try {
    aggregators = await getAggregatorsData();
  } catch (error: any) {
    fetchError = error.message || "Не удалось загрузить список агрегаторов.";
  }
  
  const getActivePriceList = (aggregator: Aggregator): NamedPriceList | null => {
    if (!aggregator.priceLists || aggregator.priceLists.length === 0) return null;
    return aggregator.priceLists.find(pl => pl.name === aggregator.activePriceListName) || aggregator.priceLists[0];
  }
  
  return (
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title="Агрегаторы"
        description="Управляйте вашими партнерствами с агрегаторами и их ценами."
        actions={
          <Button asChild>
            <Link href="/aggregators/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Добавить нового агрегатора
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
                  <TableHead className="w-[450px]">Название агрегатора / Реквизиты</TableHead>
                  <TableHead className="text-center">Кол-во машин</TableHead>
                  <TableHead>Прайс-листы</TableHead>
                  <TableHead className="text-center">Баланс</TableHead>
                  <TableHead className="text-right w-[120px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!fetchError && aggregators.map((aggregator) => {
                  const activePriceList = getActivePriceList(aggregator);
                  return (
                  <TableRow key={aggregator.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium align-top pt-4">
                      <p className="font-semibold text-base mb-1 text-primary">{aggregator.name}</p>
                      <CompanyDetails companies={aggregator.companies || []} parentId={aggregator.id} />
                    </TableCell>
                    <TableCell className="text-center align-top pt-4">{aggregator.cars.length}</TableCell>
                    <TableCell className="align-top pt-4">
                      {aggregator.priceLists && aggregator.priceLists.length > 0 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="link" className="p-0 h-auto text-base flex flex-col items-start">
                              <span>{aggregator.priceLists.length} прайс-листов</span>
                              {activePriceList && <Badge variant="secondary" className="mt-1 font-normal"><Star className="h-3 w-3 mr-1 text-yellow-500"/>Активен: {activePriceList.name} ({activePriceList.services.length} услуг)</Badge>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[28rem] p-0">
                             <Tabs defaultValue={activePriceList?.name || aggregator.priceLists[0]?.name} className="w-full">
                               <TabsList className="grid w-full grid-cols-2">
                                 {aggregator.priceLists.map(pl => (
                                   <TabsTrigger key={pl.name} value={pl.name}>{pl.name}</TabsTrigger>
                                 ))}
                               </TabsList>
                               {aggregator.priceLists.map(pl => (
                                <TabsContent key={pl.name} value={pl.name} className="p-4">
                                  <h4 className="font-medium leading-none mb-2">Прайс-лист "{pl.name}"</h4>
                                  <ScrollArea className="h-80">
                                    <div className="text-sm text-muted-foreground pr-3">
                                        {pl.services.map(p => (
                                            <div key={p.serviceName} className="flex justify-between items-start border-b last:border-b-0 py-1.5 gap-2">
                                                <span className="flex-1">{p.serviceName}</span>
                                                <span className="font-semibold whitespace-nowrap">{p.price} руб.</span>
                                            </div>
                                        ))}
                                        {pl.services.length === 0 && <p className="text-center py-4 italic">В этом прайс-листе нет услуг.</p>}
                                    </div>
                                  </ScrollArea>
                                </TabsContent>
                               ))}
                            </Tabs>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-muted-foreground">Прайс-листы не заданы</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center align-top pt-4 font-semibold">
                      <div className={`flex items-center justify-center gap-2 ${(aggregator.balance ?? 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                        <Scale className="h-4 w-4"/>
                        <span>{(aggregator.balance ?? 0).toLocaleString('ru-RU')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top pt-4">
                      <Button variant="ghost" size="icon" asChild className="mr-1 text-muted-foreground hover:text-primary transition-colors">
                        <Link href={`/aggregators/${aggregator.id}/finance`} aria-label={`Финансы ${aggregator.name}`}>
                          <WalletCards className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild className="mr-1 text-muted-foreground hover:text-primary transition-colors">
                        <Link href={`/aggregators/${aggregator.id}/edit`} aria-label={`Редактировать ${aggregator.name}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteConfirmationButton
                        apiPath="/api/aggregators"
                        entityId={aggregator.id}
                        entityName={aggregator.name}
                        toastTitle="Агрегатор удален"
                        toastDescription={`Агрегатор "${aggregator.name}" успешно удален.`}
                        description={
                          <>
                            Вы собираетесь безвозвратно удалить агрегатора <strong className="text-foreground">{aggregator.name}</strong>.
                            Это действие нельзя отменить.
                          </>
                        }
                      />
                    </TableCell>
                  </TableRow>
                )})}
                {!fetchError && aggregators.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-16">
                      <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      Агрегаторы не найдены.
                      <Button variant="link" asChild className="mt-2">
                        <Link href="/aggregators/new">Добавьте своего первого агрегатора</Link>
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
