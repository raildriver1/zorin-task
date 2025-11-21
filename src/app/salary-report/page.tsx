
export const dynamic = 'force-dynamic';

import PageHeader from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { SalaryReportClient } from './components/SalaryReportClient';
import { Suspense } from 'react';

export default async function SalaryReportPage() {
    return (
        <div className="container mx-auto py-4 md:py-8">
            <PageHeader
                title="Отчет по зарплате"
                description="Анализ начисленной зарплаты и управление выплатами для сотрудников."
            />
            <Suspense fallback={
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="ml-4 text-muted-foreground">Загрузка данных...</p>
                </div>
            }>
                <SalaryReportClient />
            </Suspense>
        </div>
    );
}
