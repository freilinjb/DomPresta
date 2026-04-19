// App.tsx - Versión React Native completa con estilos StyleSheet (sin NativeWind)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  Switch,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// ============================================================
// DESIGN TOKENS
// ============================================================

const COLORS = {
  // Primarios
  indigo: '#4F46E5',
  indigoDark: '#3730A3',
  indigoLight: '#EEF2FF',
  violet: '#7C3AED',

  // Categorías
  green: '#059669',
  greenLight: '#ECFDF5',
  greenMid: '#10B981',
  orange: '#EA580C',
  orangeLight: '#FFF7ED',
  orangeMid: '#F97316',
  amber: '#D97706',
  amberLight: '#FFFBEB',

  // Semánticos
  red: '#EF4444',
  redLight: '#FEF2F2',
  blue: '#3B82F6',
  blueLight: '#EFF6FF',
  purple: '#8B5CF6',
  purpleLight: '#F5F3FF',

  // Neutros
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Sombras
  shadow: 'rgba(0,0,0,0.08)',
  shadowMd: 'rgba(0,0,0,0.12)',
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
};

// ============================================================
// INTERFACES
// ============================================================

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  document_id?: string;
  credit_score?: number;
  is_vip?: boolean;
}

interface Amortization {
  id: number;
  name: string;
  code: string;
  description: string;
}

interface PaymentMode {
  id: number;
  name: string;
  code: string;
  days_per_period: number;
}

interface AmortizationDetail {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  remaining: number;
  status?: string;
  payment_date?: string;
  is_weekend?: boolean;
}

interface CashBox {
  id: number;
  name: string;
  balance: number;
}

interface PaymentMethod {
  id: number;
  name: string;
  code: string;
}

interface LoanType {
  id: number;
  name: string;
  code: string;
  category: 'formal' | 'informal' | 'san' | 'micro';
  min_amount: number;
  max_amount: number;
  default_interest: number;
  default_term: number;
  requires_guarantor: boolean;
  requires_collateral: boolean;
}

interface GuaranteeType {
  id: number;
  name: string;
  code: string;
}

interface SanLoanConfig {
  daily_payment: number;
  term_days: number;
  interest_type: 'fixed' | 'percentage';
  interest_value: number;
  include_weekends: boolean;
  first_payment_delay: number;
}

interface InformalLoanConfig {
  payment_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interest_calculation: 'flat' | 'declining' | 'fixed_amount';
  grace_period: number;
  late_fee_percentage: number;
  early_payment_discount: number;
}

// ============================================================
// MOCK DATA
// ============================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_CUSTOMERS: Customer[] = [
  { id: 1, first_name: 'Juan', last_name: 'Pérez', phone: '809-555-1234', email: 'juan@email.com', document_id: '402-1234567-8', credit_score: 720, is_vip: true, address: 'Calle Principal #123' },
  { id: 2, first_name: 'María', last_name: 'González', phone: '809-555-5678', email: 'maria@email.com', document_id: '402-8765432-1', credit_score: 680, is_vip: false, address: 'Av. Lincoln #456' },
  { id: 3, first_name: 'Carlos', last_name: 'Rodríguez', phone: '809-555-9012', email: 'carlos@email.com', document_id: '402-3456789-0', credit_score: 550, is_vip: false, address: 'Calle Duarte #789' },
  { id: 4, first_name: 'Ana', last_name: 'Martínez', phone: '809-555-3456', email: 'ana@email.com', document_id: '402-9876543-2', credit_score: 800, is_vip: true, address: 'Av. Independencia #321' },
];

const MOCK_AMORTIZATIONS: Amortization[] = [
  { id: 1, name: 'Francés (Cuota Fija)', code: 'FRENCH', description: 'Pagos iguales, interés decreciente' },
  { id: 2, name: 'Alemán (Capital Fijo)', code: 'GERMAN', description: 'Capital constante, interés decreciente' },
  { id: 3, name: 'Americano', code: 'AMERICAN', description: 'Solo intereses, capital al final' },
  { id: 4, name: 'Flat (Interés Simple)', code: 'FLAT', description: 'Interés calculado sobre monto inicial' },
  { id: 5, name: 'San (Pago Diario Fijo)', code: 'SAN', description: 'Pagos diarios con interés predeterminado' },
  { id: 6, name: 'Gota a Gota', code: 'DROPLET', description: 'Pagos diarios con interés alto' },
];

const MOCK_PAYMENT_MODES: PaymentMode[] = [
  { id: 1, name: 'Mensual', code: 'monthly', days_per_period: 30 },
  { id: 2, name: 'Quincenal', code: 'biweekly', days_per_period: 15 },
  { id: 3, name: 'Semanal', code: 'weekly', days_per_period: 7 },
  { id: 4, name: 'Diario', code: 'daily', days_per_period: 1 },
  { id: 5, name: 'Diario (solo días hábiles)', code: 'business_daily', days_per_period: 1 },
];

const MOCK_LOAN_TYPES: LoanType[] = [
  { id: 1, name: 'Personal', code: 'PERSONAL', category: 'formal', min_amount: 5000, max_amount: 500000, default_interest: 12, default_term: 12, requires_guarantor: false, requires_collateral: false },
  { id: 2, name: 'Hipotecario', code: 'MORTGAGE', category: 'formal', min_amount: 500000, max_amount: 5000000, default_interest: 8, default_term: 180, requires_guarantor: false, requires_collateral: true },
  { id: 3, name: 'Vehículo', code: 'AUTO', category: 'formal', min_amount: 100000, max_amount: 2000000, default_interest: 10, default_term: 60, requires_guarantor: false, requires_collateral: true },
  { id: 4, name: 'Préstamo Rápido', code: 'QUICK', category: 'informal', min_amount: 1000, max_amount: 50000, default_interest: 20, default_term: 30, requires_guarantor: true, requires_collateral: false },
  { id: 5, name: 'Microcrédito', code: 'MICRO', category: 'informal', min_amount: 500, max_amount: 25000, default_interest: 15, default_term: 12, requires_guarantor: false, requires_collateral: false },
  { id: 6, name: 'San Tradicional', code: 'SAN_TRAD', category: 'san', min_amount: 1000, max_amount: 100000, default_interest: 20, default_term: 30, requires_guarantor: true, requires_collateral: false },
  { id: 7, name: 'San Express', code: 'SAN_EXPRESS', category: 'san', min_amount: 500, max_amount: 25000, default_interest: 25, default_term: 15, requires_guarantor: false, requires_collateral: false },
  { id: 8, name: 'San VIP', code: 'SAN_VIP', category: 'san', min_amount: 25000, max_amount: 200000, default_interest: 15, default_term: 60, requires_guarantor: true, requires_collateral: true },
];

const MOCK_CASH_BOXES: CashBox[] = [
  { id: 1, name: 'Caja Principal', balance: 150000 },
  { id: 2, name: 'Caja Secundaria', balance: 50000 },
  { id: 3, name: 'Caja de Préstamos', balance: 200000 },
];

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 1, name: 'Efectivo', code: 'cash' },
  { id: 2, name: 'Transferencia', code: 'transfer' },
  { id: 3, name: 'Cheque', code: 'check' },
  { id: 4, name: 'Depósito', code: 'deposit' },
];

