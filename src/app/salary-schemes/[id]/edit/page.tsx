
export const dynamic = 'force-dynamic';

import PageHeader from '@/components/layout/PageHeader';
import { SalarySchemeForm } from '../../components/SalarySchemeForm';
import type { SalaryScheme } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

async function getSchemeById(id: string): Promise<SalaryScheme | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/salary-schemes/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch scheme with ID ${id}: ${res.statusText}`);
  }
  try {
    return await res.json();
  } catch (e) {
    console.error("Failed to parse scheme JSON:", e);
    throw new Error(`Failed to parse scheme data for ID ${id}`);
  }
}

export default async function EditSalarySchemePage({ params }: { params: { id: string } }) {
  const schemeId = params.id;
  let scheme: SalaryScheme | null = null;
  let fetchError: string | null = null;

  try {
    scheme = await getSchemeById(schemeId);
  } catch (error: any) {
    fetchError = error.message || `Не удалось загрузить данные для схемы с ID ${schemeId}.`;
  }

  if (fetchError) {
     return (
      <div className="container mx-auto py-8">
        <PageHeader title="Редактировать схему" description="Ошибка загрузки данных." />
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ошибка Загрузки</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader title="Редактировать схему" description="Ошибка загрузки данных." />
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Схема не найдена</AlertTitle>
          <AlertDescription>
            Схема с ID "{schemeId}" не найдена. Возможно, она была удалена или ID указан неверно.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title={`Редактировать схему`}
        description={`Обновление данных для схемы "${scheme.name}".`}
      />
      <SalarySchemeForm initialData={scheme} schemeId={schemeId} />
    </div>
  );
}
