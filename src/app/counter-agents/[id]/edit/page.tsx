
export const dynamic = 'force-dynamic';

import PageHeader from '@/components/layout/PageHeader';
import { CounterAgentForm } from '../../components/CounterAgentForm';
import type { CounterAgent } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

async function getAgentById(id: string): Promise<CounterAgent | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/counter-agents/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    // This will activate the closest `error.js` Error Boundary if not 404
    throw new Error(`Failed to fetch counter agent with ID ${id}: ${res.statusText}`);
  }
  try {
    return await res.json();
  } catch (e) {
    console.error("Failed to parse agent JSON:", e);
    throw new Error(`Failed to parse agent data for ID ${id}`);
  }
}

export default async function EditCounterAgentPage({ params }: { params: { id: string } }) {
  const agentIdFromParams = params.id;
  let agent: CounterAgent | null = null;
  let fetchError: string | null = null;

  try {
    agent = await getAgentById(agentIdFromParams);
  } catch (error: any) {
    fetchError = error.message || `Не удалось загрузить данные для агента с ID ${agentIdFromParams}.`;
  }

  if (fetchError) {
     return (
      <div className="container mx-auto py-8">
        <PageHeader title="Редактировать контрагента" description="Ошибка загрузки данных агента." />
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ошибка Загрузки</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader title="Редактировать контрагента" description="Ошибка загрузки данных агента." />
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Агент не найден</AlertTitle>
          <AlertDescription>
            Контрагент с ID "{agentIdFromParams}" не найден. Возможно, он был удален или ID указан неверно.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title={`Редактировать контрагента`}
        description={`Обновление данных для ${agent.name}.`}
      />
      <CounterAgentForm initialData={agent} agentId={agentIdFromParams} />
    </div>
  );
}
