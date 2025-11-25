
import "@/styles/settings.css";
import { RetailPriceListForm } from './components/RetailPriceListForm';
import { getWashEventsData, getEmployeesData } from '@/lib/data-loader';
import type { WashEvent, Employee } from '@/types';
import { AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function fetchData() {
    try {
        const [washEvents, employees]: [WashEvent[], Employee[]] = await Promise.all([
            getWashEventsData(),
            getEmployeesData(),
        ]);
        return { washEvents, employees, error: null };
    } catch (e: any) {
        console.error("Failed to fetch data for settings page:", e);
        return { washEvents: [], employees: [], error: e.message || "Не удалось загрузить данные для анализа услуг." };
    }
}


export default async function SettingsPage() {
  const { washEvents, employees, error } = await fetchData();

  return (
    <div className="settings">
      <div className="page-header-section">
        <div className="page-header-content">
          <div className="page-title-section">
            <h1>Настройки 'Наличка'</h1>
            <p>Управляйте розничным прайс-листом для клиентов, оплачивающих наличными или картой.</p>
          </div>
        </div>
      </div>

      {error && (
         <div className="alert error">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <div className="alert-title">Ошибка Загрузки</div>
            <div className="alert-description">{error}</div>
          </div>
        </div>
      )}

      <div className="price-list-form-card">
        <RetailPriceListForm allWashEvents={washEvents} allEmployees={employees} />
      </div>
    </div>
  );
}
