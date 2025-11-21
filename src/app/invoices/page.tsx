
export const dynamic = 'force-dynamic';

import PageHeader from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { getCounterAgentsData, getWashEventsData, getAggregatorsData } from '@/lib/data-loader';
import { InvoiceGenerator } from './components/InvoiceGenerator';

async function fetchData() {
    try {
        const [counterAgents, aggregators, washEvents] = await Promise.all([
            getCounterAgentsData(),
            getAggregatorsData(),
            getWashEventsData(),
        ]);
        
        return { counterAgents, aggregators, washEvents, error: null };
    } catch (e: any) {
        console.error("Failed to fetch invoice page data:", e);
        return { error: e.message || "Не удалось загрузить данные.", counterAgents: [], aggregators: [], washEvents: [] };
    }
}

export default async function InvoicesPage() {
    const { counterAgents, aggregators, washEvents, error } = await fetchData();
    
    // Временные реквизиты вашей компании. В будущем мы вынесем их в настройки.
    const myCompanyDetails = {
        companyName: 'Индивидуальный предприниматель Абанин Даниил Олегович',
        ownerName: 'Абанин Д.О.',
        inn: '333801382869',
        ogrnip: '315333200009578',
        legalAddress: '601441, Владимирская область, г.Вязники, Полевой переулок, д.3',
        bankName: 'Владимирское отделение № 8611 ПАО Сбербанк',
        bik: '041708602',
        correspondentAccount: '30101810000000000602',
        settlementAccount: '40802810210000009322'
    };

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <PageHeader title="Счета для клиентов" description="Ошибка загрузки данных." />
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
                title="Счета для клиентов"
                description="Формирование и печать актов выполненных работ для корпоративных клиентов и агрегаторов."
            />
            <InvoiceGenerator 
                counterAgents={counterAgents}
                aggregators={aggregators}
                washEvents={washEvents}
                myCompanyDetails={myCompanyDetails}
            />
        </div>
    );
}
