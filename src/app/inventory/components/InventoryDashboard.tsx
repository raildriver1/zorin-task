
"use client";

import { useState, useMemo } from 'react';
import type { WashEvent, Employee, Expense, EmployeeTransaction } from "@/types";
import { format, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingCart, Droplets, PackageCheck, PackageOpen, Package, Users } from 'lucide-react';

interface InventoryDashboardProps {
  inventory: { chemicalStockGrams: number };
  allWashEvents: WashEvent[];
  allExpenses: Expense[];
  allEmployeeTransactions: EmployeeTransaction[];
  employees: Employee[];
}

type StockMovement = {
    id: string;
    date: Date;
    type: 'purchase' | 'consumption' | 'issue';
    description: string;
    amountGrams: number;
    balanceAfterGrams: number;
}

export function InventoryDashboard({ inventory, allWashEvents, allExpenses, allEmployeeTransactions, employees }: InventoryDashboardProps) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.fullName])), [employees]);

    const { journalForPeriod, balanceAtStartOfPeriod } = useMemo(() => {
        const allMovements: Omit<StockMovement, 'balanceAfterGrams'>[] = [];

        // 1. Add purchases from expenses
        allExpenses
            .filter(e => e.category === 'Закупка химии' && e.unit === 'кг' && e.quantity)
            .forEach(e => {
                allMovements.push({
                    id: `exp-${e.id}`,
                    date: new Date(e.date),
                    type: 'purchase',
                    description: e.description || 'Закупка химии',
                    amountGrams: (e.quantity || 0) * 1000
                });
            });

        // 2. Add consumption from washes
        allWashEvents.forEach(event => {
            let totalConsumptionForEvent = 0;
            const allServices = [event.services.main, ...event.services.additional];
            allServices.forEach(service => {
                if (service?.employeeConsumptions) {
                    totalConsumptionForEvent += service.employeeConsumptions.reduce((sum, c) => sum + c.amount, 0);
                } else if(service?.chemicalConsumption) {
                    totalConsumptionForEvent += service.chemicalConsumption;
                }
            });
            if (totalConsumptionForEvent > 0) {
                allMovements.push({
                    id: `wash-${event.id}`,
                    date: new Date(event.timestamp),
                    type: 'consumption',
                    description: `Мойка: ${event.vehicleNumber}`,
                    amountGrams: -totalConsumptionForEvent,
                });
            }
        });

        // 3. Add canister issues to employees
        allEmployeeTransactions
            .filter(t => t.type === 'purchase' && t.description.includes('Выдача канистры химии'))
            .forEach(t => {
                allMovements.push({
                    id: `issue-${t.id}`,
                    date: new Date(t.date),
                    type: 'issue',
                    description: `Выдача сотруднику: ${employeeMap.get(t.employeeId)?.split(' ')[0] || 'Неизвестно'}`,
                    amountGrams: -20000,
                });
            });
        
        allMovements.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Calculate running balance and start balance
        let balanceAtStartOfPeriod = inventory.chemicalStockGrams;
        const periodStart = dateRange?.from ? startOfMonth(dateRange.from) : new Date(0); // Use a far past date if no range
        
        // To get the start balance, we reverse the operations that happened after the period started
        const movementsAfterStart = allMovements.filter(m => m.date >= periodStart);
        balanceAtStartOfPeriod = movementsAfterStart.reduce((balance, movement) => balance - movement.amountGrams, inventory.chemicalStockGrams);

        let runningBalance = balanceAtStartOfPeriod;
        const journalWithBalance: StockMovement[] = [];
        
        for (const movement of allMovements) {
            runningBalance += movement.amountGrams;
            if (dateRange?.from && isWithinInterval(movement.date, { start: dateRange.from, end: dateRange.to || dateRange.from })) {
                journalWithBalance.push({ ...movement, balanceAfterGrams: runningBalance });
            }
        }

        journalWithBalance.sort((a, b) => b.date.getTime() - a.date.getTime());

        return { journalForPeriod: journalWithBalance, balanceAtStartOfPeriod };
    }, [allWashEvents, allExpenses, allEmployeeTransactions, employeeMap, inventory.chemicalStockGrams, dateRange]);

    const chemicalsWithEmployees = useMemo(() => {
        const issuesByEmployee: Record<string, { name: string, count: number }> = {};
        allEmployeeTransactions
            .filter(t => t.type === 'purchase' && t.description.includes('Выдача канистры химии'))
            .forEach(t => {
                if (!issuesByEmployee[t.employeeId]) {
                    issuesByEmployee[t.employeeId] = {
                        name: employeeMap.get(t.employeeId) || 'Неизвестный сотрудник',
                        count: 0
                    };
                }
                issuesByEmployee[t.employeeId].count++;
            });
        return Object.values(issuesByEmployee).sort((a, b) => b.count - a.count);
    }, [allEmployeeTransactions, employeeMap]);


    const renderIcon = (type: StockMovement['type']) => {
        switch (type) {
            case 'purchase': return <ShoppingCart className="h-4 w-4 text-green-500 shrink-0"/>;
            case 'consumption': return <ArrowRight className="h-4 w-4 text-red-500 shrink-0"/>;
            case 'issue': return <ArrowRight className="h-4 w-4 text-orange-500 shrink-0"/>;
        }
    };
    
    const renderBadge = (type: StockMovement['type']) => {
        switch (type) {
            case 'purchase': return <Badge variant="outline" className="text-green-700 border-green-300">Закупка</Badge>;
            case 'consumption': return <Badge variant="outline" className="text-red-700 border-red-300">Расход на мойку</Badge>;
            case 'issue': return <Badge variant="outline" className="text-orange-700 border-orange-300">Выдача сотруднику</Badge>;
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                           <Package className="h-5 w-5 text-primary" />
                           Текущий остаток
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-primary">{(inventory.chemicalStockGrams / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} кг</p>
                        <p className="text-sm text-muted-foreground">На складе прямо сейчас</p>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-1">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                           <PackageOpen className="h-5 w-5" />
                           На начало периода
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{(balanceAtStartOfPeriod / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} кг</p>
                        {dateRange?.from && <p className="text-sm text-muted-foreground">На {format(dateRange.from, 'dd.MM.yyyy')}</p>}
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                           <Users className="h-5 w-5 text-orange-600" />
                           Химия у сотрудников
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-24">
                           {chemicalsWithEmployees.length > 0 ? (
                               <Table>
                                 <TableBody>
                                   {chemicalsWithEmployees.map(emp => (
                                     <TableRow key={emp.name}>
                                       <TableCell className="p-1 font-medium">{emp.name}</TableCell>
                                       <TableCell className="p-1 text-right font-semibold">{(emp.count * 20).toLocaleString('ru-RU')} кг</TableCell>
                                       <TableCell className="p-1 text-right text-muted-foreground">({emp.count} кан.)</TableCell>
                                     </TableRow>
                                   ))}
                                 </TableBody>
                               </Table>
                           ) : (
                               <p className="text-sm text-muted-foreground text-center pt-6">Нет выданной химии сотрудникам.</p>
                           )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Журнал движения химических средств</CardTitle>
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">История всех поступлений и списаний химии.</p>
                        <DateRangePicker date={dateRange} setDate={setDateRange} />
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh] rounded-md border">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead className="w-[150px]">Дата</TableHead>
                                <TableHead>Операция</TableHead>
                                <TableHead className="text-right">Изменение</TableHead>
                                <TableHead className="text-right">Остаток</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {journalForPeriod.length > 0 ? (
                                journalForPeriod.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>{format(entry.date, 'dd.MM.yy HH:mm', { locale: ru })}</TableCell>
                                    <TableCell>
                                    <div className="flex items-center gap-2">
                                        {renderIcon(entry.type)}
                                        <div>
                                            <p className="font-medium">{entry.description}</p>
                                            {renderBadge(entry.type)}
                                        </div>
                                    </div>
                                    </TableCell>
                                    <TableCell className={`text-right font-semibold ${entry.amountGrams > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {entry.amountGrams > 0 ? '+' : ''}{(entry.amountGrams / 1000).toFixed(3)} кг
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {(entry.balanceAfterGrams / 1000).toFixed(3)} кг
                                    </TableCell>
                                </TableRow>
                            ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                    Нет операций за выбранный период. <Button variant="link" asChild><Link href="/expenses/new">Добавьте первую закупку химии.</Link></Button>
                                    </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

