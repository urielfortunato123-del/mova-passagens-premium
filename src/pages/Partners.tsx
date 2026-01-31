import { useState } from 'react';
import { Search, Tag, ExternalLink } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { partners, partnerCategories } from '@/data/benefits';
import { cn } from '@/lib/utils';

export default function Partners() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(search.toLowerCase()) ||
                          partner.benefit.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || partner.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedPartners = partnerCategories.map(category => ({
    ...category,
    partners: filteredPartners.filter(p => p.category === category.id)
  })).filter(group => group.partners.length > 0);

  return (
    <>
      <Header title="Parceiros" showBack />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar parceiro ou benefício..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                !selectedCategory 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              )}
            >
              Todos
            </button>
            {partnerCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2',
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* Partners List */}
          {groupedPartners.length > 0 ? (
            <div className="space-y-6">
              {groupedPartners.map(group => (
                <div key={group.id} className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span>{group.icon}</span>
                    {group.name}
                  </h3>
                  <div className="grid gap-3">
                    {group.partners.map(partner => (
                      <div
                        key={partner.id}
                        className="premium-card p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-lg font-bold">
                            {partner.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{partner.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {partner.benefit}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2 shrink-0 bg-primary/10 text-primary border-0">
                          {partner.discount}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-medium">Nenhum parceiro encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente buscar por outro termo
              </p>
            </div>
          )}

          {/* Info */}
          <div className="premium-card p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-center">
              💡 <span className="font-medium">Dica:</span> Quanto maior seu nível MOVA+, maiores os descontos!
            </p>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
