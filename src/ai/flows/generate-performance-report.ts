
'use server';
/**
 * @fileoverview Defines a Genkit flow for generating a performance report.
 */
import 'dotenv/config';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  getWashEventsData,
  getEmployeesData,
  getExpensesData,
} from '@/lib/data-loader';

// Define Zod schemas for the data structures
// Note: These are simplified for the AI prompt context.
const EmployeeSchema = z.object({
  id: z.string(),
  fullName: z.string(),
});

const ExpenseSchema = z.object({
  category: z.string(),
  amount: z.number(),
  description: z.string(),
});

const WashEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  totalAmount: z.number(),
  employeeIds: z.array(z.string()),
  paymentMethod: z.string(),
  sourceName: z.string().optional(),
});

const ReportContextSchema = z.object({
  washEvents: z.array(WashEventSchema),
  employees: z.array(EmployeeSchema),
  expenses: z.array(ExpenseSchema),
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
});

export const performanceReportInputSchema = z.object({
  startDate: z.string().describe('The start date for the report period in ISO format.'),
  endDate: z.string().describe('The end date for the report period in ISO format.'),
  question: z.string().describe('The user\'s question about the report.'),
});
export type PerformanceReportInput = z.infer<typeof performanceReportInputSchema>;

export const performanceReportOutputSchema = z.object({
  reportMarkdown: z.string().describe('The generated performance report in Markdown format.'),
});
export type PerformanceReportOutput = z.infer<typeof performanceReportOutputSchema>;


const getBusinessData = ai.defineTool(
  {
    name: 'getBusinessData',
    description: 'Retrieves business data (wash events, employees, expenses) for a given date range.',
    inputSchema: z.object({
      startDate: z.string(),
      endDate: z.string(),
    }),
    outputSchema: ReportContextSchema,
  },
  async ({ startDate, endDate }) => {
    console.log(`[AI Tool] Fetching data from ${startDate} to ${endDate}`);
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [allWashEvents, allEmployees, allExpenses] = await Promise.all([
      getWashEventsData(),
      getEmployeesData(),
      getExpensesData(),
    ]);

    const washEvents = allWashEvents.filter(e => {
        const eventDate = new Date(e.timestamp);
        return eventDate >= start && eventDate <= end;
    });

    const expenses = allExpenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= start && expenseDate <= end;
    });
    
    const employees = allEmployees.map(e => ({ id: e.id, fullName: e.fullName }));

    return {
      washEvents: washEvents.map(e => ({
        id: e.id,
        timestamp: e.timestamp,
        totalAmount: e.totalAmount,
        employeeIds: e.employeeIds,
        paymentMethod: e.paymentMethod,
        sourceName: e.sourceName,
      })),
      employees,
      expenses: expenses.map(e => ({ category: e.category, amount: e.amount, description: e.description })),
      dateRange: {
        from: startDate,
        to: endDate,
      },
    };
  }
);


const generationPrompt = `You are a business analyst AI for a car wash company called "АвтомойкаПро".
Your task is to generate a concise, insightful, and well-structured performance report in Russian based on the business data provided, in response to the user's question.

User's question: {{{question}}}

Business Data:
\`\`\`json
{{{businessData}}}
\`\`\`

The report MUST be in Markdown format.

Follow this structure strictly:

# Аналитический отчет по производительности

## 1. 📈 Ключевые показатели (KPI)
- **Общая выручка:** (Calculate and display)
- **Количество моек:** (Count and display)
- **Средний чек:** (Calculate and display)
- **Общие расходы:** (Calculate and display)
- **Прибыль (Выручка - Расходы):** (Calculate and display)

## 2. 📊 Анализ выручки
- **Динамика по дням:** Briefly describe the trend (e.g., "Выручка была стабильной с пиком в четверг и спадом на выходных.").
- **По типу клиента:** Analyze the revenue distribution between "Розница", "Агрегаторы", and "Контрагенты". Identify the most valuable client type.

## 3. 👨‍🔧 Производительность сотрудников
- Identify the top-performing employee based on the number of washes they participated in.
- Mention their total number of washes.

## 4. 💸 Анализ расходов
- List the top 2-3 spending categories.
- Highlight any significant or unusual expenses.

## 5. 💡 Выводы и рекомендации
- Provide one or two key takeaways from the data.
- Suggest one concrete, actionable recommendation. For example: "Большая часть выручки поступает от розничных клиентов. Рекомендуется запустить акцию '5-я мойка в подарок' для увеличения их лояльности." or "Сотрудник [Имя] является самым производительным. Рассмотрите возможность его премирования для мотивации."

Your tone should be professional, data-driven, and helpful. Use formatting like bolding, lists, and headers to make the report easy to read.`;


export const generatePerformanceReportFlow = ai.defineFlow(
  {
    name: 'generatePerformanceReportFlow',
    inputSchema: performanceReportInputSchema,
    outputSchema: performanceReportOutputSchema,
  },
  async (input) => {
    // Step 1: Explicitly call the tool to get the business data.
    const businessData = await getBusinessData({
        startDate: input.startDate,
        endDate: input.endDate,
    });

    // Step 2: Call the LLM with the retrieved data in the prompt.
    const llmResponse = await ai.generate({
        prompt: generationPrompt,
        model: 'gemini-1.5-flash-latest',
        input: {
          question: input.question,
          businessData: JSON.stringify(businessData, null, 2),
        },
    });
    
    const reportText = llmResponse.text();

    return {
      reportMarkdown: reportText,
    };
  }
);

export async function generatePerformanceReport(input: PerformanceReportInput): Promise<PerformanceReportOutput> {
  return generatePerformanceReportFlow(input);
}
