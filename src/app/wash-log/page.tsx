



export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/layout/PageHeader';
import { BookCheck, Briefcase, Users, DollarSign, Edit, Wand, Car, CreditCard, Landmark, History, Droplets, MessageSquare } from 'lucide-react';
import type { WashEvent, Employee, SalaryScheme, WashComment } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DeleteConfirmationButton } from '@/components/common/DeleteConfirmationButton';
import { getWashEventsData, getEmployeesData, getSalarySchemesData, invalidateWashEventsCache } from '@/lib/data-loader';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';
import { normalizeLicensePlate } from '@/lib/utils';
import { TodaySummary } from './components/TodaySummary';
import { generateSalaryReport } from '@/services/salary-calculator';
import { EditConsumptionDialog } from './components/EditConsumptionDialog';
import { CommentDialog } from '@/components/common/CommentDialog';
import { revalidatePath } from 'next/cache';

const paymentMethodTranslations: Record<WashEvent['paymentMethod'], string> = {
  cash: 'Наличные',
  card: 'Карта',
  transfer: 'Перевод',
  aggregator: 'Агрегатор',
  counterAgentContract: 'Контрагент',
};

const ClientTypeIcon = ({ method }: { method: WashEvent['paymentMethod'] }) => {
    switch(method) {
        case 'cash': return <DollarSign className="h-4 w-4 text-green-500" />;
        case 'card': return <CreditCard className="h-4 w-4 text-blue-500" />;
        case 'transfer': return <Landmark className="h-4 w-4 text-purple-500" />;
        case 'aggregator': return <Briefcase className="h-4 w-4 text-indigo-500" />;
        case 'counterAgentContract': return <Users className="h-4 w-4 text-orange-500" />;
        default: return <DollarSign className="h-4 w-4" />;
    }
}

