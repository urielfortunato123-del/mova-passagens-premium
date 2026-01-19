import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { ScheduleForm } from '@/components/booking/ScheduleForm';

export default function Schedule() {
  return (
    <>
      <Header title="Agendar corrida" showBack />
      <PageContainer>
        <div className="animate-fade-in">
          <p className="text-muted-foreground text-sm mb-6">
            Preencha os dados para agendar sua corrida executiva
          </p>
          <ScheduleForm />
        </div>
      </PageContainer>
    </>
  );
}
