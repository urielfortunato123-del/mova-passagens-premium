import { useState, useEffect } from 'react';
import { Download, Share, Car } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <>
      <Header title="Instalar MOVA" showBack />
      <PageContainer>
        <div className="space-y-8 animate-fade-in text-center">
          {/* Hero */}
          <div className="space-y-4 py-8">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Car className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">MOVA – Usuário</h1>
              <p className="text-muted-foreground mt-2">
                Instale o app para uma experiência completa
              </p>
            </div>
          </div>

          {/* Install options */}
          <div className="space-y-4">
            {isInstallable && (
              <Button onClick={handleInstall} className="w-full h-14 text-base">
                <Download className="w-5 h-5 mr-2" />
                Instalar aplicativo
              </Button>
            )}

            {isIOS && (
              <div className="premium-card p-6 text-left space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Share className="w-5 h-5" />
                  Como instalar no iPhone
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <span>Toque no ícone de compartilhar <Share className="w-4 h-4 inline" /> na barra do Safari</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <span>Role para baixo e toque em "Adicionar à Tela de Início"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <span>Toque em "Adicionar" no canto superior direito</span>
                  </li>
                </ol>
              </div>
            )}

            {!isIOS && !isInstallable && (
              <div className="premium-card p-6 text-left space-y-4">
                <h3 className="font-semibold">Como instalar no Android</h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <span>Toque no menu (três pontos) do Chrome</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <span>Toque em "Instalar aplicativo" ou "Adicionar à tela inicial"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <span>Confirme a instalação</span>
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Benefícios do aplicativo
            </h3>
            <div className="grid gap-3">
              {[
                'Acesso rápido pela tela inicial',
                'Funciona offline',
                'Notificações sobre suas corridas',
                'Experiência em tela cheia',
              ].map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary"
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
