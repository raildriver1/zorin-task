
"use client";

import React, { useState, useMemo } from "react";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Cell, Sector } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface DailyRevenueData {
  date: string;
  revenue: number;
}

interface DistributionData {
  name: string;
  value: number;
  fill: string;
  details?: DistributionData[];
}

interface DashboardChartsProps {
  dailyRevenueData: DailyRevenueData[];
  paymentTypeDistribution: DistributionData[];
}

const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
        <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#666" fontSize={14}>
            {payload.name}
        </text>
        <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="#333" fontSize={16} fontWeight="bold">
            {`${(percent * 100).toFixed(2)}%`}
        </text>
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
        />
        <Sector
            cx={cx}
            cy={cy}
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={outerRadius + 6}
            outerRadius={outerRadius + 10}
            fill={fill}
        />
        </g>
    );
};


export function DashboardCharts({ dailyRevenueData, paymentTypeDistribution }: DashboardChartsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [drilldownData, setDrilldownData] = useState<DistributionData[] | null>(null);
  const [history, setHistory] = useState<(DistributionData[] | null)[]>([paymentTypeDistribution]);
  const [currentTitle, setCurrentTitle] = useState("Общее распределение");

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const handlePieClick = (data: DistributionData) => {
    if (data.details && data.details.length > 0) {
        setHistory(prev => [...prev, data.details!]);
        setDrilldownData(data.details);
        setCurrentTitle(`Распределение по "${data.name}"`);
    }
  };

  const handleBackClick = () => {
    const newHistory = [...history];
    newHistory.pop();
    const previousData = newHistory[newHistory.length - 1] || paymentTypeDistribution;
    
    setHistory(newHistory);
    setDrilldownData(newHistory.length > 1 ? previousData : null);
    setCurrentTitle(newHistory.length > 1 ? `Распределение по ...` : "Общее распределение");
  };

  const currentData = useMemo(() => drilldownData || paymentTypeDistribution, [drilldownData, paymentTypeDistribution]);
  const totalValue = useMemo(() => currentData.reduce((sum, item) => sum + item.value, 0), [currentData]);

  const barChartConfig = {
    revenue: {
      label: "Выручка",
      color: "hsl(var(--primary))",
    },
  };

  const pieChartConfig = useMemo(() => {
    const config: any = {};
    currentData.forEach(item => {
        config[item.name] = {
            label: item.name,
            color: item.fill,
        };
    });
    return config;
  }, [currentData]);

  return (
    <div className="mt-6 md:mt-8 grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Динамика выручки</CardTitle>
             <CardDescription>Суммарная выручка по дням за выбранный период.</CardDescription>
          </CardHeader>
          <CardContent>
           {dailyRevenueData.length > 0 ? (
            <ChartContainer config={barChartConfig}>
                <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyRevenueData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(value) => `₽${value / 1000}k`} />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent
                            formatter={(value) => `${(value as number).toLocaleString('ru-RU')} руб.`}
                            indicator="dot"
                        />}
                    />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
             ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Нет данных о выручке за выбранный период.</p>
                </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
             <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="font-headline text-lg">{currentTitle}</CardTitle>
                    <CardDescription>Нажмите на сектор для детализации</CardDescription>
                </div>
                 {history.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={handleBackClick}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Назад
                  </Button>
                )}
             </div>
          </CardHeader>
          <CardContent className="relative flex items-center justify-center h-[300px]">
          {currentData.length > 0 ? (
            <ChartContainer config={pieChartConfig} className="w-full h-full">
              <PieChart width={300} height={300} className="mx-auto">
                <ChartTooltip
                    content={<ChartTooltipContent 
                        nameKey="name"
                        formatter={(value, name) => `${(value as number).toLocaleString('ru-RU')} руб. (${((value as number) / totalValue * 100).toFixed(1)}%)`}
                    />}
                />
                <Pie 
                    data={currentData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100}
                    innerRadius={70}
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={onPieEnter}
                    onClick={(_event, index) => handlePieClick(currentData[index])}
                >
                  {currentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} className="cursor-pointer" />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Нет данных для построения диаграммы.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
