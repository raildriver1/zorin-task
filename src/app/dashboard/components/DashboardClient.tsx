
'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay, isWithinInterval, format, eachDayOfInterval, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

import type { WashEvent, Aggregator, CounterAgent, Employee, Expense, EmployeeTransaction } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Info, Scale, TrendingUp, ShoppingCart, Droplets, HandCoins, Warehouse } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { DateRangePicker } from '@/components/ui/date-range-picker';
import PageHeader from '@/components/layout/PageHeader';
import { DashboardCharts } from "./DashboardCharts";
import { RevenueDetailsDialog } from "./RevenueDetailsDialog";
import { ProfitDetailsDialog } from "./ProfitDetailsDialog";
import { Clock, Car } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';


interface DashboardClientProps {
    washEvents: WashEvent[];
    aggregators: Aggregator[];
    counterAgents: CounterAgent[];
    employees: Employee[];
    expenses: Expense[];
    inventory: { chemicalStockGrams: number };
    employeeTransactions: EmployeeTransaction[];
    dateRange: {
        from?: string;
        to?: string;
    }
}

const paymentMethodTranslations: Record<string, string> = {
  cash: 'Наличные',
  card: 'Карта',
  transfer: 'Перевод',
};

const CHART_COLORS = {
    retail: "#81C784", // green
    aggregator: "#64B5F6", // blue
    counterAgent: "#FFB74D", // orange
    other: "#90A4AE", // blue-grey
};

