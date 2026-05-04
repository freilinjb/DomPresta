import { settingsService } from './settingsService';

export type ConfigKey =
  | 'currency'
  | 'currencyCode'
  | 'decimalSep'
  | 'thousandSep'
  | 'symbolPosition'
  | 'dateFormat'
  | 'ticketFooter'
  | 'showLogo'
  | 'showRNC'
  | 'showBalance'
  | 'showSignature'
  | 'copies'
  | 'paperSize'
  | 'autoPrint'
  | 'companyName'
  | 'companyRNC'
  | 'companyPhone'
  | 'companyAddress'
  | 'companyEmail'
  | 'companySlogan'
  | 'defaultAmount'
  | 'defaultTerm'
  | 'defaultRate'
  | 'minAmount'
  | 'maxAmount'
  | 'payFreq'
  | 'interestType'
  | 'penaltyType'
  | 'penaltyRate'
  | 'graceDays'
  | 'autoCalcInterest'
  | 'allowPartial'
  | 'requireGuarantor'
  | 'language'
  | 'locale';

export interface ConfigState {
  currency: string;
  currencyCode: string;
  decimalSep: string;
  thousandSep: string;
  symbolPosition: 'left' | 'right';
  dateFormat: string;
  ticketFooter: string;
  showLogo: boolean;
  showRNC: boolean;
  showBalance: boolean;
  showSignature: boolean;
  copies: number;
  paperSize: string;
  autoPrint: boolean;
  companyName: string;
  companyRNC: string;
  companyPhone: string;
  companyAddress: string;
  companyEmail: string;
  companySlogan: string;
  defaultAmount: number;
  defaultTerm: number;
  defaultRate: number;
  minAmount: number;
  maxAmount: number;
  payFreq: string;
  interestType: string;
  penaltyType: string;
  penaltyRate: number;
  graceDays: number;
  autoCalcInterest: boolean;
  allowPartial: boolean;
  requireGuarantor: boolean;
  language: 'es' | 'en';
  locale: string;
}

const DEFAULTS: ConfigState = {
  currency: 'RD$',
  currencyCode: 'DOP',
  decimalSep: '.',
  thousandSep: ',',
  symbolPosition: 'left',
  dateFormat: 'dd/MM/yyyy',
  ticketFooter: 'Gracias por su preferencia. DomPresta.',
  showLogo: true,
  showRNC: true,
  showBalance: true,
  showSignature: true,
  copies: 1,
  paperSize: 'A4',
  autoPrint: false,
  companyName: 'DomPresta',
  companyRNC: '',
  companyPhone: '',
  companyAddress: '',
  companyEmail: '',
  companySlogan: '',
  defaultAmount: 5000,
  defaultTerm: 12,
  defaultRate: 15,
  minAmount: 1000,
  maxAmount: 1000000,
  payFreq: 'monthly',
  interestType: 'fijo',
  penaltyType: 'Porcentaje diario',
  penaltyRate: 5,
  graceDays: 3,
  autoCalcInterest: true,
  allowPartial: true,
  requireGuarantor: false,
  language: 'es',
  locale: 'es-DO',
};

let state: ConfigState = { ...DEFAULTS };

const parseBool = (value: string | null, fallback: boolean): boolean => {
  if (value === null || value === undefined) return fallback;
  return value === '1' || value.toLowerCase() === 'true';
};

const parseNumber = (value: string | null, fallback: number): number => {
  if (!value || Number.isNaN(Number(value))) return fallback;
  return Number(value);
};

const parseString = (value: string | null, fallback: string): string => {
  return value ?? fallback;
};