async function handleCommentUpdate(eventId: string, newComments: WashComment[]): Promise<void> {
    'use server';
    const url = new URL(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/wash-events/${eventId}`);
    
    try {
        const fetchRes = await fetch(url, { cache: 'no-store' });
        if (!fetchRes.ok) throw new Error("Failed to fetch event data before update.");
        const eventToUpdate: WashEvent = await fetchRes.json();
        
        const updatedEvent = { ...eventToUpdate, driverComments: newComments };
        
        const updateRes = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEvent),
        });

        if (!updateRes.ok) throw new Error("Failed to save comment.");

        revalidatePath('/wash-log');
        invalidateWashEventsCache();
        
    } catch(e) {
        console.error("Server Action Error (handleCommentUpdate):", e);
        throw e;
    }
}


const ITEMS_PER_PAGE = 10;

export default async function WashLogPage({
  searchParams,
}: {
  searchParams?: { query?: string; page?: string };
}) {
  let allWashEvents: WashEvent[] = [];
  let employees: Employee[] = [];
  let salarySchemes: SalaryScheme[] = [];
  let fetchError: string | null = null;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  try {
    [allWashEvents, employees, salarySchemes] = await Promise.all([
        getWashEventsData(), 
        getEmployeesData(),
        getSalarySchemesData()
    ]);
  } catch (error: any) {
    fetchError = error.message || "Не удалось загрузить журнал моек.";
  }

  const employeeMap = new Map(employees.map(e => [e.id, e.fullName]));
  
  const filteredEvents = allWashEvents.filter(event => {
    const normalizedQuery = normalizeLicensePlate(query);
    const normalizedVehicleNumber = normalizeLicensePlate(event.vehicleNumber);
    const clientName = (event.sourceName || paymentMethodTranslations[event.paymentMethod]).toLowerCase();

    return normalizedVehicleNumber.includes(normalizedQuery) || clientName.includes(query.toLowerCase());
  });
  
  // Calculate today's summary
  const todayEvents = allWashEvents.filter(event => isToday(new Date(event.timestamp)));
  const todayEmployeeIds = [...new Set(todayEvents.flatMap(e => e.employeeIds))];
  const todayEmployees = employees.filter(e => todayEmployeeIds.includes(e.id));
  const todaySalaryReport = await generateSalaryReport(todayEvents, todayEmployees, salarySchemes);


  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


  return (
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title="Журнал моек"
        description="История всех зарегистрированных на рабочей станции моек."
      />
      
      <TodaySummary reportData={todaySalaryReport} />

      <div className="mb-4">
        <SearchInput placeholder="Поиск по гос. номеру или клиенту..." />
      </div>
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
                  <TableHead className="w-[110px]">Дата</TableHead>
                  <TableHead>Клиент / Машина</TableHead>
                  <TableHead>Услуги</TableHead>
                  <TableHead>Исполнители</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead className="text-right w-[120px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!fetchError && paginatedEvents.map((event) => {
                  const formattedDate = format(new Date(event.timestamp), 'dd.MM.yyyy HH:mm', { locale: ru });
                  const clientName = event.sourceName ? event.sourceName : paymentMethodTranslations[event.paymentMethod];
                  const lastEdit = event.editHistory && event.editHistory.length > 0 ? event.editHistory[event.editHistory.length - 1] : null;

                  return (
                    <TableRow key={event.id}>
                      <TableCell className="align-top pt-3">
                        <div className="flex items-start gap-1.5">
                           {lastEdit && (
                            <TooltipProvider>
                               <Tooltip>
                                <TooltipTrigger>
                                  <History className="h-4 w-4 text-amber-600 mt-0.5" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Запись была изменена {event.editHistory?.length} раз(а).</p>
                                    <p>Последнее изменение: {format(new Date(lastEdit.editedAt), 'dd.MM.yy HH:mm')}
                                       ({employeeMap.get(lastEdit.editedBy) || 'Неизвестно'})
                                    </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <div>
                            {format(new Date(event.timestamp), 'dd.MM.yyyy', { locale: ru })}
                            <p className="text-sm text-muted-foreground">{format(new Date(event.timestamp), 'HH:mm', { locale: ru })}</p>
                          </div>
                          {(event.driverComments && event.driverComments.length > 0) && (
                                <CommentDialog 
                                    event={event} 
                                    employeeMap={employeeMap} 
                                    onCommentUpdate={handleCommentUpdate}
                                    trigger={
                                        <button className="mt-0.5">
                                             <MessageSquare className="h-4 w-4 text-sky-600" />
                                        </button>
                                    }
                                />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top pt-3">
                        <div className="flex items-center gap-2 font-medium">
                          <Car className="h-4 w-4 text-primary shrink-0"/>
                          <span className="font-mono">{event.vehicleNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <ClientTypeIcon method={event.paymentMethod} />
                          <span>{clientName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top pt-3 max-w-[250px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5">
                                <p className="truncate font-medium">{event.services.main.serviceName}</p>
                                {event.services.main.isCustom && (
                                  <TooltipProvider>
                                      <Tooltip>
                                          <TooltipTrigger>
                                              <Wand className="h-3.5 w-3.5 text-amber-500 cursor-help" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                              <p>Услуга добавлена вручную.</p>
                                          </TooltipContent>
                                      </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent><p>{event.services.main.serviceName}</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                         {event.services.additional.length > 0 && (
                            <Popover>
                            <PopoverTrigger asChild>
                                <Badge variant="secondary" className="mt-1 cursor-pointer">
                                +{event.services.additional.length} доп. услуг(и)
                                </Badge>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="space-y-2">
                                    <p className="font-semibold text-sm">Дополнительные услуги:</p>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                        {event.services.additional.map((s, i) => (
                                        <li key={i} className="flex items-center gap-1.5">
                                            <span>{s.serviceName}</span>
                                            {s.isCustom && (
                                                <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                    <Badge variant="outline" className="text-xs px-1.5 py-0 border-amber-500 text-amber-600 font-normal cursor-help">
                                                        <Wand className="h-3 w-3 mr-1" />
                                                        Новая
                                                    </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                    <p>Услуга добавлена вручную. <br/> Рассмотрите добавление в прайс-лист.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </li>
                                        ))}
                                    </ul>
                                </div>
                            </PopoverContent>
                            </Popover>
                        )}
                      </TableCell>
                      <TableCell className="align-top pt-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {event.employeeIds.map(id => (
                            <Badge key={id} variant="outline">{employeeMap.get(id)?.split(' ')[0] || 'Неизв.'}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right align-top pt-3 font-semibold">
                          {event.totalAmount.toLocaleString('ru-RU')} руб.
                      </TableCell>
                      <TableCell className="text-right align-top pt-3">
                         <EditConsumptionDialog event={event} employees={employees.filter(e => event.employeeIds.includes(e.id))} />
                        <Button variant="ghost" size="icon" asChild className="mr-1 text-muted-foreground hover:text-primary transition-colors">
                          <Link href={`/wash-log/${event.id}/edit`} aria-label={`Редактировать мойку`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteConfirmationButton
                          apiPath="/api/wash-events"
                          entityId={event.id}
                          entityName={`${event.vehicleNumber} от ${formattedDate}`}
                          toastTitle="Запись о мойке удалена"
                          toastDescription={`Запись о мойке для машины ${event.vehicleNumber} от ${formattedDate} успешно удалена.`}
                          description={
                            <>
                              Вы собираетесь безвозвратно удалить запись о мойке для машины <strong className="font-mono text-foreground">{event.vehicleNumber}</strong> от <strong className="text-foreground">{formattedDate}</strong>.
                              Это действие нельзя отменить.
                            </>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )})}
                {!fetchError && paginatedEvents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                      <BookCheck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                       {query ? `По запросу "${query}" ничего не найдено.` : 'Журнал моек пуст.'}
                       <p className="text-sm mt-2">{query ? 'Попробуйте другой поисковый запрос.' : 'Зарегистрируйте первую мойку на рабочей станции.'}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
         {totalPages > 1 && (
            <div className="p-4 border-t">
                <Pagination currentPage={currentPage} totalPages={totalPages} />
            </div>
        )}
      </Card>
    </div>
  );
}
