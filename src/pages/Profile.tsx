import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, LogOut, Star, ChevronRight, Loader2, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  const { theme, setTheme, resolvedTheme } = useTheme();
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
        <div className="space-y-6 animate-fade-in">
          {/* Profile Header */}
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <User className="w-12 h-12 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{passengerProfile?.name}</h2>
              <p className="text-muted-foreground">{passengerProfile?.email}</p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setFormData({
                  name: passengerProfile?.name || '',
                  phone: passengerProfile?.phone || '',
                  city: passengerProfile?.city || '',
                });
                setEditOpen(true);
              }}
              className="w-full premium-card p-4 flex items-center gap-4 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Dados pessoais</p>
                <p className="font-medium">{passengerProfile?.name}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {passengerProfile?.phone && (
              <div className="premium-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{passengerProfile.phone}</p>
                </div>
              </div>
            )}

            <div className="premium-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{passengerProfile?.email}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/favorites')}
              className="w-full premium-card p-4 flex items-center gap-4 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Star className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Endereços favoritos</p>
                <p className="font-medium">Gerenciar locais salvos</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Theme Toggle */}
            <div className="premium-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                {resolvedTheme === 'dark' ? (
                  <Moon className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Sun className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Aparência</p>
                <p className="font-medium">
                  {resolvedTheme === 'dark' ? 'Modo escuro' : 'Modo claro'}
                </p>
              </div>
              <Switch
                checked={resolvedTheme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="destructive"
            className="w-full h-12"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sair da conta
          </Button>
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
