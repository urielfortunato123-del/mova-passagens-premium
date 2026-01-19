import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, LogOut, ChevronRight, Loader2, Settings, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Profile() {
  const navigate = useNavigate();
  const { passengerProfile, logout, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: passengerProfile?.name || '',
    phone: passengerProfile?.phone || '',
    city: passengerProfile?.city || '',
  });

  const handleUpdate = async () => {
    if (!passengerProfile) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('passenger_profiles')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          city: formData.city || null,
        })
        .eq('id', passengerProfile.id);

      if (error) throw error;

      await refreshProfile();
      setEditOpen(false);
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <Header title="Perfil" />
      <PageContainer>
        <div className="space-y-4 animate-fade-in">
          {/* Profile Card */}
          <div className="premium-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{passengerProfile?.name}</h2>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-status-confirmed" />
                  <span className="text-sm text-status-confirmed font-medium">Cliente ativo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="premium-card p-4 space-y-4">
            <h3 className="text-sm text-muted-foreground font-medium">Contato</h3>
            
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">{passengerProfile?.email}</span>
            </div>
            
            {passengerProfile?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">{passengerProfile.phone}</span>
              </div>
            )}
          </div>

          {/* Location Section */}
          {passengerProfile?.city && (
            <div className="premium-card p-4 space-y-4">
              <h3 className="text-sm text-muted-foreground font-medium">Localização</h3>
              
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">{passengerProfile.city}</span>
              </div>
            </div>
          )}

          {/* Edit Profile */}
          <button
            onClick={() => {
              setFormData({
                name: passengerProfile?.name || '',
                phone: passengerProfile?.phone || '',
                city: passengerProfile?.city || '',
              });
              setEditOpen(true);
            }}
            className="w-full premium-card p-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Editar Perfil</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-4 text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
            <ChevronRight className="w-5 h-5 ml-auto" />
          </button>
        </div>
      </PageContainer>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>
              Atualize suas informações pessoais
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="São Paulo"
                className="h-12"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
