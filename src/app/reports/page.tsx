
export const dynamic = 'force-dynamic';

import PageHeader from '@/components/layout/PageHeader';
import { AIReportGenerator } from './components/AIReportGenerator';

export default async function AIReportsPage() {
  return (
    <div className="container mx-auto py-4 md:py-8">
      <PageHeader
        title="AI-Аналитика"
        description="Создавайте информативные отчеты об операциях вашей автомойки с помощью искусственного интеллекта."
      />
      <AIReportGenerator />
    </div>
  );
}
