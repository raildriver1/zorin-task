
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { getWashEventsData, getAggregatorsData, getCounterAgentsData, getEmployeesData, getExpensesData, getInventory, getAllEmployeeTransactions } from '@/lib/data-loader';
import { DashboardClient } from './components/DashboardClient';

async function fetchData() {
    const [washEvents, aggregators, counterAgents, employees, expenses, inventory, employeeTransactions] = await Promise.all([
        getWashEventsData(),
        getAggregatorsData(),
        getCounterAgentsData(),
        getEmployeesData(),
        getExpensesData(),
        getInventory(),
        getAllEmployeeTransactions()
    ]);

    return { washEvents, aggregators, counterAgents, employees, expenses, inventory, employeeTransactions };
}


export default async function DashboardPage({ searchParams }: { searchParams?: { from?: string; to?: string; } }) {
    let fetchDataResult;
    let fetchError: string | null = null;
    
    try {
        fetchDataResult = await fetchData();
    } catch(e: any) {
        fetchError = e.message || "Не удалось загрузить данные для панели управления.";
    }

    if (fetchError || !fetchDataResult) {
        return (
            <div className="container mx-auto py-8">
                <PageHeader title="Панель управления" />
                <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ошибка загрузки данных</AlertTitle>
                <AlertDescription>{fetchError || 'Неизвестная ошибка'}</AlertDescription>
                </Alert>
            </div>
        );
    }
    
    const { washEvents, aggregators, counterAgents, employees, expenses, inventory, employeeTransactions } = fetchDataResult;
    
    return (
        <div className="container mx-auto py-4 md:py-8">
            <Suspense fallback={
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <DashboardClient 
                    washEvents={washEvents}
                    aggregators={aggregators}
                    counterAgents={counterAgents}
                    employees={employees}
                    expenses={expenses}
                    inventory={inventory}
                    employeeTransactions={employeeTransactions}
                    dateRange={{ from: searchParams?.from, to: searchParams?.to }}
                />
            </Suspense>
        </div>
    );
}