const MOCK_GUARANTEE_TYPES: GuaranteeType[] = [
  { id: 1, name: 'Prendaria', code: 'pledge' },
  { id: 2, name: 'Hipotecaria', code: 'mortgage' },
  { id: 3, name: 'Personal', code: 'personal' },
  { id: 4, name: 'Aval', code: 'guarantor' },
  { id: 5, name: 'Electrodoméstico', code: 'appliance' },
  { id: 6, name: 'Vehículo', code: 'vehicle' },
  { id: 7, name: 'Joyas', code: 'jewelry' },
];

// ============================================================
// HELPERS
// ============================================================

const getCategoryColors = (category?: string) => {
  switch (category) {
    case 'san': return { primary: COLORS.green, light: COLORS.greenLight, mid: COLORS.greenMid, gradient: [COLORS.green, COLORS.greenMid] as [string, string] };
    case 'informal': return { primary: COLORS.orange, light: COLORS.orangeLight, mid: COLORS.orangeMid, gradient: [COLORS.orange, COLORS.orangeMid] as [string, string] };
    case 'formal': return { primary: COLORS.indigo, light: COLORS.indigoLight, mid: COLORS.violet, gradient: [COLORS.indigo, COLORS.violet] as [string, string] };
    default: return { primary: COLORS.indigo, light: COLORS.indigoLight, mid: COLORS.violet, gradient: [COLORS.indigo, COLORS.violet] as [string, string] };
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'formal': return 'bank';
    case 'informal': return 'hand-coin';
    case 'san': return 'calendar-clock';
    case 'micro': return 'seed';
    default: return 'cash';
  }
};

// ============================================================
// COMPONENTES UI
// ============================================================

const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);

