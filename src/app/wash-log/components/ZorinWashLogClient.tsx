"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { WashEvent, Employee, SalaryScheme, WashComment } from '@/types';
import { format, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DeleteConfirmationButton } from '@/components/common/DeleteConfirmationButton';
import { Pagination } from '@/components/common/Pagination';
import { normalizeLicensePlate } from '@/lib/utils';
import { EditConsumptionDialog } from './EditConsumptionDialog';
import { CommentDialog } from '@/components/common/CommentDialog';
import {
  BookCheck,
  Briefcase,
  Users,
  DollarSign,
  Edit,
  Wand,
  Car,
  CreditCard,
  Landmark,
  History,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZorinWashLogClientProps {
  washEvents: WashEvent[];
  employees: Employee[];
  query: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

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
};

export function ZorinWashLogClient({
  washEvents,
  employees,
  query,
  currentPage,
  totalPages,
  onPageChange
}: ZorinWashLogClientProps) {
  const employeeMap = new Map(employees.map(e => [e.id, e.fullName]));

  const paginatedEvents = washEvents;

  return (
    <div className="zorin-wash-log">
      {/* Search Section */}
      <div className="zorin-search-section">
        <input
          type="text"
          placeholder="Поиск по гос. номеру или клиенту..."
          className="zorin-search-input"
          defaultValue={query}
        />
      </div>

      {/* Main Table */}
      <div className="zorin-table-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="zorin-table-header">
                <th className="w-[110px]">Дата</th>
                <th>Клиент / Машина</th>
                <th>Услуги</th>
                <th>Исполнители</th>
                <th className="text-right">Сумма</th>
                <th className="text-right w-[120px]">Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.map((event) => {
                const formattedDate = format(new Date(event.timestamp), 'dd.MM.yyyy HH:mm', { locale: ru });
                const clientName = event.sourceName ? event.sourceName : paymentMethodTranslations[event.paymentMethod];
                const lastEdit = event.editHistory && event.editHistory.length > 0 ? event.editHistory[event.editHistory.length - 1] : null;

                return (
                  <tr key={event.id} className="zorin-table-row">
                    {/* Date Cell */}
                    <td className="zorin-table-cell zorin-date-cell">
                      <div className="flex items-start gap-1.5">
                        {lastEdit && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="zorin-date-icon history">
                                  <History className="h-3 w-3" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="zorin-tooltip">
                                <p>Запись была изменена {event.editHistory?.length} раз(а).</p>
                                <p>Последнее изменение: {format(new Date(lastEdit.editedAt), 'dd.MM.yy HH:mm')}
                                   ({employeeMap.get(lastEdit.editedBy) || 'Неизвестно'})
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <div>
                          <div className="zorin-date-main">
                            {format(new Date(event.timestamp), 'dd.MM.yyyy', { locale: ru })}
                          </div>
                          <div className="zorin-date-time">
                            {format(new Date(event.timestamp), 'HH:mm', { locale: ru })}
                          </div>
                        </div>
                        <div className="zorin-date-icons">
                          {(event.driverComments && event.driverComments.length > 0) && (
                            <CommentDialog
                              event={event}
                              employeeMap={employeeMap}
                              trigger={
                                <div className="zorin-date-icon comment">
                                  <MessageSquare className="h-3 w-3" />
                                </div>
                              }
                            />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Client/Vehicle Cell */}
                    <td className="zorin-table-cell zorin-client-cell">
                      <div className="zorin-vehicle-number">
                        <Car className="zorin-vehicle-icon" />
                        <span className="font-mono">{event.vehicleNumber}</span>
                      </div>
                      <div className="zorin-client-info">
                        <ClientTypeIcon method={event.paymentMethod} />
                        <span>{clientName}</span>
                      </div>
                    </td>

                    {/* Services Cell */}
                    <td className="zorin-table-cell zorin-services-cell">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="zorin-main-service">
                              <span className="truncate">{event.services.main.serviceName}</span>
                              {event.services.main.isCustom && (
                                <div className="zorin-custom-badge">
                                  <Wand className="h-3 w-3 mr-1" />
                                  Новая
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="zorin-tooltip">
                            <p>{event.services.main.serviceName}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {event.services.additional.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="zorin-additional-services">
                                <div className="zorin-additional-badge">
                                  +{event.services.additional.length} доп. услуг(и)
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="zorin-popover">
                              <div className="zorin-popover-content">
                                <p className="zorin-popover-title">Дополнительные услуги:</p>
                                <ul className="zorin-popover-list">
                                  {event.services.additional.map((s, i) => (
                                    <li key={i} className="zorin-popover-item">
                                      <span>{s.serviceName}</span>
                                      {s.isCustom && (
                                        <div className="zorin-custom-badge">
                                          <Wand className="h-3 w-3 mr-1" />
                                          Новая
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </td>

                    {/* Employees Cell */}
                    <td className="zorin-table-cell zorin-employees-cell">
                      <div className="zorin-employee-badges">
                        {event.employeeIds.map(id => (
                          <span key={id} className="zorin-employee-badge">
                            {employeeMap.get(id)?.split(' ')[0] || 'Неизв.'}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Amount Cell */}
                    <td className="zorin-table-cell zorin-amount-cell">
                      {event.totalAmount.toLocaleString('ru-RU')} руб.
                    </td>

                    {/* Actions Cell */}
                    <td className="zorin-table-cell zorin-actions-cell">
                      <div className="zorin-action-buttons">
                        <EditConsumptionDialog event={event} employees={employees.filter(e => event.employeeIds.includes(e.id))} />
                        <Button variant="ghost" size="icon" asChild className="zorin-action-btn edit">
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedEvents.length === 0 && (
          <div className="zorin-empty-state">
            <div className="zorin-empty-icon">
              <BookCheck size={40} />
            </div>
            <h3 className="zorin-empty-title">
              {query ? `По запросу "${query}" ничего не найдено.` : 'Журнал моек пуст.'}
            </h3>
            <p className="zorin-empty-subtitle">
              {query ? 'Попробуйте другой поисковый запрос.' : 'Зарегистрируйте первую мойку на рабочей станции.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="zorin-pagination">
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        )}
      </div>
    </div>
  );
}