export function DashboardClient({ 
    washEvents: initialWashEvents, 
    aggregators, 
    counterAgents, 
    employees,
    expenses: initialExpenses,
    inventory,
    employeeTransactions: initialEmployeeTransactions,
    dateRange: initialDateRange 
}: DashboardClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(() => {
      // Initialize with server-provided values if they exist, otherwise undefined
      if (initialDateRange.from && initialDateRange.to) {
        return { from: parseISO(initialDateRange.from), to: parseISO(initialDateRange.to) };
      }
      return undefined;
    });

    // Set default date range on the client side to avoid hydration mismatch
    useEffect(() => {
        if (!selectedDateRange) {
             setSelectedDateRange({
                from: startOfDay(subDays(new Date(), 6)),
                to: endOfDay(new Date()),
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    useEffect(() => {
        // Only update URL if a date range is selected
        if (selectedDateRange?.from) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('from', selectedDateRange.from.toISOString());
            if (selectedDateRange.to) {
                params.set('to', selectedDateRange.to.toISOString());
            } else {
                // If only 'from' is selected, 'to' is the same day.
                 params.set('to', selectedDateRange.from.toISOString());
            }
            router.replace(`${pathname}?${params.toString()}`);
        }
    }, [selectedDateRange, pathname, router, searchParams]);


    const { filteredWashEvents, filteredExpenses, filteredEmployeeTransactions } = useMemo(() => {
        if (!selectedDateRange?.from) return { filteredWashEvents: [], filteredExpenses: [], filteredEmployeeTransactions: [] };
        const start = startOfDay(selectedDateRange.from);
        const end = endOfDay(selectedDateRange.to || selectedDateRange.from);
        
        const washEvents = initialWashEvents.filter(e => isWithinInterval(new Date(e.timestamp), { start, end }));
        const expenses = initialExpenses.filter(e => isWithinInterval(new Date(e.date), {start, end}));
        const employeeTransactions = initialEmployeeTransactions.filter(t => isWithinInterval(new Date(t.date), {start, end}));
        
        return { filteredWashEvents: washEvents, filteredExpenses: expenses, filteredEmployeeTransactions: employeeTransactions };
    }, [initialWashEvents, initialExpenses, initialEmployeeTransactions, selectedDateRange]);
    
    // --- Metrics Calculations ---
    const totalRevenue = filteredWashEvents.reduce((sum, event) => sum + (event.netAmount !== undefined ? event.netAmount : event.totalAmount), 0);
    const totalWashes = filteredWashEvents.length;
    
    const operationalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const salaryPayments = filteredEmployeeTransactions
        .filter(t => t.type === 'payment' || t.type === 'bonus') // Payments and bonuses are expenses
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = operationalExpenses + salaryPayments;
    
    const profit = totalRevenue - totalExpenses;

    // Daily revenue chart data for the selected period
    const dailyRevenueData = useMemo(() => {
        if (!selectedDateRange?.from) return [];
        
        const start = selectedDateRange.from;
        const end = selectedDateRange.to || selectedDateRange.from;
        const intervalDays = eachDayOfInterval({ start, end });

        return intervalDays.map(day => {
            const dailyTotal = filteredWashEvents
                .filter(e => format(new Date(e.timestamp), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
                .reduce((sum, e) => sum + (e.netAmount ?? e.totalAmount), 0);
            return { date: format(day, 'dd MMM', { locale: ru }), revenue: dailyTotal };
        });
    }, [filteredWashEvents, selectedDateRange]);

    const retailRevenue = filteredWashEvents
      .filter(e => e.paymentMethod === 'cash' || e.paymentMethod === 'card' || e.paymentMethod === 'transfer')
      .reduce((sum, e) => sum + (e.netAmount ?? e.totalAmount), 0);

    const aggregatorRevenue = filteredWashEvents
      .filter(e => e.paymentMethod === 'aggregator')
      .reduce((sum, e) => sum + (e.netAmount ?? e.totalAmount), 0);

    const counterAgentRevenue = filteredWashEvents
      .filter(e => e.paymentMethod === 'counterAgentContract')
      .reduce((sum, e) => sum + (e.netAmount ?? e.totalAmount), 0);
    
    const aggregatorDetails = aggregators.map((agg, index) => ({
      name: agg.name,
      value: filteredWashEvents.filter(e => e.sourceId === agg.id).reduce((sum, e) => sum + (e.netAmount ?? e.totalAmount), 0),
      fill: `hsl(var(--chart-${(index % 5) + 1}))`
    })).filter(item => item.value > 0);

    const counterAgentDetails = counterAgents.map((agent, index) => ({
      name: agent.name,
      value: filteredWashEvents.filter(e => e.sourceId === agent.id).reduce((sum, e) => sum + (e.netAmount ?? e.totalAmount), 0),
      fill: `hsl(var(--chart-${(index % 5) + 1}))`
    })).filter(item => item.value > 0);
      
    const paymentTypeDistribution = [
      { name: "Розница", value: retailRevenue, fill: CHART_COLORS.retail },
      { name: "Агрегаторы", value: aggregatorRevenue, fill: CHART_COLORS.aggregator, details: aggregatorDetails },
      { name: "Контрагенты", value: counterAgentRevenue, fill: CHART_COLORS.counterAgent, details: counterAgentDetails },
    ].filter(item => item.value > 0);

    const latestWashes = filteredWashEvents.slice(0, 5);

    const periodDescription = useMemo(() => {
        const range = initialDateRange.from ? { from: parseISO(initialDateRange.from), to: initialDateRange.to ? parseISO(initialDateRange.to) : undefined } : undefined;
        if (!range?.from) return "загрузка...";
        const from = format(range.from, "d MMM", { locale: ru });
        if (!range.to || format(range.from, 'yyyy-MM-dd') === format(range.to, 'yyyy-MM-dd')) {
            return `за ${from}`;
        }
        const to = format(range.to, "d MMM yyyy", { locale: ru });
        return `с ${from} по ${to}`;
    }, [initialDateRange]);


    return (
        <>
            <PageHeader 
                title="Панель управления" 
                description="Обзор операций вашей автомойки в реальном времени."
                actions={<DateRangePicker date={selectedDateRange} setDate={setSelectedDateRange} />}
            />
            
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-5">
                <RevenueDetailsDialog
                    washEvents={filteredWashEvents}
                    employees={employees}
                    paymentDistribution={{ retailRevenue, aggregatorRevenue, counterAgentRevenue }}
                >
                    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
                            <div className="flex items-center gap-2">
                                <Info className="h-3 w-3 text-muted-foreground" />
                                <TrendingUp className="h-5 w-5 text-green-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline text-green-600">{totalRevenue.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}</div>
                            <p className="text-xs text-muted-foreground">{periodDescription}</p>
                        </CardContent>
                    </Card>
                </RevenueDetailsDialog>
                 <Card className="shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Всего расходов</CardTitle>
                        <ShoppingCart className="h-5 w-5 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-headline text-destructive">{totalExpenses.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}</div>
                        <p className="text-xs text-muted-foreground">Вкл. ЗП {salaryPayments.toLocaleString('ru-RU')} руб.</p>
                    </CardContent>
                </Card>
                 <ProfitDetailsDialog
                    washEvents={filteredWashEvents}
                    expenses={filteredExpenses}
                    employeeTransactions={filteredEmployeeTransactions}
                 >
                    <Card className="shadow-md bg-accent/50 hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Прибыль</CardTitle>
                             <div className="flex items-center gap-2">
                                <Info className="h-3 w-3 text-muted-foreground" />
                                <Scale className="h-5 w-5 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold font-headline ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                {profit.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                            </div>
                            <p className="text-xs text-muted-foreground">Выручка - Все расходы</p>
                        </CardContent>
                    </Card>
                 </ProfitDetailsDialog>
                 <Card className="shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Всего моек</CardTitle>
                        <Users className="h-5 w-5 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-headline">{totalWashes}</div>
                        <p className="text-xs text-muted-foreground">{periodDescription}</p>
                    </CardContent>
                </Card>
                <Button variant="outline" className="h-full w-full flex-col items-start justify-start p-4" asChild>
                  <Link href="/inventory">
                    <Card className="shadow-none border-none w-full bg-transparent">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                            <CardTitle className="text-sm font-medium">Остаток химии</CardTitle>
                             <div className="flex items-center gap-2">
                                <Info className="h-3 w-3 text-muted-foreground" />
                                <Warehouse className="h-5 w-5 text-indigo-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-bold font-headline">{(inventory.chemicalStockGrams / 1000).toFixed(2)} кг</div>
                            <p className="text-xs text-muted-foreground">На складе</p>
                        </CardContent>
                    </Card>
                  </Link>
                </Button>
            </div>
            
            <DashboardCharts
                dailyRevenueData={dailyRevenueData}
                paymentTypeDistribution={paymentTypeDistribution}
            />

            <Card className="mt-6 md:mt-8 shadow-md bg-accent/10 border-accent">
                <CardHeader className="flex flex-row items-center gap-3">
                <Clock className="h-6 w-6 text-accent" />
                <CardTitle className="font-headline text-lg text-accent">Последние мойки ({periodDescription})</CardTitle>
                </CardHeader>
                <CardContent>
                    {latestWashes.length > 0 ? (
                        <Table>
                            <TableBody>
                                {latestWashes.map(event => (
                                    <TableRow key={event.id} className="border-b-accent/20">
                                        <TableCell className="font-medium flex items-center gap-2"><Car className="h-4 w-4" />{event.vehicleNumber}</TableCell>
                                        <TableCell>{paymentMethodTranslations[event.paymentMethod] || event.sourceName || 'Неизвестно'}</TableCell>
                                        <TableCell className="text-right font-semibold">{event.totalAmount.toLocaleString('ru-RU')} руб.</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{format(new Date(event.timestamp), 'dd MMM, HH:mm', { locale: ru })}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">Нет зарегистрированных моек за выбранный период.</p>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