const GradientButton = ({
  onPress,
  children,
  loading = false,
  variant = 'primary',
  disabled = false,
  icon,
  colors,
}: {
  onPress: () => void;
  children: React.ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  disabled?: boolean;
  icon?: string;
  colors?: [string, string];
}) => {
  const getColors = (): [string, string] => {
    if (colors) return colors;
    if (disabled) return [COLORS.gray300, COLORS.gray400];
    if (variant === 'primary') return [COLORS.indigo, COLORS.violet];
    if (variant === 'success') return [COLORS.green, COLORS.greenMid];
    if (variant === 'danger') return [COLORS.red, '#DC2626'];
    if (variant === 'secondary') return [COLORS.gray600, COLORS.gray700];
    return [COLORS.indigo, COLORS.violet];
  };

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={loading || disabled}
        style={[styles.outlineButton, disabled && { opacity: 0.5 }]}
        activeOpacity={0.75}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.indigo} />
        ) : (
          <View style={styles.buttonInner}>
            {icon && <Icon name={icon} size={18} color={COLORS.indigo} style={{ marginRight: 6 }} />}
            <Text style={styles.outlineButtonText}>{children}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      style={[styles.buttonWrapper, disabled && { opacity: 0.5 }]}
      activeOpacity={0.8}
    >
      <LinearGradient colors={getColors()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientButton}>
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <View style={styles.buttonInner}>
            {icon && <Icon name={icon} size={18} color={COLORS.white} style={{ marginRight: 6 }} />}
            <Text style={styles.buttonText}>{children}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  error,
  required = false,
  prefix,
  suffix,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  helper,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  error?: string;
  required?: boolean;
  prefix?: string;
  suffix?: string;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  helper?: string;
}) => (
  <View style={styles.fieldContainer}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.required}> *</Text>}
    </View>
    <View style={[
      styles.inputWrapper,
      error ? styles.inputError : styles.inputNormal,
      !editable && styles.inputDisabled,
    ]}>
      {prefix && <Text style={styles.inputAffix}>{prefix}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        style={[styles.textInput, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        placeholderTextColor={COLORS.gray400}
      />
      {suffix && <Text style={styles.inputAffix}>{suffix}</Text>}
    </View>
    {(error || helper) && (
      <Text style={[styles.fieldHelper, error ? styles.fieldError : styles.fieldHelperText]}>
        {error || helper}
      </Text>
    )}
  </View>
);

const SelectField = ({
  label,
  value,
  onValueChange,
  items,
  error,
  required = false,
  helper,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
  error?: string;
  required?: boolean;
  helper?: string;
}) => (
  <View style={styles.fieldContainer}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.required}> *</Text>}
    </View>
    <View style={[styles.pickerWrapper, error ? styles.inputError : styles.inputNormal]}>
      <Picker selectedValue={value} onValueChange={onValueChange} style={styles.picker}>
        <Picker.Item label={`Seleccione ${label.toLowerCase()}`} value="" color={COLORS.gray400} />
        {items.map((item) => (
          <Picker.Item key={item.value} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
    {(error || helper) && (
      <Text style={[styles.fieldHelper, error ? styles.fieldError : styles.fieldHelperText]}>
        {error || helper}
      </Text>
    )}
  </View>
);

const Badge = ({ text, color, bg }: { text: string; color: string; bg: string }) => (
  <View style={[styles.badge, { backgroundColor: bg }]}>
    <Text style={[styles.badgeText, { color }]}>{text}</Text>
  </View>
);

const StatCard = ({
  title,
  value,
  icon,
  iconColor,
  iconBg,
  subtitle,
}: {
  title: string;
  value: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  subtitle?: string;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
      <Icon name={icon} size={18} color={iconColor} />
    </View>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </View>
);

const AmortizationRow = ({ item, isEven }: { item: AmortizationDetail; isEven: boolean }) => (
  <View style={[styles.amortRow, isEven && styles.amortRowEven]}>
    <Text style={[styles.amortCell, { width: 32, color: COLORS.indigo, fontWeight: '600' }]}>{item.period}</Text>
    <Text style={[styles.amortCell, { width: 88, fontSize: 11 }]}>{item.payment_date || '-'}</Text>
    <Text style={[styles.amortCell, { flex: 1, textAlign: 'right', fontWeight: '600', color: COLORS.gray800 }]}>${item.payment.toFixed(2)}</Text>
    <Text style={[styles.amortCell, { width: 72, textAlign: 'right' }]}>${item.principal.toFixed(2)}</Text>
    <Text style={[styles.amortCell, { width: 72, textAlign: 'right', color: COLORS.red }]}>${item.interest.toFixed(2)}</Text>
    <Text style={[styles.amortCell, { width: 80, textAlign: 'right', fontWeight: '600', color: COLORS.gray700 }]}>${item.remaining.toFixed(2)}</Text>
  </View>
);

const LoanTypeCard = ({
  loanType,
  isSelected,
  onSelect,
}: {
  loanType: LoanType;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const cat = getCategoryColors(loanType.category);
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[
        styles.loanTypeCard,
        isSelected ? { borderColor: cat.primary, backgroundColor: cat.light } : { borderColor: COLORS.gray200, backgroundColor: COLORS.white },
      ]}
      activeOpacity={0.75}
    >
      <View style={styles.loanTypeHeader}>
        <View style={[styles.loanTypeIcon, { backgroundColor: isSelected ? cat.light : COLORS.gray100 }]}>
          <Icon name={getCategoryIcon(loanType.category)} size={22} color={isSelected ? cat.primary : COLORS.gray500} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.loanTypeName, isSelected && { color: cat.primary }]}>{loanType.name}</Text>
          <Text style={styles.loanTypeRange}>
            RD${loanType.min_amount.toLocaleString()} – RD${loanType.max_amount.toLocaleString()}
          </Text>
        </View>
        {isSelected && <Icon name="check-circle" size={22} color={cat.primary} />}
      </View>
      <View style={styles.loanTypeTags}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>Interés: {loanType.default_interest}%</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>Plazo: {loanType.default_term} períodos</Text>
        </View>
        {loanType.requires_guarantor && (
          <View style={[styles.tag, { backgroundColor: COLORS.amberLight }]}>
            <Text style={[styles.tagText, { color: COLORS.amber }]}>Requiere codeudor</Text>
          </View>
        )}
        {loanType.requires_collateral && (
          <View style={[styles.tag, { backgroundColor: COLORS.blueLight }]}>
            <Text style={[styles.tagText, { color: COLORS.blue }]}>Requiere garantía</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================
// PANTALLA PRINCIPAL
// ============================================================

export default function LoanCreateScreen() {
  const [activeTab, setActiveTab] = useState('loan');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [calculationMode, setCalculationMode] = useState<'standard' | 'fixedPayment' | 'profitPercentage' | 'san'>('san');
  const [showLoanTypeSelector, setShowLoanTypeSelector] = useState(false);

  const [sanConfig, setSanConfig] = useState<SanLoanConfig>({
    daily_payment: 0,
    term_days: 30,
    interest_type: 'percentage',
    interest_value: 20,
    include_weekends: true,
    first_payment_delay: 0,
  });

  const [informalConfig, setInformalConfig] = useState<InformalLoanConfig>({
    payment_frequency: 'daily',
    interest_calculation: 'flat',
    grace_period: 0,
    late_fee_percentage: 5,
    early_payment_discount: 0,
  });

  const [formData, setFormData] = useState({
    customer: '',
    loan_type: '6',
    amortization: '5',
    modality: '4',
    loanAmount: '5000',
    installments: '30',
    interest: '20',
    installmentAmount: '',
    profitPercentage: '20',
    date: new Date().toISOString().split('T')[0],
    firstPaymentDate: new Date().toISOString().split('T')[0],
    cash_box: '1',
    payment_method: '1',
    referenceCode: '',
    legalFees: '0',
    lateFee: '0',
    commission: '',
    wallet: '',
    insuranceAmount: '0',
    initial: '0',
    nameCodebtor: '',
    coDebtorId: '',
    phoneCodebtor: '',
    addressCodebtor: '',
    guarantee_type: '',
    guarantee_description: '',
    guarantee_value: '',
    guarantee_file_number: '',
    guarantee_notes: '',
    san_daily_payment: '',
    san_include_weekends: true,
    san_first_payment_tomorrow: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType | null>(null);
  const [amortizationDetails, setAmortizationDetails] = useState<AmortizationDetail[]>([]);
  const [periodicPayment, setPeriodicPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [showAmortizationModal, setShowAmortizationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const customers = MOCK_CUSTOMERS;
  const paymentModes = MOCK_PAYMENT_MODES;
  const cashBoxes = MOCK_CASH_BOXES;
  const paymentMethods = MOCK_PAYMENT_METHODS;
  const loanTypes = MOCK_LOAN_TYPES;
  const guaranteeTypes = MOCK_GUARANTEE_TYPES;

  useEffect(() => {
    if (formData.customer) {
      const customer = customers.find(c => c.id.toString() === formData.customer);
      setSelectedCustomer(customer || null);
    }
  }, [formData.customer]);

  useEffect(() => {
    if (formData.loan_type) {
      const loanType = loanTypes.find(t => t.id.toString() === formData.loan_type);
      setSelectedLoanType(loanType || null);
      if (loanType) {
        setFormData(prev => ({
          ...prev,
          interest: loanType.default_interest.toString(),
          installments: loanType.default_term.toString(),
        }));
        if (loanType.category === 'san') {
          setCalculationMode('san');
          setFormData(prev => ({ ...prev, amortization: '5', modality: '4' }));
        } else if (loanType.category === 'informal') {
          setCalculationMode('profitPercentage');
          setFormData(prev => ({ ...prev, amortization: '4' }));
        } else {
          setCalculationMode('standard');
          setFormData(prev => ({ ...prev, amortization: '1' }));
        }
      }
    }
  }, [formData.loan_type]);

  useEffect(() => {
    calculateAmortization();
  }, [
    formData.loanAmount, formData.interest, formData.installments,
    formData.amortization, formData.modality, formData.firstPaymentDate,
    formData.profitPercentage, calculationMode, sanConfig, informalConfig,
  ]);

  const calculateSanLoan = () => {
    const amount = parseFloat(formData.loanAmount) || 0;
    const termDays = parseInt(formData.installments) || 30;
    const interestValue = parseFloat(formData.interest) || 20;
    if (amount <= 0 || termDays <= 0) { setAmortizationDetails([]); return; }

    const totalInterestAmount = amount * (interestValue / 100);
    const totalToPay = amount + totalInterestAmount;
    const dailyPayment = totalToPay / termDays;

    setPeriodicPayment(dailyPayment);
    setTotalInterest(totalInterestAmount);
    setTotalPayment(totalToPay);

    const table: AmortizationDetail[] = [];
    let remaining = totalToPay;
    const dailyPrincipal = amount / termDays;
    const dailyInterest = totalInterestAmount / termDays;
    const startDate = new Date(formData.firstPaymentDate);

    for (let i = 1; i <= termDays; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setDate(startDate.getDate() + i - 1);
      const isWeekend = paymentDate.getDay() === 0 || paymentDate.getDay() === 6;
      let principalPayment = dailyPrincipal;
      let interestPayment = dailyInterest;
      if (i === termDays) {
        principalPayment = amount - dailyPrincipal * (termDays - 1);
        interestPayment = totalInterestAmount - dailyInterest * (termDays - 1);
      }
      remaining = Math.max(0, remaining - dailyPayment);
      table.push({ period: i, payment: dailyPayment, principal: principalPayment, interest: interestPayment, remaining, status: 'Pendiente', payment_date: paymentDate.toISOString().split('T')[0], is_weekend: isWeekend });
    }
    setAmortizationDetails(table);
  };

  const calculateInformalLoan = () => {
    const amount = parseFloat(formData.loanAmount) || 0;
    const periods = parseInt(formData.installments) || 0;
    const profitPercentage = parseFloat(formData.profitPercentage) || 20;
    if (amount <= 0 || periods <= 0) { setAmortizationDetails([]); return; }

    const totalProfit = amount * (profitPercentage / 100);
    const totalToPay = amount + totalProfit;
    const paymentPerPeriod = totalToPay / periods;

    setPeriodicPayment(paymentPerPeriod);
    setTotalInterest(totalProfit);
    setTotalPayment(totalToPay);

    const table: AmortizationDetail[] = [];
    let remaining = totalToPay;
    const principalPerPeriod = amount / periods;
    const interestPerPeriod = totalProfit / periods;
    const startDate = new Date(formData.firstPaymentDate);
    const daysPerPeriod = paymentModes.find(m => m.id.toString() === formData.modality)?.days_per_period || 30;

    for (let i = 1; i <= periods; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setDate(startDate.getDate() + (i - 1) * daysPerPeriod);
      let principalPayment = i === periods ? amount - principalPerPeriod * (periods - 1) : principalPerPeriod;
      let interestPayment = i === periods ? totalProfit - interestPerPeriod * (periods - 1) : interestPerPeriod;
      remaining = Math.max(0, remaining - paymentPerPeriod);
      table.push({ period: i, payment: paymentPerPeriod, principal: principalPayment, interest: interestPayment, remaining, status: 'Pendiente', payment_date: paymentDate.toISOString().split('T')[0] });
    }
    setAmortizationDetails(table);
  };

  const calculateStandardLoan = () => {
    const amount = parseFloat(formData.loanAmount) || 0;
    const interestRate = parseFloat(formData.interest) || 0;
    const installments = parseInt(formData.installments) || 0;
    if (amount <= 0 || installments <= 0) { setAmortizationDetails([]); return; }

    const monthlyRate = interestRate / 100 / 12;
    let balance = amount;
    let totalInterestPaid = 0;
    const table: AmortizationDetail[] = [];
    const payment = monthlyRate === 0 ? amount / installments : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));
    const startDate = new Date(formData.firstPaymentDate);
    const daysPerPeriod = paymentModes.find(m => m.id.toString() === formData.modality)?.days_per_period || 30;

    for (let i = 1; i <= installments; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setDate(startDate.getDate() + (i - 1) * daysPerPeriod);
      const interestPayment = balance * monthlyRate;
      const principalPayment = i === installments ? balance : payment - interestPayment;
      balance = Math.max(0, balance - principalPayment);
      totalInterestPaid += interestPayment;
      table.push({ period: i, payment, principal: principalPayment, interest: interestPayment, remaining: balance, status: 'Pendiente', payment_date: paymentDate.toISOString().split('T')[0] });
    }

    setAmortizationDetails(table);
    setPeriodicPayment(payment);
    setTotalInterest(totalInterestPaid);
    setTotalPayment(amount + totalInterestPaid);
  };

  const calculateAmortization = () => {
    if (calculationMode === 'san' || selectedLoanType?.category === 'san') calculateSanLoan();
    else if (calculationMode === 'profitPercentage' || selectedLoanType?.category === 'informal') calculateInformalLoan();
    else calculateStandardLoan();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customer) newErrors.customer = 'Seleccione un cliente';
    if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) newErrors.loanAmount = 'Monto inválido';
    if (!formData.installments || parseInt(formData.installments) <= 0) newErrors.installments = 'Número de períodos inválido';
    if (selectedLoanType?.requires_guarantor && !formData.nameCodebtor) newErrors.nameCodebtor = 'Se requiere codeudor para este tipo de préstamo';
    if (selectedLoanType?.requires_collateral && !formData.guarantee_type) newErrors.guarantee_type = 'Se requiere garantía para este tipo de préstamo';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!validateForm()) { Alert.alert('Error', 'Por favor complete todos los campos requeridos'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setShowSuccessModal(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }, 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => { calculateAmortization(); setRefreshing(false); }, 1000);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(value);

  const chartData = useMemo(() => {
    if (amortizationDetails.length === 0) return { labels: [], datasets: [{ data: [0] }] };
    const maxPeriods = Math.min(amortizationDetails.length, 20);
    const slice = amortizationDetails.slice(0, maxPeriods);
    return {
      labels: slice.map(d => d.period.toString()),
      datasets: [
        { data: slice.map(d => d.principal), color: (o = 1) => `rgba(79, 70, 229, ${o})`, strokeWidth: 2 },
        { data: slice.map(d => d.interest), color: (o = 1) => `rgba(239, 68, 68, ${o})`, strokeWidth: 2 },
      ],
      legend: ['Capital', 'Interés'],
    };
  }, [amortizationDetails]);

  const getPaymentPeriodLabel = () => paymentModes.find(m => m.id.toString() === formData.modality)?.name || 'Período';

  const catColors = getCategoryColors(selectedLoanType?.category);
  const catIcon = getCategoryIcon(selectedLoanType?.category || '');

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={catColors.primary} />

        {/* ── Header ── */}
        <LinearGradient colors={catColors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBg}>
                <Icon name={catIcon} size={24} color={COLORS.white} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.headerTitle}>{selectedLoanType?.name || 'Nuevo Préstamo'}</Text>
                <Text style={styles.headerSubtitle}>
                  {selectedLoanType?.category === 'san' ? 'Préstamo tipo San · Pagos diarios'
                    : selectedLoanType?.category === 'informal' ? 'Préstamo informal · Interés plano'
                    : 'Complete los datos del préstamo'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowLoanTypeSelector(true)} style={styles.headerSwapBtn} activeOpacity={0.75}>
              <Icon name="swap-horizontal" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── Tabs ── */}
        <View style={styles.tabBar}>
          {[
            { id: 'loan', label: 'Préstamo', icon: 'cash-multiple' },
            { id: 'guarantor', label: 'Codeudor', icon: 'account-group' },
            { id: 'warranty', label: 'Garantía', icon: 'shield-check' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const showDot =
              (tab.id === 'guarantor' && selectedLoanType?.requires_guarantor) ||
              (tab.id === 'warranty' && selectedLoanType?.requires_collateral);
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab.id); }}
                style={[styles.tab, isActive && { backgroundColor: catColors.light }]}
                activeOpacity={0.75}
              >
                <Icon name={tab.icon} size={17} color={isActive ? catColors.primary : COLORS.gray400} />
                <Text style={[styles.tabLabel, { color: isActive ? catColors.primary : COLORS.gray400 }]}>{tab.label}</Text>
                {showDot && <View style={styles.tabDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Scroll content ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={catColors.primary} />}
          showsVerticalScrollIndicator={false}
        >

          {/* ===== TAB: PRÉSTAMO ===== */}
          {activeTab === 'loan' && (
            <>
              {/* Tipo seleccionado */}
              {selectedLoanType && (
                <Card style={{ marginBottom: SPACING.md }}>
                  <View style={styles.selectedLoanRow}>
                    <View>
                      <Text style={styles.selectedLoanLabel}>Tipo seleccionado</Text>
                      <Text style={styles.selectedLoanName}>{selectedLoanType.name}</Text>
                    </View>
                    <Badge
                      text={selectedLoanType.category === 'san' ? 'Tipo San' : selectedLoanType.category === 'informal' ? 'Informal' : 'Formal'}
                      color={catColors.primary}
                      bg={catColors.light}
                    />
                  </View>
                </Card>
              )}

              {/* Cliente */}
              <Card style={{ marginBottom: SPACING.md }}>
                <SectionTitle>Información del Cliente</SectionTitle>
                <SelectField
                  label="Cliente"
                  value={formData.customer}
                  onValueChange={(v) => setFormData(p => ({ ...p, customer: v }))}
                  items={customers.map(c => ({ label: `${c.first_name} ${c.last_name}${c.is_vip ? ' ★ VIP' : ''}`, value: c.id.toString() }))}
                  error={errors.customer}
                  required
                />
                {selectedCustomer && (
                  <View style={styles.customerPreview}>
                    <View style={styles.customerAvatar}>
                      <Icon name="account" size={20} color={catColors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.customerName}>{selectedCustomer.first_name} {selectedCustomer.last_name}</Text>
                        {selectedCustomer.is_vip && (
                          <Badge text="VIP" color={COLORS.amber} bg={COLORS.amberLight} />
                        )}
                      </View>
                      <Text style={styles.customerMeta}>{selectedCustomer.document_id} · Score: {selectedCustomer.credit_score}</Text>
                    </View>
                  </View>
                )}
              </Card>

              {/* Config San */}
              {selectedLoanType?.category === 'san' && (
                <Card style={[{ marginBottom: SPACING.md }, styles.sanCard]}>
                  <View style={styles.configCardHeader}>
                    <Icon name="calendar-clock" size={18} color={COLORS.green} />
                    <Text style={[styles.configCardTitle, { color: COLORS.green }]}>Configuración San</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxText}>Pagos diarios fijos con interés calculado sobre el capital inicial.</Text>
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Incluir fines de semana</Text>
                    <Switch value={formData.san_include_weekends} onValueChange={(v) => setFormData(p => ({ ...p, san_include_weekends: v }))} trackColor={{ false: COLORS.gray300, true: COLORS.greenMid }} thumbColor={COLORS.white} />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Primer pago mañana</Text>
                    <Switch value={formData.san_first_payment_tomorrow} onValueChange={(v) => setFormData(p => ({ ...p, san_first_payment_tomorrow: v }))} trackColor={{ false: COLORS.gray300, true: COLORS.greenMid }} thumbColor={COLORS.white} />
                  </View>
                </Card>
              )}

              {/* Config Informal */}
              {selectedLoanType?.category === 'informal' && (
                <Card style={[{ marginBottom: SPACING.md }, styles.informalCard]}>
                  <View style={styles.configCardHeader}>
                    <Icon name="hand-coin" size={18} color={COLORS.orange} />
                    <Text style={[styles.configCardTitle, { color: COLORS.orange }]}>Configuración Informal</Text>
                  </View>
                  <SelectField
                    label="Frecuencia de pago"
                    value={informalConfig.payment_frequency}
                    onValueChange={(v) => setInformalConfig(p => ({ ...p, payment_frequency: v as any }))}
                    items={[
                      { label: 'Diario', value: 'daily' },
                      { label: 'Semanal', value: 'weekly' },
                      { label: 'Quincenal', value: 'biweekly' },
                      { label: 'Mensual', value: 'monthly' },
                    ]}
                  />
                  <InputField
                    label="Porcentaje de beneficio"
                    value={formData.profitPercentage}
                    onChangeText={(v) => setFormData(p => ({ ...p, profitPercentage: v }))}
                    placeholder="Ej: 20"
                    keyboardType="numeric"
                    suffix="%"
                    helper="Porcentaje sobre el capital prestado"
                    required
                  />
                </Card>
              )}

              {/* Parámetros */}
              <Card style={{ marginBottom: SPACING.md }}>
                <SectionTitle>Parámetros del Préstamo</SectionTitle>
                <InputField
                  label={selectedLoanType?.category === 'san' ? 'Monto a prestar' : 'Monto del préstamo'}
                  value={formData.loanAmount}
                  onChangeText={(v) => setFormData(p => ({ ...p, loanAmount: v }))}
                  placeholder={`Ej: ${selectedLoanType?.min_amount || 5000}`}
                  keyboardType="numeric"
                  prefix="RD$"
                  error={errors.loanAmount}
                  required
                  helper={selectedLoanType ? `Mín: RD$${selectedLoanType.min_amount} – Máx: RD$${selectedLoanType.max_amount}` : ''}
                />
                <InputField
                  label={selectedLoanType?.category === 'san' ? 'Plazo (días)' : 'Plazo (cuotas)'}
                  value={formData.installments}
                  onChangeText={(v) => setFormData(p => ({ ...p, installments: v }))}
                  placeholder={selectedLoanType?.category === 'san' ? 'Ej: 30' : 'Ej: 12'}
                  keyboardType="numeric"
                  error={errors.installments}
                  required
                />
                <InputField
                  label={selectedLoanType?.category === 'san' ? 'Porcentaje de beneficio' : 'Tasa de interés anual'}
                  value={formData.interest}
                  onChangeText={(v) => setFormData(p => ({ ...p, interest: v }))}
                  placeholder={`Ej: ${selectedLoanType?.default_interest || 12}`}
                  keyboardType="numeric"
                  suffix="%"
                  helper={selectedLoanType?.category === 'san' ? 'Sobre el capital inicial' : 'Tasa anual'}
                  required
                />
                <SelectField
                  label="Modalidad de pago"
                  value={formData.modality}
                  onValueChange={(v) => setFormData(p => ({ ...p, modality: v }))}
                  items={paymentModes.map(m => ({ label: m.name, value: m.id.toString() }))}
                  required
                />
                <InputField
                  label="Fecha primer pago"
                  value={formData.firstPaymentDate}
                  onChangeText={(v) => setFormData(p => ({ ...p, firstPaymentDate: v }))}
                  placeholder="YYYY-MM-DD"
                  required
                />
              </Card>

              {/* Desembolso */}
              <Card style={{ marginBottom: SPACING.md }}>
                <SectionTitle>Configuración de Desembolso</SectionTitle>
                <SelectField
                  label="Caja"
                  value={formData.cash_box}
                  onValueChange={(v) => setFormData(p => ({ ...p, cash_box: v }))}
                  items={cashBoxes.map(c => ({ label: `${c.name}  (RD$${c.balance.toLocaleString()})`, value: c.id.toString() }))}
                />
                <SelectField
                  label="Forma de entrega"
                  value={formData.payment_method}
                  onValueChange={(v) => setFormData(p => ({ ...p, payment_method: v }))}
                  items={paymentMethods.map(m => ({ label: m.name, value: m.id.toString() }))}
                />
                <InputField
                  label="Referencia"
                  value={formData.referenceCode}
                  onChangeText={(v) => setFormData(p => ({ ...p, referenceCode: v }))}
                  placeholder="Número de referencia (opcional)"
                />
              </Card>

              {/* Resumen numérico */}
              <Card style={{ marginBottom: SPACING.md }}>
                <SectionTitle>Resumen del Préstamo</SectionTitle>
                <View style={styles.statsGrid}>
                  <StatCard
                    title="Capital"
                    value={formatCurrency(parseFloat(formData.loanAmount) || 0)}
                    icon="cash"
                    iconColor={COLORS.blue}
                    iconBg={COLORS.blueLight}
                  />
                  <StatCard
                    title="Plazo"
                    value={`${formData.installments} ${selectedLoanType?.category === 'san' ? 'días' : getPaymentPeriodLabel().toLowerCase()}`}
                    icon="calendar-clock"
                    iconColor={COLORS.purple}
                    iconBg={COLORS.purpleLight}
                  />
                </View>
                {periodicPayment > 0 && (
                  <View style={[styles.statsGrid, { marginTop: SPACING.sm }]}>
                    <StatCard
                      title={selectedLoanType?.category === 'san' ? 'Beneficio' : 'Interés'}
                      value={`${formData.interest}%`}
                      icon="percent"
                      iconColor={catColors.primary}
                      iconBg={catColors.light}
                    />
                    <StatCard
                      title={`Pago ${selectedLoanType?.category === 'san' ? 'Diario' : 'Período'}`}
                      value={formatCurrency(periodicPayment)}
                      icon="credit-card"
                      iconColor={COLORS.orange}
                      iconBg={COLORS.orangeLight}
                    />
                  </View>
                )}
                {totalInterest > 0 && (
                  <View style={[styles.statsGrid, { marginTop: SPACING.sm }]}>
                    <StatCard
                      title={selectedLoanType?.category === 'san' ? 'Beneficio Total' : 'Interés Total'}
                      value={formatCurrency(totalInterest)}
                      icon="trending-up"
                      iconColor={COLORS.red}
                      iconBg={COLORS.redLight}
                      subtitle={`${((totalInterest / (parseFloat(formData.loanAmount) || 1)) * 100).toFixed(1)}% del capital`}
                    />
                    <StatCard
                      title="Total a Pagar"
                      value={formatCurrency(totalPayment)}
                      icon="cash-check"
                      iconColor={catColors.primary}
                      iconBg={catColors.light}
                    />
                  </View>
                )}
              </Card>

              {/* Plan de pagos */}
              <Card style={{ marginBottom: SPACING.md }}>
                <View style={styles.planHeader}>
                  <Text style={styles.sectionTitle}>
                    {selectedLoanType?.category === 'san' ? 'Plan de Pagos Diarios' : 'Plan de Amortización'}
                  </Text>
                  {amortizationDetails.length > 0 && (
                    <TouchableOpacity onPress={() => setShowAmortizationModal(true)} style={[styles.verTodoBtn, { backgroundColor: catColors.light }]}>
                      <Text style={[styles.verTodoBtnText, { color: catColors.primary }]}>Ver todo</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {amortizationDetails.length > 0 ? (
                  <>
                    {/* Tabla header */}
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, { width: 32 }]}>#</Text>
                      <Text style={[styles.tableHeaderCell, { width: 88 }]}>Fecha</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Pago</Text>
                      <Text style={[styles.tableHeaderCell, { width: 72, textAlign: 'right' }]}>Capital</Text>
                      <Text style={[styles.tableHeaderCell, { width: 72, textAlign: 'right' }]}>Interés</Text>
                      <Text style={[styles.tableHeaderCell, { width: 80, textAlign: 'right' }]}>Saldo</Text>
                    </View>
                    {amortizationDetails.slice(0, 5).map((item, idx) => (
                      <AmortizationRow key={item.period} item={item} isEven={idx % 2 === 0} />
                    ))}
                    {amortizationDetails.length > 5 && (
                      <Text style={styles.morePeriods}>+ {amortizationDetails.length - 5} {selectedLoanType?.category === 'san' ? 'días' : 'períodos'} más</Text>
                    )}

                    {/* Gráfico */}
                    <View style={{ marginTop: SPACING.lg }}>
                      <Text style={styles.chartTitle}>Evolución de Pagos</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <LineChart
                          data={chartData}
                          width={Math.max(SCREEN_WIDTH - 64, Math.min(chartData.labels.length * 36, 600))}
                          height={180}
                          chartConfig={{
                            backgroundColor: COLORS.white,
                            backgroundGradientFrom: COLORS.white,
                            backgroundGradientTo: COLORS.white,
                            decimalPlaces: 0,
                            color: (o = 1) => `rgba(79,70,229,${o})`,
                            labelColor: (o = 1) => `rgba(107,114,128,${o})`,
                            propsForDots: { r: '3', strokeWidth: '2', stroke: COLORS.indigo },
                          }}
                          bezier
                          style={{ borderRadius: RADIUS.lg, marginVertical: 6 }}
                        />
                      </ScrollView>
                      <View style={styles.legend}>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: COLORS.indigo }]} />
                          <Text style={styles.legendLabel}>Capital</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: COLORS.red }]} />
                          <Text style={styles.legendLabel}>Interés</Text>
                        </View>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <Icon name="file-document-outline" size={44} color={COLORS.gray300} />
                    <Text style={styles.emptyStateText}>Complete los datos para generar el plan de pagos</Text>
                  </View>
                )}
              </Card>
            </>
          )}

          {/* ===== TAB: CODEUDOR ===== */}
          {activeTab === 'guarantor' && (
            <Card style={{ marginBottom: SPACING.md }}>
              <View style={styles.cardHeaderRow}>
                <Icon name="account-group" size={20} color={COLORS.indigo} />
                <Text style={styles.cardHeaderTitle}>Información del Codeudor</Text>
                {selectedLoanType?.requires_guarantor && (
                  <Badge text="Requerido" color={COLORS.red} bg={COLORS.redLight} />
                )}
              </View>
              <InputField label="Nombres Completos" value={formData.nameCodebtor} onChangeText={(v) => setFormData(p => ({ ...p, nameCodebtor: v }))} placeholder="Nombre completo del codeudor" error={errors.nameCodebtor} required={selectedLoanType?.requires_guarantor} />
              <InputField label="Número de Identificación" value={formData.coDebtorId} onChangeText={(v) => setFormData(p => ({ ...p, coDebtorId: v }))} placeholder="Cédula o identificación" required={selectedLoanType?.requires_guarantor} />
              <InputField label="Teléfono" value={formData.phoneCodebtor} onChangeText={(v) => setFormData(p => ({ ...p, phoneCodebtor: v }))} placeholder="Número de contacto" keyboardType="phone-pad" />
              <InputField label="Dirección" value={formData.addressCodebtor} onChangeText={(v) => setFormData(p => ({ ...p, addressCodebtor: v }))} placeholder="Dirección completa" multiline numberOfLines={3} />
              <View style={styles.infoBox}>
                <Icon name="information" size={18} color={COLORS.blue} />
                <Text style={[styles.infoBoxText, { color: COLORS.blue, marginLeft: 8, flex: 1 }]}>El codeudor será responsable solidario del préstamo en caso de incumplimiento.</Text>
              </View>
            </Card>
          )}

          {/* ===== TAB: GARANTÍA ===== */}
          {activeTab === 'warranty' && (
            <Card style={{ marginBottom: SPACING.md }}>
              <View style={styles.cardHeaderRow}>
                <Icon name="shield-check" size={20} color={COLORS.indigo} />
                <Text style={styles.cardHeaderTitle}>Información de Garantía</Text>
                {selectedLoanType?.requires_collateral && (
                  <Badge text="Requerido" color={COLORS.red} bg={COLORS.redLight} />
                )}
              </View>
              <SelectField label="Tipo de Garantía" value={formData.guarantee_type} onValueChange={(v) => setFormData(p => ({ ...p, guarantee_type: v }))} items={guaranteeTypes.map(g => ({ label: g.name, value: g.id.toString() }))} error={errors.guarantee_type} required={selectedLoanType?.requires_collateral} />
              <InputField label="Valor de la Garantía" value={formData.guarantee_value} onChangeText={(v) => setFormData(p => ({ ...p, guarantee_value: v }))} placeholder="Valor estimado" keyboardType="numeric" prefix="RD$" />
              <InputField label="Descripción de la Garantía" value={formData.guarantee_description} onChangeText={(v) => setFormData(p => ({ ...p, guarantee_description: v }))} placeholder="Describa detalladamente la garantía" multiline numberOfLines={4} />
              <InputField label="Número de Expediente" value={formData.guarantee_file_number} onChangeText={(v) => setFormData(p => ({ ...p, guarantee_file_number: v }))} placeholder="Número de registro" />
              <InputField label="Notas Adicionales" value={formData.guarantee_notes} onChangeText={(v) => setFormData(p => ({ ...p, guarantee_notes: v }))} placeholder="Observaciones sobre la garantía" multiline numberOfLines={3} />

              {formData.guarantee_value && parseFloat(formData.guarantee_value) > 0 && parseFloat(formData.loanAmount) > 0 && (() => {
                const ratio = parseFloat(formData.guarantee_value) / parseFloat(formData.loanAmount);
                const ok = ratio >= 1;
                return (
                  <View style={[styles.guaranteeStatus, { backgroundColor: ok ? COLORS.greenLight : COLORS.amberLight }]}>
                    <Icon name={ok ? 'check-circle' : 'alert'} size={18} color={ok ? COLORS.green : COLORS.amber} />
                    <Text style={[styles.guaranteeStatusText, { color: ok ? COLORS.green : COLORS.amber }]}>
                      {ok
                        ? `Garantía suficiente: ${(ratio * 100).toFixed(0)}% del préstamo`
                        : `Garantía insuficiente: solo cubre ${(ratio * 100).toFixed(0)}% del préstamo`}
                    </Text>
                  </View>
                );
              })()}
            </Card>
          )}

          {/* Botones de acción */}
          <View style={styles.actionButtons}>
            <View style={{ flex: 1 }}>
              <GradientButton onPress={() => {}} variant="outline">Cancelar</GradientButton>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <GradientButton
                onPress={handleSubmit}
                loading={loading}
                disabled={amortizationDetails.length === 0}
                variant={selectedLoanType?.category === 'san' ? 'success' : 'primary'}
                colors={catColors.gradient}
                icon="check-circle"
              >
                {selectedLoanType?.category === 'san' ? 'Crear San' : 'Registrar Préstamo'}
              </GradientButton>
            </View>
          </View>
        </ScrollView>

        {/* ── Modal: Selector de Tipo ── */}
        <Modal visible={showLoanTypeSelector} animationType="slide" transparent onRequestClose={() => setShowLoanTypeSelector(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tipos de Préstamo</Text>
                <TouchableOpacity onPress={() => setShowLoanTypeSelector(false)} style={styles.modalClose}>
                  <Icon name="close" size={22} color={COLORS.gray600} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: SPACING.base }} showsVerticalScrollIndicator={false}>
                <Text style={styles.categoryLabel}>FORMALES</Text>
                {loanTypes.filter(t => t.category === 'formal').map(type => (
                  <LoanTypeCard key={type.id} loanType={type} isSelected={formData.loan_type === type.id.toString()} onSelect={() => { setFormData(p => ({ ...p, loan_type: type.id.toString() })); setShowLoanTypeSelector(false); }} />
                ))}
                <Text style={[styles.categoryLabel, { marginTop: SPACING.base }]}>INFORMALES</Text>
                {loanTypes.filter(t => t.category === 'informal').map(type => (
                  <LoanTypeCard key={type.id} loanType={type} isSelected={formData.loan_type === type.id.toString()} onSelect={() => { setFormData(p => ({ ...p, loan_type: type.id.toString() })); setShowLoanTypeSelector(false); }} />
                ))}
                <Text style={[styles.categoryLabel, { marginTop: SPACING.base }]}>PRÉSTAMOS SAN</Text>
                {loanTypes.filter(t => t.category === 'san').map(type => (
                  <LoanTypeCard key={type.id} loanType={type} isSelected={formData.loan_type === type.id.toString()} onSelect={() => { setFormData(p => ({ ...p, loan_type: type.id.toString() })); setShowLoanTypeSelector(false); }} />
                ))}
                <View style={{ height: 32 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── Modal: Amortización Completa ── */}
        <Modal visible={showAmortizationModal} animationType="slide" transparent onRequestClose={() => setShowAmortizationModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedLoanType?.category === 'san' ? 'Plan de Pagos Diarios' : 'Plan de Amortización'}</Text>
                  <Text style={styles.modalSubtitle}>{amortizationDetails.length} {selectedLoanType?.category === 'san' ? 'días' : 'períodos'}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAmortizationModal(false)} style={styles.modalClose}>
                  <Icon name="close" size={22} color={COLORS.gray600} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: SPACING.base }} showsVerticalScrollIndicator={false}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: 32 }]}>#</Text>
                  <Text style={[styles.tableHeaderCell, { width: 88 }]}>Fecha</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Pago</Text>
                  <Text style={[styles.tableHeaderCell, { width: 72, textAlign: 'right' }]}>Capital</Text>
                  <Text style={[styles.tableHeaderCell, { width: 72, textAlign: 'right' }]}>Interés</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80, textAlign: 'right' }]}>Saldo</Text>
                </View>
                {amortizationDetails.map((item, idx) => (
                  <AmortizationRow key={item.period} item={item} isEven={idx % 2 === 0} />
                ))}

                {/* Totales */}
                <View style={styles.totalsBox}>
                  <Text style={styles.totalsTitle}>Resumen Total</Text>
                  {[
                    { label: 'Capital prestado', value: formatCurrency(parseFloat(formData.loanAmount) || 0) },
                    { label: 'Interés total', value: formatCurrency(totalInterest) },
                    { label: `Pago ${selectedLoanType?.category === 'san' ? 'diario' : 'periódico'}`, value: formatCurrency(periodicPayment) },
                  ].map(({ label, value }) => (
                    <View key={label} style={styles.totalsRow}>
                      <Text style={styles.totalsLabel}>{label}:</Text>
                      <Text style={styles.totalsValue}>{value}</Text>
                    </View>
                  ))}
                  <View style={[styles.totalsRow, styles.totalsFinal]}>
                    <Text style={styles.totalsFinalLabel}>Total a pagar:</Text>
                    <Text style={[styles.totalsValue, { color: catColors.primary, fontWeight: '700', fontSize: 16 }]}>{formatCurrency(totalPayment)}</Text>
                  </View>
                </View>
                <View style={{ height: 16 }} />
              </ScrollView>
              <View style={styles.modalFooter}>
                <GradientButton onPress={() => setShowAmortizationModal(false)} colors={catColors.gradient}>Cerrar</GradientButton>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── Modal: Éxito ── */}
        <Modal visible={showSuccessModal} animationType="fade" transparent onRequestClose={() => setShowSuccessModal(false)}>
          <View style={styles.successOverlay}>
            <View style={styles.successCard}>
              <LinearGradient colors={catColors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.successIcon}>
                <Icon name="check" size={36} color={COLORS.white} />
              </LinearGradient>
              <Text style={styles.successTitle}>
                {selectedLoanType?.category === 'san' ? '¡San Creado!' : '¡Préstamo Creado!'}
              </Text>
              <Text style={styles.successSubtitle}>
                El préstamo ha sido registrado exitosamente.
                {selectedLoanType?.category === 'san' && ' Recuerda cobrar el primer pago mañana.'}
              </Text>

              <View style={styles.successSummary}>
                {[
                  { label: 'Cliente', value: `${selectedCustomer?.first_name || ''} ${selectedCustomer?.last_name || ''}`.trim() || '–' },
                  { label: 'Monto', value: formatCurrency(parseFloat(formData.loanAmount) || 0) },
                  { label: selectedLoanType?.category === 'san' ? 'Pago diario' : 'Pago período', value: formatCurrency(periodicPayment) },
                  { label: 'Total a pagar', value: formatCurrency(totalPayment) },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.successSummaryRow}>
                    <Text style={styles.successSummaryLabel}>{label}:</Text>
                    <Text style={styles.successSummaryValue}>{value}</Text>
                  </View>
                ))}
              </View>

              <GradientButton onPress={() => setShowSuccessModal(false)} colors={catColors.gradient} icon="eye">
                Ver Préstamo
              </GradientButton>
              <View style={{ marginTop: 10 }}>
                <GradientButton variant="outline" onPress={() => { setShowSuccessModal(false); setAmortizationDetails([]); }}>
                  Crear Otro
                </GradientButton>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ============================================================
