import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { ScheduleForm } from '@/components/booking/ScheduleForm';

export default function Schedule() {
  return (
    <>
      <Header title="Pedir MOVA" showBack />
      <PageContainer>
        <div className="animate-fade-in">
          <p className="text-muted-foreground text-sm mb-6">
            Solicite uma corrida agora ou agende para depois
          </p>
          <ScheduleForm />
        </div>
      </PageContainer>
    </>
  );
}
