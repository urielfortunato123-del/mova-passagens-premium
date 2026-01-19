import { useState } from 'react';
import { Star, Home, Briefcase, Dumbbell, MapPin, Plus, Trash2, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFavorites, useAddFavorite, useDeleteFavorite } from '@/hooks/useFavorites';
import { FavoriteLabel } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const labelIcons: Record<FavoriteLabel, typeof Home> = {
  Casa: Home,
  Trabalho: Briefcase,
  Academia: Dumbbell,
  Outro: MapPin,
};

const labelColors: Record<FavoriteLabel, string> = {
  Casa: 'text-blue-400',
  Trabalho: 'text-amber-400',
  Academia: 'text-green-400',
  Outro: 'text-purple-400',
};

export default function Favorites() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState<FavoriteLabel>('Casa');
  const [newAddress, setNewAddress] = useState('');
  const { data: favorites = [], isLoading } = useFavorites();
  const addFavorite = useAddFavorite();
  const deleteFavorite = useDeleteFavorite();

  const handleAdd = async () => {
    if (!newAddress.trim()) return;

    await addFavorite.mutateAsync({
      label: newLabel,
      address: newAddress.trim(),
    });

    setNewAddress('');
    setAddDialogOpen(false);
  };

  return (
    <>
      <Header title="Endereços favoritos" showBack />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          {/* Add Button */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full h-14">
                <Plus className="w-5 h-5 mr-2" />
                Adicionar endereço favorito
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo endereço</DialogTitle>
                <DialogDescription>
                  Salve um endereço para usar rapidamente no agendamento
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={newLabel} onValueChange={(v) => setNewLabel(v as FavoriteLabel)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['Casa', 'Trabalho', 'Academia', 'Outro'] as FavoriteLabel[]).map((label) => {
                        const Icon = labelIcons[label];
                        return (
                          <SelectItem key={label} value={label}>
                            <div className="flex items-center gap-2">
                              <Icon className={cn('w-4 h-4', labelColors[label])} />
                              {label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Rua, número, bairro, cidade"
                    className="h-12"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleAdd}
                  disabled={!newAddress.trim() || addFavorite.isPending}
                >
                  {addFavorite.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar endereço'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Favorites List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Star className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium mt-4">Nenhum endereço salvo</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Adicione endereços frequentes para agendar mais rápido
                </p>
              </div>
            ) : (
              favorites.map((favorite) => {
                const Icon = labelIcons[favorite.label] || MapPin;
                return (
                  <div
                    key={favorite.id}
                    className="premium-card p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <Icon className={cn('w-6 h-6', labelColors[favorite.label] || 'text-muted-foreground')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{favorite.label}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {favorite.address}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive shrink-0"
                      onClick={() => deleteFavorite.mutate(favorite.id)}
                      disabled={deleteFavorite.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
