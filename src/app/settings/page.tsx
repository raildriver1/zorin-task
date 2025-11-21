
import PageHeader from '@/components/layout/PageHeader';
import { RetailPriceListForm } from './components/RetailPriceListForm';
import { getWashEventsData, getEmployeesData } from '@/lib/data-loader';
import type { WashEvent, Employee } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title="Настройки 'Наличка'"
        description="Управляйте розничным прайс-листом для клиентов, оплачивающих наличными или картой."
      />
      {error && (
         <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ошибка Загрузки</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <RetailPriceListForm allWashEvents={washEvents} allEmployees={employees} />
    </div>
  );
}