// STYLESHEET
// ============================================================

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.gray50 },

  // Header
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerIconBg: { width: 44, height: 44, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700', letterSpacing: 0.2 },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  headerSwapBtn: { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  // Tabs
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: SPACING.base, marginTop: -SPACING.base, borderRadius: RADIUS.xl, padding: 4, shadowColor: COLORS.shadowMd, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 6 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: RADIUS.lg },
  tabLabel: { fontSize: 12, fontWeight: '600', marginLeft: 5 },
  tabDot: { width: 6, height: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.red, marginLeft: 3 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.base, paddingTop: SPACING.base + 4, paddingBottom: SPACING.xl },

  // Card
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.base, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: COLORS.gray100 },

  // Typography
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.gray800, marginBottom: SPACING.md },
  cardHeaderTitle: { fontSize: 15, fontWeight: '700', color: COLORS.gray800, marginLeft: 8, flex: 1 },

  // Form fields
  fieldContainer: { marginBottom: SPACING.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },
  required: { color: COLORS.red, fontSize: 13 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray50, borderRadius: RADIUS.md, borderWidth: 1.5 },
  inputNormal: { borderColor: COLORS.gray200 },
  inputError: { borderColor: COLORS.red },
  inputDisabled: { backgroundColor: COLORS.gray100 },
  textInput: { flex: 1, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: 15, color: COLORS.gray800 },
  inputAffix: { paddingHorizontal: SPACING.md, fontSize: 14, color: COLORS.gray500, fontWeight: '500' },
  pickerWrapper: { backgroundColor: COLORS.gray50, borderRadius: RADIUS.md, borderWidth: 1.5, overflow: 'hidden' },
  picker: { height: 52 },
  fieldHelper: { fontSize: 11, marginTop: 4 },
  fieldError: { color: COLORS.red },
  fieldHelperText: { color: COLORS.gray400 },

  // Buttons
  buttonWrapper: { borderRadius: RADIUS.md, overflow: 'hidden' },
  gradientButton: { paddingVertical: 14, paddingHorizontal: SPACING.lg, alignItems: 'center', justifyContent: 'center' },
  buttonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: COLORS.white, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  outlineButton: { borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.indigo, paddingVertical: 13, paddingHorizontal: SPACING.lg, alignItems: 'center', justifyContent: 'center' },
  outlineButtonText: { color: COLORS.indigo, fontSize: 15, fontWeight: '700' },
  actionButtons: { flexDirection: 'row', marginBottom: SPACING.xl },

  // Badge
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Stat cards
  statsGrid: { flexDirection: 'row', gap: SPACING.sm },
  statCard: { flex: 1, backgroundColor: COLORS.gray50, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.gray100 },
  statIcon: { width: 36, height: 36, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  statTitle: { fontSize: 11, color: COLORS.gray500, marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: '700', color: COLORS.gray800 },
  statSubtitle: { fontSize: 10, color: COLORS.gray400, marginTop: 2 },

  // Selected loan row
  selectedLoanRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedLoanLabel: { fontSize: 11, color: COLORS.gray400, marginBottom: 2 },
  selectedLoanName: { fontSize: 16, fontWeight: '700', color: COLORS.gray800 },

  // Customer preview
  customerPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray50, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: 4 },
  customerAvatar: { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: COLORS.indigoLight, alignItems: 'center', justifyContent: 'center' },
  customerName: { fontWeight: '600', color: COLORS.gray800, fontSize: 14, marginRight: 6 },
  customerMeta: { color: COLORS.gray500, fontSize: 12, marginTop: 2 },

  // Config cards
  sanCard: { backgroundColor: COLORS.greenLight, borderColor: '#A7F3D0', borderWidth: 1 },
  informalCard: { backgroundColor: COLORS.orangeLight, borderColor: '#FED7AA', borderWidth: 1 },
  configCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  configCardTitle: { fontWeight: '700', fontSize: 14, marginLeft: 7 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  switchLabel: { fontSize: 14, color: COLORS.gray700 },

  // Info box
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.blueLight, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm },
  infoBoxText: { fontSize: 12, color: COLORS.gray600, lineHeight: 18 },

  // Card header row
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.base },

  // Plan header
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  verTodoBtn: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.md },
  verTodoBtnText: { fontSize: 13, fontWeight: '600' },

  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.gray100, borderRadius: RADIUS.sm, paddingVertical: 8, paddingHorizontal: 6, marginBottom: 4 },
  tableHeaderCell: { fontSize: 10, color: COLORS.gray500, fontWeight: '700', textTransform: 'uppercase' },
  amortRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  amortRowEven: { backgroundColor: COLORS.gray50 },
  amortCell: { fontSize: 12, color: COLORS.gray600 },
  morePeriods: { textAlign: 'center', color: COLORS.gray400, fontSize: 13, marginTop: SPACING.md, fontStyle: 'italic' },

  // Chart
  chartTitle: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 6, gap: SPACING.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: RADIUS.full, marginRight: 4 },
  legendLabel: { fontSize: 11, color: COLORS.gray500 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyStateText: { color: COLORS.gray400, fontSize: 13, textAlign: 'center', marginTop: SPACING.sm },

  // Guarantee status
  guaranteeStatus: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md },
  guaranteeStatusText: { fontSize: 13, fontWeight: '600', marginLeft: 8, flex: 1 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.gray200, borderRadius: RADIUS.full, alignSelf: 'center', marginTop: SPACING.md },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.base, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray800 },
  modalSubtitle: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  modalClose: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center' },
  modalFooter: { padding: SPACING.base, borderTopWidth: 1, borderTopColor: COLORS.gray100 },

  // Totals
  totalsBox: { backgroundColor: COLORS.gray50, borderRadius: RADIUS.lg, padding: SPACING.base, marginTop: SPACING.lg, borderWidth: 1, borderColor: COLORS.gray100 },
  totalsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray800, marginBottom: SPACING.md },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  totalsLabel: { fontSize: 13, color: COLORS.gray500 },
  totalsValue: { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },
  totalsFinal: { borderTopWidth: 1, borderTopColor: COLORS.gray200, paddingTop: SPACING.sm, marginTop: 4 },
  totalsFinalLabel: { fontSize: 14, fontWeight: '700', color: COLORS.gray800 },

  // Loan type cards
  loanTypeCard: { borderRadius: RADIUS.lg, borderWidth: 2, padding: SPACING.md, marginBottom: SPACING.sm },
  loanTypeHeader: { flexDirection: 'row', alignItems: 'center' },
  loanTypeIcon: { width: 44, height: 44, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  loanTypeName: { fontSize: 15, fontWeight: '700', color: COLORS.gray800 },
  loanTypeRange: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  loanTypeTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm },
  tag: { backgroundColor: COLORS.gray100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  tagText: { fontSize: 11, color: COLORS.gray600, fontWeight: '500' },
  categoryLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray400, letterSpacing: 1, marginBottom: SPACING.sm },

  // Success modal
  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  successCard: { backgroundColor: COLORS.white, borderRadius: RADIUS['2xl'], padding: SPACING.xl, width: '100%', maxWidth: 400, alignItems: 'center' },
  successIcon: { width: 80, height: 80, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.gray800, marginBottom: SPACING.sm },
  successSubtitle: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', marginBottom: SPACING.lg, lineHeight: 20 },
  successSummary: { backgroundColor: COLORS.gray50, borderRadius: RADIUS.lg, padding: SPACING.base, width: '100%', marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.gray100 },
  successSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  successSummaryLabel: { fontSize: 13, color: COLORS.gray500 },
  successSummaryValue: { fontSize: 13, fontWeight: '600', color: COLORS.gray800 },
});