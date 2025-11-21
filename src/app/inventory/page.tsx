
export const dynamic = 'force-dynamic';

import PageHeader from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { getWashEventsData, getExpensesData, getInventory, getAllEmployeeTransactions, getEmployeesData } from '@/lib/data-loader';
import { InventoryDashboard } from './components/InventoryDashboard';

async function fetchData() {
    try {
        const [
            washEvents,
            expenses,
            inventory,
            employeeTransactions,
            employees
        ] = await Promise.all([
            getWashEventsData(),
            getExpensesData(),
            getInventory(),
            getAllEmployeeTransactions(),
            getEmployeesData(),
        ]);
        
        return { washEvents, expenses, inventory, employeeTransactions, employees, error: null };
    } catch (e: any) {
        console.error("Failed to fetch inventory data:", e);
        return { 
            error: e.message || "Не удалось загрузить данные для раздела склада.",
            washEvents: [], expenses: [], inventory: { chemicalStockGrams: 0 }, employeeTransactions: [], employees: []
        };
    }
}

export default async function InventoryPage() {
    const { washEvents, expenses, inventory, employeeTransactions, employees, error } = await fetchData();

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <PageHeader title="Склад" description="Ошибка загрузки данных." />
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
                title="Склад"
                description="Управление запасами и отслеживание движения химических средств."
            />
            <InventoryDashboard
                inventory={inventory}
                allWashEvents={washEvents}
                allExpenses={expenses}
                allEmployeeTransactions={employeeTransactions}
                employees={employees}
            />
        </div>
    );
}
