// MOVA+ Loyalty Program Types

export type MembershipLevel = 'bronze' | 'prata' | 'ouro' | 'diamante';

export interface MembershipTier {
  level: MembershipLevel;
  name: string;
  icon: string;
  minRides: number;
  cashbackPercent: number;
  color: string;
  benefits: string[];
}

export interface PartnerCategory {
  id: string;
  name: string;
  icon: string;
}

export interface Partner {
  id: string;
  name: string;
  category: string;
  logo?: string;
  benefit: string;
  discount?: string;
}

export interface TelephonyProvider {
  id: string;
  name: string;
  logo?: string;
  color: string;
  benefits: string[];
  extraData: string;
  discount: string;
}

export interface BradescoFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface KmRedemption {
  id: string;
  title: string;
  description: string;
  kmCost: number;
}
