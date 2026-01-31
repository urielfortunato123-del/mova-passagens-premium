import { useState } from 'react';
import { Smartphone, Check, ChevronRight, Wifi, Phone, MessageCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { telephonyProviders } from '@/data/benefits';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function Telephony() {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleActivate = (providerId: string) => {
    setSelectedProvider(providerId);
    setDialogOpen(true);
  };

  const handleConfirmActivation = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Número inválido',
        description: 'Digite um número de telefone válido.',
      });
      return;
    }

    const provider = telephonyProviders.find(p => p.id === selectedProvider);
    
    toast({
      title: 'Benefício ativado!',
      description: `Seus benefícios ${provider?.name} serão ativados em até 24h.`,
    });
    
    setDialogOpen(false);
    setPhoneNumber('');
    setSelectedProvider(null);
  };

  return (
    <>
      <Header title="Telefonia & Internet" showBack />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          {/* Hero */}
          <div className="premium-card p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              Economize na sua conta de celular
            </h2>
            <p className="text-sm text-muted-foreground">
              Como usuário MOVA+, você tem benefícios exclusivos nas principais operadoras
            </p>
          </div>

          {/* Providers */}
          <div className="space-y-4">
            <h3 className="font-semibold">Escolha sua operadora</h3>
            
            {telephonyProviders.map(provider => (
              <div
                key={provider.id}
                className="premium-card overflow-hidden"
              >
                {/* Provider Header */}
                <div 
                  className="p-4 flex items-center justify-between"
                  style={{ borderLeft: `4px solid ${provider.color}` }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: provider.color }}
                    >
                      {provider.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{provider.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          +{provider.extraData} extras
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                          {provider.discount} off
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="px-4 pb-4 space-y-2">
                  {provider.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                  
                  <Button 
                    onClick={() => handleActivate(provider.id)}
                    className="w-full mt-3"
                    variant="outline"
                  >
                    Ativar Benefícios
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="space-y-4">
            <h3 className="font-semibold">Como Funciona</h3>
            
            <div className="space-y-3">
              <div className="premium-card p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Escolha sua operadora</p>
                  <p className="text-sm text-muted-foreground">
                    Selecione a operadora que você já usa
                  </p>
                </div>
              </div>

              <div className="premium-card p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Vincule seu número</p>
                  <p className="text-sm text-muted-foreground">
                    Informe seu número de celular atual
                  </p>
                </div>
              </div>

              <div className="premium-card p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Aproveite!</p>
                  <p className="text-sm text-muted-foreground">
                    Benefícios ativados automaticamente na sua conta
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="premium-card p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-center">
              📱 <span className="font-medium">Sem troca de chip!</span> Continue com seu número atual
            </p>
          </div>
        </div>
      </PageContainer>

      {/* Activation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ativar Benefícios</DialogTitle>
            <DialogDescription>
              Digite seu número de celular para vincular os benefícios
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Número do celular</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(11) 99999-9999"
                className="h-12"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Você receberá um SMS de confirmação neste número
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmActivation}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
