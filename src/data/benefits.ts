import { MembershipTier, Partner, PartnerCategory, TelephonyProvider } from '@/types/benefits';

export const membershipTiers: MembershipTier[] = [
  {
    level: 'bronze',
    name: 'Bronze',
    icon: '🥉',
    minRides: 0,
    cashbackPercent: 5,
    color: 'hsl(30, 50%, 50%)',
    benefits: [
      'Descontos básicos em parceiros',
      '5% de cashback',
      'Suporte via chat'
    ]
  },
  {
    level: 'prata',
    name: 'Prata',
    icon: '🥈',
    minRides: 20,
    cashbackPercent: 10,
    color: 'hsl(0, 0%, 70%)',
    benefits: [
      '+10% cashback',
      'Ofertas exclusivas',
      'Prioridade no atendimento',
      'Corridas em 3x sem juros'
    ]
  },
  {
    level: 'ouro',
    name: 'Ouro',
    icon: '🥇',
    minRides: 50,
    cashbackPercent: 20,
    color: 'hsl(45, 90%, 50%)',
    benefits: [
      '+20% cashback',
      'Brindes mensais',
      'Motoristas premium',
      'Cancelamento flexível'
    ]
  },
  {
    level: 'diamante',
    name: 'Diamante',
    icon: '💎',
    minRides: 100,
    cashbackPercent: 30,
    color: 'hsl(160, 60%, 45%)',
    benefits: [
      '+30% cashback',
      'Experiências VIP',
      'Gerente de conta dedicado',
      'Upgrades gratuitos de veículo'
    ]
  }
];

export const partnerCategories: PartnerCategory[] = [
  { id: 'moda', name: 'Moda e Vestuário', icon: '👗' },
  { id: 'mercado', name: 'Conveniências e Mercados', icon: '🏪' },
  { id: 'shopping', name: 'Shopping e Entretenimento', icon: '🏬' },
  { id: 'alimentacao', name: 'Alimentação', icon: '☕' },
  { id: 'saude', name: 'Saúde e Bem-estar', icon: '💊' }
];

export const partners: Partner[] = [
  // Moda
  { id: '1', name: 'Renner', category: 'moda', benefit: '15% off em compras acima de R$ 150', discount: '15%' },
  { id: '2', name: 'C&A', category: 'moda', benefit: '10% off + frete grátis', discount: '10%' },
  { id: '3', name: 'Riachuelo', category: 'moda', benefit: 'Cupom R$ 30 na primeira compra', discount: 'R$30' },
  { id: '4', name: 'Marisa', category: 'moda', benefit: '20% off em seleção especial', discount: '20%' },
  
  // Mercado
  { id: '5', name: 'AM/PM', category: 'mercado', benefit: 'Cashback de 5% em compras', discount: '5%' },
  { id: '6', name: 'Oxxo', category: 'mercado', benefit: 'Combo especial MOVA (lanche + bebida)', discount: 'Combo' },
  { id: '7', name: 'Pão de Açúcar', category: 'mercado', benefit: '10% off no app', discount: '10%' },
  { id: '8', name: 'Carrefour Express', category: 'mercado', benefit: 'Desconto em produtos selecionados', discount: 'Vários' },
  
  // Shopping
  { id: '9', name: 'Cinemark', category: 'shopping', benefit: 'Ingresso por R$ 19,90 (seg a qua)', discount: 'R$19,90' },
  { id: '10', name: 'iFood', category: 'shopping', benefit: 'R$ 15 off no primeiro pedido', discount: 'R$15' },
  { id: '11', name: 'Magalu', category: 'shopping', benefit: '5% cashback', discount: '5%' },
  { id: '12', name: 'Americanas', category: 'shopping', benefit: 'Frete grátis em compras MOVA', discount: 'Frete' },
  
  // Alimentação
  { id: '13', name: 'Starbucks', category: 'alimentacao', benefit: 'Bebida média pelo preço da pequena', discount: 'Upgrade' },
  { id: '14', name: "McDonald's", category: 'alimentacao', benefit: 'McOferta especial MOVA', discount: 'Combo' },
  { id: '15', name: 'Burger King', category: 'alimentacao', benefit: 'Casquinha grátis em combos', discount: 'Grátis' },
  { id: '16', name: 'Subway', category: 'alimentacao', benefit: 'Cookie grátis em sanduíches 30cm', discount: 'Grátis' },
  
  // Saúde
  { id: '17', name: 'Droga Raia', category: 'saude', benefit: '15% off em medicamentos', discount: '15%' },
  { id: '18', name: 'Drogasil', category: 'saude', benefit: 'Cashback de 3%', discount: '3%' },
  { id: '19', name: 'Smart Fit', category: 'saude', benefit: 'Primeira mensalidade grátis', discount: '1ª Grátis' },
  { id: '20', name: 'Sesc', category: 'saude', benefit: 'Desconto em atividades culturais', discount: 'Vários' }
];

export const telephonyProviders: TelephonyProvider[] = [
  {
    id: 'tim',
    name: 'TIM',
    color: 'hsl(210, 100%, 40%)',
    benefits: ['5GB extras por mês', '30% off em recarga', 'Ligações ilimitadas TIM-TIM'],
    extraData: '5GB',
    discount: '30%'
  },
  {
    id: 'claro',
    name: 'Claro',
    color: 'hsl(0, 80%, 50%)',
    benefits: ['3GB extras por mês', 'Desconto em fatura', 'WhatsApp ilimitado'],
    extraData: '3GB',
    discount: '20%'
  },
  {
    id: 'vivo',
    name: 'Vivo',
    color: 'hsl(280, 70%, 50%)',
    benefits: ['4GB extras por mês', 'Ligações ilimitadas', 'Vivo Play incluso'],
    extraData: '4GB',
    discount: '25%'
  }
];
