// ─── Tipos de Cliente ──────────────────────────────────────────────
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: 'cedula' | 'passport' | 'rnc';
  documentNumber: string;
  monthlyIncome: number;
  occupation: string;
  address: string;
  city: string;
  status: 'active' | 'inactive' | 'blocked';
  totalLoans: number;
  activeLoans: number;
  totalAmount: number;
  lastContact: string;
  createdAt: string;
  creditScore?: number;
  avatar?: string;
  updatedAt?: string;
}

// ─── Tipos de Préstamo ─────────────────────────────────────────────
export interface Loan {
  id: string;
  borrowerName: string;
  clientId?: string;
  amount: number;
  interestRate?: number;
  term?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  status: 'pending' | 'active' | 'paid' | 'overdue' | 'cancelled' | 'review';
  paymentFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  totalPaid?: number;
  remainingBalance?: number;
  nextPaymentDate?: string;
  payments?: Payment[];
  createdAt: string | Date;
  updatedAt?: string | Date;
}

// ─── Tipos de Pago ─────────────────────────────────────────────────
export interface Payment {
  id: string;
  loanId: string;
  clientId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'transfer' | 'card' | 'check';
  reference?: string;
  notes?: string;
  createdAt: string;
}

// ─── Tipos de Usuario ──────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'viewer';
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Tipos de Notificación ─────────────────────────────────────────
export interface Notification {
  id: string;
  type: 'payment_due' | 'payment_received' | 'loan_approved' | 'loan_overdue' | 'client_added';
  title: string;
  message: string;
  clientId?: string;
  loanId?: string;
  read: boolean;
  createdAt: string;
}

// ─── Tipos de Configuración ────────────────────────────────────────
export interface AppSettings {
  currency: string;
  language: 'es' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    paymentReminders: boolean;
    newClientAlerts: boolean;
  };
  interestRates: {
    min: number;
    max: number;
    default: number;
  };
}

// ─── Tipos de Estadísticas ─────────────────────────────────────────
export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalLoans: number;
  activeLoans: number;
  totalAmount: number;
  pendingPayments: number;
  overduePayments: number;
  monthlyRevenue: number;
  growth: {
    clients: number;
    loans: number;
    revenue: number;
  };
}

export interface ClientStats {
  totalLoans: number;
  activeLoans: number;
  totalBorrowed: number;
  totalPaid: number;
  onTimePayments: number;
  latePayments: number;
  averagePaymentTime: number;
}

// ─── Tipos de Filtros ──────────────────────────────────────────────
export type ClientFilterType = 'all' | 'active' | 'inactive' | 'blocked' | 'withLoans' | 'noLoans';
export type ClientSortType = 'recent' | 'name' | 'loans_high' | 'loans_low' | 'amount_high' | 'amount_low' | 'credit_high' | 'credit_low';

export type LoanFilterType = 'all' | 'active' | 'pending' | 'paid' | 'overdue' | 'cancelled';
export type LoanSortType = 'recent' | 'amount_high' | 'amount_low' | 'date_asc' | 'date_desc';

export type PaymentFilterType = 'all' | 'today' | 'week' | 'month' | 'overdue';
export type PaymentSortType = 'recent' | 'amount_high' | 'amount_low';

// ─── Tipos de Formularios ──────────────────────────────────────────
export interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: 'cedula' | 'passport' | 'rnc';
  documentNumber: string;
  monthlyIncome: number;
  occupation: string;
  address: string;
  city: string;
  status?: 'active' | 'inactive' | 'blocked';
}

export interface LoanFormData {
  clientId: string;
  amount: number;
  interestRate: number;
  term: number;
  paymentFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  startDate: string;
  notes?: string;
}

export interface PaymentFormData {
  loanId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'transfer' | 'card' | 'check';
  reference?: string;
  notes?: string;
}

// ─── Tipos de Validación ───────────────────────────────────────────
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ─── Tipos de Respuesta API ────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Tipos de Navegación ───────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Clients: undefined;
  Loans: undefined;
  Payments: undefined;
  Profile: undefined;
};

export type ClientsStackParamList = {
  ClientsList: undefined;
  ClientDetails: { clientId: string };
  ClientForm: { clientId?: string; onSubmit?: (data: any) => void };
};

export type LoansStackParamList = {
  LoansList: undefined;
  LoanDetails: { loanId: string };
  LoanForm: { clientId?: string; loanId?: string };
  PaymentSchedule: { loanId: string };
};

// ─── Tipos de Estado Global ────────────────────────────────────────
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  theme: 'light' | 'dark' | 'system';
  settings: AppSettings;
  notifications: Notification[];
  lastSync: string | null;
}

export interface ClientsState {
  clients: Client[];
  selectedClient: Client | null;
  filters: {
    search: string;
    status: ClientFilterType;
    sortBy: ClientSortType;
  };
  stats: ClientStats | null;
}

export interface LoansState {
  loans: Loan[];
  selectedLoan: Loan | null;
  filters: {
    search: string;
    status: LoanFilterType;
    sortBy: LoanSortType;
  };
}

// ─── Tipos de Eventos ──────────────────────────────────────────────
export interface AppEvent {
  type: 
    | 'CLIENT_CREATED'
    | 'CLIENT_UPDATED'
    | 'CLIENT_DELETED'
    | 'LOAN_CREATED'
    | 'LOAN_UPDATED'
    | 'LOAN_DELETED'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_UPDATED'
    | 'NOTIFICATION_RECEIVED'
    | 'USER_LOGIN'
    | 'USER_LOGOUT'
    | 'DATA_SYNCED';
  payload?: any;
  timestamp: string;
}

// ─── Tipos de Reportes ─────────────────────────────────────────────
export interface Report {
  id: string;
  type: 'clients' | 'loans' | 'payments' | 'revenue' | 'overdue';
  title: string;
  description?: string;
  dateRange: {
    start: string;
    end: string;
  };
  data: any;
  generatedAt: string;
  format: 'pdf' | 'excel' | 'csv';
}

export interface ReportFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  clientId?: string;
  status?: string[];
  minAmount?: number;
  maxAmount?: number;
}

// ─── Tipos de Utilidad ─────────────────────────────────────────────
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  icon?: string;
  color?: string;
}

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  icon?: string;
  destructive?: boolean;
}

// ─── Constantes de Tipo ────────────────────────────────────────────
export const DOCUMENT_TYPES = {
  cedula: 'Cédula',
  passport: 'Pasaporte',
  rnc: 'RNC',
} as const;

export const CLIENT_STATUS = {
  active: 'Activo',
  inactive: 'Inactivo',
  blocked: 'Bloqueado',
} as const;

export const LOAN_STATUS = {
  pending: 'Pendiente',
  active: 'Activo',
  paid: 'Pagado',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
} as const;

export const PAYMENT_METHODS = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  check: 'Cheque',
} as const;

export const PAYMENT_FREQUENCIES = {
  daily: 'Diario',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
} as const;

export const USER_ROLES = {
  admin: 'Administrador',
  agent: 'Agente',
  viewer: 'Visualizador',
} as const;