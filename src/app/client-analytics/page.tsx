
export const dynamic = 'force-dynamic';

import PageHeader from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { getWashEventsData, getAggregatorsData, getCounterAgentsData } from '@/lib/data-loader';
import { ClientAnalyticsDashboard } from './components/ClientAnalyticsDashboard';

async function fetchData() {
    try {
        const [washEvents, aggregators, counterAgents] = await Promise.all([
            getWashEventsData(),
            getAggregatorsData(),
            getCounterAgentsData(),
        ]);
        
        return { washEvents, aggregators, counterAgents, error: null };
    } catch (e: any) {
        console.error("Failed to fetch client analytics data:", e);
        return { error: e.message || "Не удалось загрузить данные.", washEvents: [], aggregators: [], counterAgents: [] };
    }
}

export default async function ClientAnalyticsPage() {
    const { washEvents, aggregators, counterAgents, error } = await fetchData();

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <PageHeader title="Анализ клиентов" description="Ошибка загрузки данных." />
                <Alert variant="destructive" className="max-w-xl mx-auto">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Ошибка Загрузки</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-4 md:py-8">
            <PageHeader
                title="Анализ клиентов"
                description="Сравнивайте эффективность контрагентов, агрегаторов и розничных продаж для принятия бизнес-решений."
            />
            <ClientAnalyticsDashboard 
                washEvents={washEvents}
                aggregators={aggregators}
                counterAgents={counterAgents}
            />
        </div>
    );
}

    