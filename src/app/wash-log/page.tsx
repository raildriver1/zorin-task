import "@/styles/wash-log.css";
import { TodaySummary } from './components/TodaySummary';

export default function WashLogPage() {
  return (
    <div className="wash-log">
      <TodaySummary reportData={[]} />

      <div className="search-section">
        <input
          type="text"
          placeholder="Поиск по гос. номеру или клиенту..."
          className="search-input"
        />
      </div>

      <div className="table-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="w-[110px]">Дата</th>
                <th>Клиент / Машина</th>
                <th>Услуги</th>
                <th>Исполнители</th>
                <th className="text-right">Сумма</th>
                <th className="text-right w-[120px]">Действия</th>
              </tr>
            </thead>
            <tbody>
              {/* Empty state for now */}
            </tbody>
          </table>
        </div>

        <div className="empty-state">
          <div className="empty-icon">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="empty-title">Журнал моек пуст</h3>
          <p className="empty-subtitle">Зарегистрируйте первую мойку на рабочей станции</p>
        </div>
      </div>
    </div>
  );
}