export type CompanyRole = 'TRADER' | 'PARTNER' | 'INSTITUTIONAL';

export type LogisticsServiceType = 'MARITIME' | 'AIR' | 'CUSTOMS' | 'WAREHOUSE';

export type InstitutionalScope = 'NACIONAL' | 'PROVINCIAL' | 'MUNICIPAL';

export interface OnboardingState {
  step: number;
  role: CompanyRole | null;
  services: LogisticsServiceType[];
  routes: { origin: string; destination: string }[];
  institutional?: {
    jurisdiction: InstitutionalScope;
    sector: string;
    verifiedServices: string[];
  };
  verification?: {
    email: string;
    file?: File;
  };
}

export const ROLES_INFO = {
  TRADER: {
    title: 'COMERCIANTE (Trader)',
    description: 'Compro o Vendo productos (Importador, Exportador, Fabricante, PyME)',
    icon: 'globe'
  },
  PARTNER: {
    title: 'LOGÍSTICA Y SERVICIOS (Partner)',
    description: 'Transporto carga, gestiono aduanas, aseguro mercadería',
    icon: 'truck'
  },
  INSTITUTIONAL: {
    title: 'INSTITUCIONAL',
    description: 'Organismo del Estado, Cámara de Comercio, ONG',
    icon: 'building'
  }
};
