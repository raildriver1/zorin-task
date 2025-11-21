
'use client';

import { useState } from 'react';
import { BrainCircuit, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { generatePerformanceReport } from '@/ai/flows/generate-performance-report';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AIReportGenerator() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, выберите полный диапазон дат.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setReport(null);
    setError(null);

    try {
      const result = await generatePerformanceReport({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        question: 'Сгенерируй аналитический отчет по производительности за указанный период.'
      });
      setReport(result.reportMarkdown);
    } catch (err: any) {
      console.error('Failed to generate AI report:', err);
      setError('Не удалось сгенерировать отчет. Попробуйте изменить период или повторить попытку позже. Проверьте, что вы добавили свой Gemini API Key в файл .env');
      toast({
        title: 'Ошибка генерации отчета',
        description: err.message || 'Произошла неизвестная ошибка.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 />
            Параметры отчета
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <Button onClick={handleGenerateReport} disabled={isLoading || !dateRange?.from}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Анализ данных...' : 'Сгенерировать отчет'}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex flex-col items-center justify-center text-center p-10 border rounded-lg border-dashed">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="font-semibold text-lg">AI анализирует данные...</p>
          <p className="text-muted-foreground">Это может занять до 30 секунд.</p>
        </div>
      )}

      {error && (
         <Alert variant="destructive">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {report && (
        <Card className="animate-in fade-in-50">
          <CardContent className="p-6">
            <div className="prose prose-blue dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {report}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