const normalizeSettings = (settings: { key: string; value: string }[]): ConfigState => {
  const result: ConfigState = { ...DEFAULTS };
  settings.forEach(({ key, value }) => {
    switch (key) {
      case 'currency': result.currency = value; break;
      case 'currencyCode': result.currencyCode = value; break;
      case 'decimalSep': result.decimalSep = value; break;
      case 'thousandSep': result.thousandSep = value; break;
      case 'symbolPosition': result.symbolPosition = value === 'right' ? 'right' : 'left'; break;
      case 'dateFormat': result.dateFormat = value; break;
      case 'ticketFooter': result.ticketFooter = value; break;
      case 'showLogo': result.showLogo = parseBool(value, result.showLogo); break;
      case 'showRNC': result.showRNC = parseBool(value, result.showRNC); break;
      case 'showBalance': result.showBalance = parseBool(value, result.showBalance); break;
      case 'showSignature': result.showSignature = parseBool(value, result.showSignature); break;
      case 'copies': result.copies = parseNumber(value, result.copies); break;
      case 'paperSize': result.paperSize = value; break;
      case 'autoPrint': result.autoPrint = parseBool(value, result.autoPrint); break;
      case 'companyName': result.companyName = value; break;
      case 'companyRNC': result.companyRNC = value; break;
      case 'companyPhone': result.companyPhone = value; break;
      case 'companyAddress': result.companyAddress = value; break;
      case 'companyEmail': result.companyEmail = value; break;
      case 'companySlogan': result.companySlogan = value; break;
      case 'defaultAmount': result.defaultAmount = parseNumber(value, result.defaultAmount); break;
      case 'defaultTerm': result.defaultTerm = parseNumber(value, result.defaultTerm); break;
      case 'defaultRate': result.defaultRate = parseNumber(value, result.defaultRate); break;
      case 'minAmount': result.minAmount = parseNumber(value, result.minAmount); break;
      case 'maxAmount': result.maxAmount = parseNumber(value, result.maxAmount); break;
      case 'payFreq': result.payFreq = value; break;
      case 'interestType': result.interestType = value; break;
      case 'penaltyType': result.penaltyType = value; break;
      case 'penaltyRate': result.penaltyRate = parseNumber(value, result.penaltyRate); break;
      case 'graceDays': result.graceDays = parseNumber(value, result.graceDays); break;
      case 'autoCalcInterest': result.autoCalcInterest = parseBool(value, result.autoCalcInterest); break;
      case 'allowPartial': result.allowPartial = parseBool(value, result.allowPartial); break;
      case 'requireGuarantor': result.requireGuarantor = parseBool(value, result.requireGuarantor); break;
      case 'language': result.language = (value === 'en' ? 'en' : 'es'); break;
      case 'locale': result.locale = value || result.locale; break;
      default: break;
    }
  });
  return result;
};

const buildFormattedNumber = (value: number, decimals: number, decimalSep: string, thousandSep: string) => {
  const fixed = value.toFixed(decimals);
  const [integer, fraction] = fixed.split('.');
  const integerWithSep = integer.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
  if (decimals === 0) return integerWithSep;
  return `${integerWithSep}${decimalSep}${fraction}`;
};

const formatDatePattern = (value: Date | string, format: string): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  const patterns: Record<string, string> = {
    'dd/MM/yyyy': `${day}/${month}/${year}`,
    'MM/dd/yyyy': `${month}/${day}/${year}`,
    'yyyy-MM-dd': `${year}-${month}-${day}`,
    'dd.MM.yyyy': `${day}.${month}.${year}`,
  };
  return patterns[format] ?? `${day}/${month}/${year}`;
};

export const configService = {
  async initialize(): Promise<void> {
    try {
      const settings = await settingsService.getAll();
      state = normalizeSettings(settings.map(({ key, value }) => ({ key, value })));
    } catch (error) {
      console.error('Error initializing configService:', error);
    }
  },

  get<K extends keyof ConfigState>(key: K): ConfigState[K] {
    return state[key];
  },

  async set<K extends keyof ConfigState>(key: K, value: ConfigState[K]): Promise<void> {
    state[key] = value;
    try {
      await settingsService.set(key, String(value));
    } catch (error) {
      console.error('Error persisting config key:', key, error);
    }
  },

  async refresh(): Promise<void> {
    await this.initialize();
  },

  formatNumber(value: number, decimals = 2): string {
    return buildFormattedNumber(value, decimals, state.decimalSep, state.thousandSep);
  },

  formatCurrency(value: number, decimals = 2): string {
    const formatted = this.formatNumber(value, decimals);
    return state.symbolPosition === 'right'
      ? `${formatted} ${state.currency}`
      : `${state.currency}${formatted}`;
  },

  formatCurrencyShort(value: number): string {
    if (Math.abs(value) >= 1_000_000) return this.formatCurrency(value / 1_000_000, 1) + 'M';
    if (Math.abs(value) >= 1_000) return this.formatCurrency(value / 1_000, 1) + 'K';
    return this.formatCurrency(value, 0);
  },

  formatDate(value?: Date | string): string {
    if (!value) return 'N/A';
    return formatDatePattern(value, state.dateFormat);
  },

  getReceiptFooter(): string {
    return state.ticketFooter;
  },

  getReceiptSettings() {
    return {
      companyName: state.companyName,
      companyPhone: state.companyPhone,
      companyAddress: state.companyAddress,
      companyEmail: state.companyEmail,
      companyRNC: state.companyRNC,
      companySlogan: state.companySlogan,
      ticketFooter: state.ticketFooter,
      showLogo: state.showLogo,
      showRNC: state.showRNC,
      showBalance: state.showBalance,
      showSignature: state.showSignature,
      copies: state.copies,
      paperSize: state.paperSize,
      autoPrint: state.autoPrint,
      currency: state.currency,
      currencyCode: state.currencyCode,
      locale: state.locale,
    };
  },
};
