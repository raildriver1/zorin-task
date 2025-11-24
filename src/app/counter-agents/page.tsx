
export const dynamic = 'force-dynamic';

import "@/styles/counter-agents.css";
import Link from 'next/link';
import { PlusCircle, Edit, Users, ListChecks, Cog, Scale, WalletCards, AlertTriangle } from 'lucide-react';
import type { CounterAgent } from '@/types';
import { DeleteConfirmationButton } from '@/components/common/DeleteConfirmationButton';
import { getCounterAgentsData } from '@/lib/data-loader';


export default async function CounterAgentsPage() {
  let counterAgents: CounterAgent[] = [];
  let fetchError: string | null = null;

  try {
    counterAgents = await getCounterAgentsData();
  } catch (error: any) {
    fetchError = error.message || "Не удалось загрузить список контрагентов.";
  }

  return (
    <div className="counter-agents">
      {/* Page Header */}
      <div className="page-header-section">
        <div className="page-header-content">
          <div className="page-title-section">
            <h1>Контрагенты</h1>
            <p>Управляйте вашими корпоративными клиентами, их автопарками и индивидуальными прайс-листами.</p>
          </div>
          <Link href="/counter-agents/new" className="add-agent-btn">
            <PlusCircle className="h-4 w-4" />
            Добавить нового агента
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {fetchError && (
        <div className="alert error">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <div className="alert-title">Ошибка загрузки</div>
            <div className="alert-description">{fetchError}</div>
          </div>
        </div>
      )}

      {/* Agents Table */}
      <div className="agents-table-card">
        <div className="overflow-x-auto">
          <table className="agents-table">
            <thead>
              <tr className="agents-table-header">
                <th className="w-[250px] min-w-[200px]">Имя агента</th>
                <th className="min-w-[400px]">Компании / Реквизиты</th>
                <th className="text-center">Машин</th>
                <th className="text-center">Услуг в прайсе</th>
                <th className="text-center">Баланс</th>
                <th className="text-right w-[120px]">Действия</th>
              </tr>
            </thead>
                        <tbody>
              {!fetchError && counterAgents.map((agent) => (
                <tr key={agent.id} className="agents-table-row">
                  <td className="agents-table-cell align-top">
                    <div className="agent-name">{agent.name}</div>
                  </td>
                  <td className="agents-table-cell align-top">
                    <div className="company-details">
                      {agent.companies.map((company, index) => (
                        <div key={index}>
                          <p><strong>{company.name}</strong></p>
                          {company.address && <p>Адрес: {company.address}</p>}
                          {company.taxNumber && <p>ИНН: {company.taxNumber}</p>}
                          {company.contactPerson && <p>Контакт: {company.contactPerson}</p>}
                          {company.phone && <p>Телефон: {company.phone}</p>}
                          {index < agent.companies.length - 1 && <div className="separator"></div>}
                        </div>
                      ))}
                    </div>

                    {(agent.additionalPriceList && agent.additionalPriceList.length > 0) || (agent.allowCustomServices !== undefined) ? (
                      <div className="settings-section">
                        <div className="settings-title">
                          <Cog className="h-3 w-3" />
                          Произвольные доп. услуги:
                        </div>
                        <div className={`badge ${(agent.allowCustomServices === undefined || agent.allowCustomServices === true) ? 'success' : 'danger'}`}>
                          {(agent.allowCustomServices === undefined || agent.allowCustomServices === true) ? "Разрешены" : "Запрещены"}
                        </div>
                        {agent.additionalPriceList && agent.additionalPriceList.length > 0 && (
                          <ul className="services-list">
                            {agent.additionalPriceList.map(item => (
                              <li key={item.serviceName}>{item.serviceName} ({item.price} руб.)</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </td>
                  <td className="agents-table-cell text-center align-top">
                    <div className="cars-count">{agent.cars.length}</div>
                  </td>
                  <td className="agents-table-cell text-center align-top">
                    {agent.priceList && agent.priceList.length > 0 ? (
                      <div className="services-count">
                        <ListChecks className="h-3 w-3" />
                        {agent.priceList.length}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="agents-table-cell text-center align-top">
                    <div className={`balance-display ${(agent.balance ?? 0) < 0 ? 'negative' : 'positive'}`}>
                      <Scale className="h-4 w-4"/>
                      <span>{(agent.balance ?? 0).toLocaleString('ru-RU')}</span>
                    </div>
                  </td>
                  <td className="agents-table-cell text-right align-top">
                    <div className="action-buttons">
                      <Link href={`/counter-agents/${agent.id}/finance`} className="action-btn" aria-label={`Финансы ${agent.name}`}>
                        <WalletCards className="h-4 w-4" />
                      </Link>
                      <Link href={`/counter-agents/${agent.id}/edit`} className="action-btn" aria-label={`Редактировать ${agent.name}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                      <DeleteConfirmationButton
                        apiPath="/api/counter-agents"
                        entityId={agent.id}
                        entityName={agent.name}
                        toastTitle="Контрагент удален"
                        toastDescription={`Контрагент "${agent.name}" успешно удален.`}
                        description={
                          <>
                            Вы собираетесь безвозвратно удалить контрагента <strong>{agent.name}</strong>.
                            Это действие нельзя отменить.
                          </>
                        }
                        trigger={
                          <button className="action-btn danger" aria-label={`Удалить ${agent.name}`}>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!fetchError && counterAgents.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon">
                        <Users className="h-12 w-12" />
                      </div>
                      <div className="empty-title">Контрагенты не найдены</div>
                      <div className="empty-subtitle">Добавьте своего первого контрагента</div>
                      <Link href="/counter-agents/new" className="empty-action-btn">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Добавить контрагента
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
