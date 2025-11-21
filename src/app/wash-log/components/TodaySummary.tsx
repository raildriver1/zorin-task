
"use client";

import type { SalaryReportData } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Trophy, BarChart, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TodaySummaryProps {
  reportData: SalaryReportData[];
}

export function TodaySummary({ reportData }: TodaySummaryProps) {
  if (!reportData || reportData.length === 0) {
    return null;
  }

  const totalTodayEarnings = reportData.reduce((sum, emp) => sum + emp.totalEarnings, 0);
  const topEarner = reportData[0]; // Already sorted by descending earnings

  return (
    <Card className="mb-6 bg-amber-50 border-amber-200 shadow-sm">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="border-b-0">
          <AccordionTrigger className="px-6 py-4 text-amber-800 hover:no-underline">
            <div className="flex items-center gap-3">
              <BarChart className="h-5 w-5" />
              <span className="font-semibold text-lg">Сводка за сегодня</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="space-y-3">
              {topEarner && (
                <div className="flex items-center gap-3 p-3 rounded-md bg-white border border-yellow-400 shadow-inner">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Лучший сотрудник дня</p>
                    <p className="text-lg font-bold text-foreground">{topEarner.employeeName}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xl font-bold text-green-600">
                      {topEarner.totalEarnings.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2 pt-2">
                <h4 className="font-semibold flex items-center gap-2"><User className="h-4 w-4"/>Все сотрудники за смену:</h4>
                <ul className="space-y-1">
                  {reportData.map((employeeReport, index) => (
                    <li key={employeeReport.employeeId} className="flex justify-between items-center text-sm p-2 rounded hover:bg-amber-100/50">
                      <span className="font-medium text-foreground">
                        {index + 1}. {employeeReport.employeeName}
                      </span>
                      <span className="font-semibold text-foreground/80">
                        {employeeReport.totalEarnings.toLocaleString('ru-RU')} руб.
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

               <div className="flex justify-end pt-2 border-t border-amber-200/60 mt-3">
                 <p className="text-md font-bold">Общий ФОТ за сегодня: {totalTodayEarnings.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}</p>
              </div>

            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
