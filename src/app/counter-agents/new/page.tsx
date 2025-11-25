import PageHeader from '@/components/layout/PageHeader';
import { CounterAgentForm } from '../components/CounterAgentForm';

export default function NewCounterAgentPage() {
  return (
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title="Новый контрагент"
        description="Добавьте нового корпоративного клиента в систему."
      />
      <CounterAgentForm />
    </div>
  );
}
