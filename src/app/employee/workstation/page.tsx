
import PageHeader from '@/components/layout/PageHeader';
import { WorkstationConsole } from '@/components/employee/WorkstationConsole';

export default function WorkstationPage() {
  return (
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title="Рабочая станция"
        description="Управление сменами и регистрация новых моек."
      />
      <WorkstationConsole />
    </div>
  );
}
