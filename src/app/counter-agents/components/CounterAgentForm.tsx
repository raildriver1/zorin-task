
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, X, Cog } from "lucide-react";
import type { CounterAgent } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect } from 'react';
import { Separator } from "@/components/ui/separator";
import { normalizeLicensePlate } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CompanyAccordion, companySchema, baseCompany } from "@/components/common/CompanyAccordion";
import { PriceListEditor, priceListItemSchema } from "@/components/common/PriceListEditor";


const counterAgentFormSchema = z.object({
  name: z.string().min(2, "Имя агента должно содержать не менее 2 символов."),
  companies: z.array(companySchema).optional(),
  cars: z.string().optional()
    .superRefine((text, ctx) => {
      if (!text) return; // Skip if empty
      const plates = text.split('\n').map(p => normalizeLicensePlate(p.trim())).filter(Boolean);
      const normalizedPlates = new Set<string>();
      plates.forEach((plate) => {
        if (normalizedPlates.has(plate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Дублирующийся номерной знак (после нормализации): ${plate}`,
          });
        }
        normalizedPlates.add(plate);
      });
    }),
  priceList: z.array(priceListItemSchema).optional(),
  additionalPriceList: z.array(priceListItemSchema).optional(),
  allowCustomServices: z.boolean().optional(),
  balance: z.coerce.number().optional(),
});

type CounterAgentFormValues = z.infer<typeof counterAgentFormSchema>;

interface CounterAgentFormProps {
  initialData?: CounterAgent | null;
  agentId?: string;
}

export function CounterAgentForm({ initialData, agentId }: CounterAgentFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const preparedDefaultValues = React.useMemo(() => {
    if (initialData) {
      return {
        name: initialData.name || "",
        companies: initialData.companies && initialData.companies.length > 0 ? initialData.companies.map(c => ({ ...baseCompany, ...c })) : [],
        cars: initialData.cars.map(c => c.licensePlate).join('\n'),
        priceList: initialData.priceList?.map(p => ({ serviceName: p.serviceName || "", price: p.price ?? 0, chemicalConsumption: p.chemicalConsumption ?? 0 })) || [],
        additionalPriceList: initialData.additionalPriceList?.map(p => ({ serviceName: p.serviceName || "", price: p.price ?? 0, chemicalConsumption: p.chemicalConsumption ?? 0 })) || [],
        allowCustomServices: initialData.allowCustomServices ?? true,
        balance: initialData.balance ?? 0,
      };
    }
    return {
      name: "",
      companies: [baseCompany],
      cars: "",
      priceList: [],
      additionalPriceList: [],
      allowCustomServices: true,
      balance: 0,
    };
  }, [initialData]);

  const form = useForm<CounterAgentFormValues>({
    resolver: zodResolver(counterAgentFormSchema),
    defaultValues: preparedDefaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    form.reset(preparedDefaultValues);
  }, [preparedDefaultValues, form]);


  async function onSubmit(data: CounterAgentFormValues) {
    const currentAgentId = agentId || `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const parsedCars = (data.cars || '')
        .split('\n')
        .map(plate => normalizeLicensePlate(plate.trim()))
        .filter(Boolean);

    const agentToSave: CounterAgent = {
      id: currentAgentId,
      name: data.name,
      companies: data.companies || [],
      cars: parsedCars.map((normalizedPlate, carIndex) => {
        const existingCar = initialData?.cars.find(ec => ec.licensePlate === normalizedPlate);
        return {
          id: existingCar?.id || `car_${currentAgentId}_${carIndex + 1}_${normalizedPlate}`,
          licensePlate: normalizedPlate,
        };
      }),
      priceList: data.priceList || [],
      additionalPriceList: data.additionalPriceList || [],
      allowCustomServices: data.allowCustomServices,
      balance: data.balance,
    };

    try {
      const response = await fetch(`/api/counter-agents/${currentAgentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save agent: ${response.statusText}`);
      }
      
      form.reset(data); // Re-sync form state with saved data to make isDirty false
      router.refresh(); 
      toast({
        title: agentId ? "Агент обновлен" : "Агент создан",
        description: (
          <div className="flex flex-col">
            <span>Контрагент <strong>{agentToSave.name}</strong> успешно {agentId ? 'обновлен' : 'сохранен'}.</span>
          </div>
        ),
        variant: "default"
      });
      if (!agentId) {
        router.push('/counter-agents');
      }

    } catch (error: any) {
      console.error("Error saving counter agent:", error);
      toast({
        title: "Ошибка сохранения",
        description: error.message || "Не удалось сохранить данные контрагента.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl">{agentId ? "Редактировать" : "Создать"} контрагента</CardTitle>
            <CardDescription>Заполните данные контрагента. Основные поля обязательны, реквизиты для счетов - по необходимости.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя агента</FormLabel>
                  <FormControl>
                    <Input placeholder="например, ООО 'Авто Коммерц'" {...field} className="text-base"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Текущий баланс (руб.)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Отрицательное значение означает долг клиента перед вами. Положительное - его предоплату. Вы можете вручную изменить это значение для регистрации оплаты.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <CompanyAccordion control={form.control as any} />

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Автопарк</CardTitle>
            <CardDescription>Введите или вставьте список госномеров, каждый на новой строке.</CardDescription>
          </CardHeader>
          <CardContent>
             <FormField
                control={form.control}
                name="cars"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Список номеров машин</FormLabel>
                    <FormControl>
                        <Textarea
                            placeholder="A123BC777
X456YZ152
..."
                            rows={15}
                            {...field}
                            className="font-mono text-sm"
                        />
                    </FormControl>
                    <FormDescription>
                        Русские буквы будут автоматически преобразованы в латинские (например, С003ЕА станет C003EA). Пустые строки будут проигнорированы.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Индивидуальный прайс-лист (основные услуги)</CardTitle>
            <CardDescription>Определите специальные цены на ОСНОВНЫЕ услуги для этого контрагента. Если прайс-лист пуст, будут применяться стандартные тарифы.</CardDescription>
          </CardHeader>
          <CardContent>
            <PriceListEditor
              control={form.control}
              fieldArrayName="priceList"
              emptyListMessage="Для этого контрагента еще не определены индивидуальные цены. Нажмите кнопку ниже, чтобы добавить первую услугу."
              buttonText="Добавить основную услугу"
            />
          </CardContent>
        </Card>

        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2"><Cog className="h-5 w-5"/>Дополнительные услуги и настройки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                control={form.control}
                name="allowCustomServices"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">
                        Разрешить произвольные доп. услуги
                        </FormLabel>
                        <FormDescription>
                        Разрешить сотруднику на рабочей станции добавлять кастомные услуги с произвольным названием и ценой.
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Разрешить произвольные доп. услуги"
                        />
                    </FormControl>
                    </FormItem>
                )}
                />
                 <Separator />
                <div>
                    <h3 className="text-md font-semibold mb-2">Прайс-лист на доп. услуги</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Определите список предопределенных дополнительных услуг, которые сотрудник сможет выбрать на рабочей станции.
                    </p>
                    <PriceListEditor
                        control={form.control}
                        fieldArrayName="additionalPriceList"
                        emptyListMessage="Список предопределенных доп. услуг пуст."
                        buttonText="Добавить доп. услугу в прайс"
                    />
                </div>
            </CardContent>
        </Card>


        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={() => router.push('/counter-agents')}>
            <X className="mr-2 h-4 w-4" /> Отмена
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={!form.formState.isDirty || form.formState.isSubmitting}>
             <Save className="mr-2 h-4 w-4" />
            {form.formState.isSubmitting ? (agentId ? "Сохранение..." : "Создание...") : (agentId ? "Сохранить изменения" : "Создать агента")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
