import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLoans } from '@/hooks/useLoans';
import { useClients } from '@/hooks/useClients';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
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
import { useNavigation, NavigationProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// ============================================================
// TEMA Y COLORES
// ============================================================

const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#7C3AED',
  primaryDark: '#3730A3',
  primaryBg: '#EEF2FF',
  success: '#10B981',
  successBg: '#D1FAE5',
  successDark: '#059669',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  dangerDark: '#DC2626',
  info: '#3B82F6',
  infoBg: '#DBEAFE',
  orange: '#F97316',
  orangeBg: '#FFEDD5',
  green: '#10B981',
  greenBg: '#D1FAE5',
  purple: '#8B5CF6',
  purpleBg: '#EDE9FE',
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
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
// DATOS MOCK
// ============================================================

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
// COMPONENTES ESTILIZADOS (con StyleSheet)
// ============================================================

const Card: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const GradientButton: React.FC<{
  onPress: () => void;
  children: React.ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  disabled?: boolean;
  icon?: string;
}> = ({ onPress, children, loading = false, variant = 'primary', disabled = false, icon }) => {
  const getGradientColors = (): [string, string] => {
    if (disabled) return [COLORS.gray400, COLORS.gray500];
    if (variant === 'primary') return [COLORS.primary, COLORS.primaryLight];
    if (variant === 'secondary') return [COLORS.gray500, COLORS.gray600];
    if (variant === 'danger') return [COLORS.danger, COLORS.dangerDark];
    if (variant === 'success') return [COLORS.success, COLORS.successDark];
    return [COLORS.transparent, COLORS.transparent];
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      style={[styles.gradientButton, disabled && styles.gradientButtonDisabled]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, variant === 'outline' && styles.gradientOutline]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <View style={styles.gradientContent}>
            {icon && <Icon name={icon} size={20} color={COLORS.white} style={styles.buttonIcon} />}
            <Text style={[styles.gradientButtonText, variant === 'outline' && styles.gradientButtonTextOutline]}>
              {children}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const InputField: React.FC<{
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
}> = ({ label, value, onChangeText, placeholder, keyboardType = 'default', error, required = false, prefix, suffix, editable = true, multiline = false, numberOfLines = 1, helper }) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      {required && <Text style={styles.requiredStar}>*</Text>}
    </View>
    <View style={[styles.inputWrapper, error ? styles.inputError : null, !editable && styles.inputDisabled]}>
      {prefix && (
        <View style={styles.inputPrefix}>
          <Text style={styles.prefixText}>{prefix}</Text>
        </View>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        style={[styles.input, multiline && styles.textArea]}
        placeholderTextColor={COLORS.gray400}
      />
      {suffix && (
        <View style={styles.inputSuffix}>
          <Text style={styles.suffixText}>{suffix}</Text>
        </View>
      )}
    </View>
    {(error || helper) && (
      <Text style={[styles.helperText, error ? styles.errorText : null]}>
        {error || helper}
      </Text>
    )}
  </View>
);



const SelectField: React.FC<{
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: { label: string; value: string; description?: string }[];
  error?: string;
  required?: boolean;
  helper?: string;
}> = ({ label, value, onValueChange, items, error, required = false, helper }) => {
  const [showPicker, setShowPicker] = useState(false);

  const selectedLabel = items.find(i => i.value === value)?.label || `Seleccione ${label.toLowerCase()}`;

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.inputLabel}>{label}</Text>
          {required && <Text style={styles.requiredStar}>*</Text>}
        </View>

        <TouchableOpacity
          style={[styles.inputWrapper, styles.selectTouchable, error ? styles.inputError : null]}
          onPress={() => setShowPicker(true)}
        >
          <Text style={[styles.input, !value && styles.placeholderText]}>
            {selectedLabel}
          </Text>
          <Icon name="chevron-down" size={20} color={COLORS.gray500} style={{ marginRight: SPACING.md }} />
        </TouchableOpacity>

        {(error || helper) && (
          <Text style={[styles.helperText, error ? styles.errorText : null]}>
            {error || helper}
          </Text>
        )}

        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.iosPickerOverlay}>
            <TouchableOpacity
              style={styles.iosPickerBackdrop}
              onPress={() => setShowPicker(false)}
            />
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <Text style={styles.iosPickerTitle}>{label}</Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.iosPickerDone}>Listo</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={value}
                onValueChange={(val) => {
                  onValueChange(val);
                  // No cerramos en iOS para que el usuario vea el wheel completo
                }}
                style={styles.iosPickerWheel}
              >
                <Picker.Item label={`Seleccione ${label.toLowerCase()}`} value="" color={COLORS.gray400} />
                {items.map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Android: Picker nativo directo
  return (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        {required && <Text style={styles.requiredStar}>*</Text>}
      </View>
      <View style={[styles.pickerWrapper, error ? styles.inputError : null]}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={styles.picker}
          dropdownIconColor={COLORS.gray600}
          mode="dropdown"
        >
          <Picker.Item label={`Seleccione ${label.toLowerCase()}`} value="" color={COLORS.gray400} />
          {items.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
      {(error || helper) && (
        <Text style={[styles.helperText, error ? styles.errorText : null]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: string;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => {
  const colorMap: Record<string, string> = {
    indigo: COLORS.primary,
    blue: COLORS.info,
    green: COLORS.success,
    red: COLORS.danger,
    purple: COLORS.purple,
    amber: COLORS.warning,
    orange: COLORS.orange,
    pink: '#EC4899',
  };

  const bgColorMap: Record<string, string> = {
    indigo: COLORS.primaryBg,
    blue: COLORS.infoBg,
    green: COLORS.successBg,
    red: COLORS.dangerBg,
    purple: COLORS.purpleBg,
    amber: COLORS.warningBg,
    orange: COLORS.orangeBg,
    pink: '#FCE7F3',
  };

  return (
    <Card style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIconBg, { backgroundColor: bgColorMap[color] || COLORS.gray100 }]}>
          <Icon name={icon} size={20} color={colorMap[color] || COLORS.gray600} />
        </View>
      </View>
      <Text style={styles.statCardTitle}>{title}</Text>
      <Text style={styles.statCardValue}>{value}</Text>
      {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
    </Card>
  );
};

const AmortizationRow: React.FC<{ item: AmortizationDetail; paymentMode: string }> = ({ item }) => (
  <View style={styles.amortizationRow}>
    <View style={styles.amortizationPeriod}>
      <Text style={styles.amortizationPeriodText}>{item.period}</Text>
    </View>
    <View style={styles.amortizationDate}>
      <Text style={styles.amortizationDateText}>{item.payment_date || '-'}</Text>
    </View>
    <View style={styles.amortizationPayment}>
      <Text style={styles.amortizationPaymentText}>${item.payment.toFixed(2)}</Text>
    </View>
    <View style={styles.amortizationPrincipal}>
      <Text style={styles.amortizationPrincipalText}>${item.principal.toFixed(2)}</Text>
    </View>
    <View style={styles.amortizationInterest}>
      <Text style={styles.amortizationInterestText}>${item.interest.toFixed(2)}</Text>
    </View>
    <View style={styles.amortizationRemaining}>
      <Text style={styles.amortizationRemainingText}>${item.remaining.toFixed(2)}</Text>
    </View>
  </View>
);

const LoanTypeCard: React.FC<{
  loanType: LoanType;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ loanType, isSelected, onSelect }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'formal': return 'bank';
      case 'informal': return 'hand-coin';
      case 'san': return 'calendar-clock';
      case 'micro': return 'seed';
      default: return 'cash';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'formal': return COLORS.primary;
      case 'informal': return COLORS.orange;
      case 'san': return COLORS.success;
      case 'micro': return COLORS.purple;
      default: return COLORS.gray500;
    }
  };

  const getCategoryBgColor = (category: string): string => {
    switch (category) {
      case 'formal': return COLORS.primaryBg;
      case 'informal': return COLORS.orangeBg;
      case 'san': return COLORS.successBg;
      case 'micro': return COLORS.purpleBg;
      default: return COLORS.gray100;
    }
  };

  const color = getCategoryColor(loanType.category);
  const bgColor = getCategoryBgColor(loanType.category);

  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[styles.loanTypeCard, isSelected && { borderColor: color, backgroundColor: bgColor }]}
    >
      <View style={styles.loanTypeCardRow}>
        <View style={[styles.loanTypeIcon, { backgroundColor: bgColor }]}>
          <Icon name={getCategoryIcon(loanType.category)} size={24} color={isSelected ? color : COLORS.gray600} />
        </View>
        <View style={styles.loanTypeInfo}>
          <Text style={styles.loanTypeName}>{loanType.name}</Text>
          <Text style={styles.loanTypeRange}>
            RD${loanType.min_amount.toLocaleString()} - RD${loanType.max_amount.toLocaleString()}
          </Text>
        </View>
        {isSelected && <Icon name="check-circle" size={24} color={color} />}
      </View>
      <View style={styles.loanTypeTags}>
        <View style={styles.loanTypeTag}>
          <Text style={styles.loanTypeTagText}>Interés: {loanType.default_interest}%</Text>
        </View>
        <View style={styles.loanTypeTag}>
          <Text style={styles.loanTypeTagText}>Plazo: {loanType.default_term} períodos</Text>
        </View>
        {loanType.requires_guarantor && (
          <View style={[styles.loanTypeTag, styles.loanTypeTagWarning]}>
            <Text style={styles.loanTypeTagTextWarning}>Requiere codeudor</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function LoanCreateScreen() {
    const navigation = useNavigation();

  const { createLoan } = useLoans();
  const { loans, loading, loadLoans, getStats } = useLoans();

  const { clients } = useClients();

  const [activeTab, setActiveTab] = useState<'loan' | 'guarantor' | 'warranty'>('loan');
  // const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [calculationMode, setCalculationMode] = useState<'standard' | 'fixedPayment' | 'profitPercentage' | 'san'>('san');
  const [showLoanTypeSelector, setShowLoanTypeSelector] = useState(false);

  const [sanConfig] = useState<SanLoanConfig>({
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

  const customers = clients;
  console.log('customers: ', customers);
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
  }, [formData.loanAmount, formData.interest, formData.installments, formData.amortization, formData.modality, formData.firstPaymentDate, formData.profitPercentage, calculationMode]);

  const calculateSanLoan = () => {
    const amount = parseFloat(formData.loanAmount) || 0;
    const termDays = parseInt(formData.installments) || 30;
    const interestValue = parseFloat(formData.interest) || 20;

    if (amount <= 0 || termDays <= 0) {
      setAmortizationDetails([]);
      return;
    }

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
        principalPayment = amount - (dailyPrincipal * (termDays - 1));
        interestPayment = totalInterestAmount - (dailyInterest * (termDays - 1));
      }

      remaining -= dailyPayment;
      remaining = Math.max(0, remaining);

      table.push({
        period: i,
        payment: dailyPayment,
        principal: principalPayment,
        interest: interestPayment,
        remaining: remaining,
        status: 'Pendiente',
        payment_date: paymentDate.toISOString().split('T')[0],
        is_weekend: isWeekend,
      });
    }

    setAmortizationDetails(table);
  };

  const calculateInformalLoan = () => {
    const amount = parseFloat(formData.loanAmount) || 0;
    const periods = parseInt(formData.installments) || 0;
    const profitPercentage = parseFloat(formData.profitPercentage) || 20;

    if (amount <= 0 || periods <= 0) {
      setAmortizationDetails([]);
      return;
    }

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

      let principalPayment = principalPerPeriod;
      let interestPayment = interestPerPeriod;

      if (i === periods) {
        principalPayment = amount - (principalPerPeriod * (periods - 1));
        interestPayment = totalProfit - (interestPerPeriod * (periods - 1));
      }

      remaining -= paymentPerPeriod;
      remaining = Math.max(0, remaining);

      table.push({
        period: i,
        payment: paymentPerPeriod,
        principal: principalPayment,
        interest: interestPayment,
        remaining: remaining,
        status: 'Pendiente',
        payment_date: paymentDate.toISOString().split('T')[0],
      });
    }

    setAmortizationDetails(table);
  };

  const calculateStandardLoan = () => {
    const amount = parseFloat(formData.loanAmount) || 0;
    const interestRate = parseFloat(formData.interest) || 0;
    const installments = parseInt(formData.installments) || 0;

    if (amount <= 0 || installments <= 0) {
      setAmortizationDetails([]);
      return;
    }

    const monthlyRate = interestRate / 100 / 12;
    let payment = 0;
    let balance = amount;
    let totalInterestPaid = 0;
    const table: AmortizationDetail[] = [];

    if (monthlyRate === 0) {
      payment = amount / installments;
    } else {
      payment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));
    }

    const startDate = new Date(formData.firstPaymentDate);
    const daysPerPeriod = paymentModes.find(m => m.id.toString() === formData.modality)?.days_per_period || 30;

    for (let i = 1; i <= installments; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setDate(startDate.getDate() + (i - 1) * daysPerPeriod);

      const interestPayment = balance * monthlyRate;
      let principalPayment = payment - interestPayment;

      if (i === installments) {
        principalPayment = balance;
      }

      balance -= principalPayment;
      balance = Math.max(0, balance);
      totalInterestPaid += interestPayment;

      table.push({
        period: i,
        payment: payment,
        principal: principalPayment,
        interest: interestPayment,
        remaining: balance,
        status: 'Pendiente',
        payment_date: paymentDate.toISOString().split('T')[0],
      });
    }

    setAmortizationDetails(table);
    setPeriodicPayment(payment);
    setTotalInterest(totalInterestPaid);
    setTotalPayment(amount + totalInterestPaid);
  };

  const calculateAmortization = () => {
    if (calculationMode === 'san' || selectedLoanType?.category === 'san') {
      calculateSanLoan();
    } else if (calculationMode === 'profitPercentage' || selectedLoanType?.category === 'informal') {
      calculateInformalLoan();
    } else {
      calculateStandardLoan();
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer) newErrors.customer = 'Seleccione un cliente';
    if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) newErrors.loanAmount = 'Monto inválido';
    if (!formData.installments || parseInt(formData.installments) <= 0) newErrors.installments = 'Número de períodos inválido';
    if (selectedLoanType?.category === 'san') {
      const amount = parseFloat(formData.loanAmount) || 0;
      if (amount < selectedLoanType.min_amount || amount > selectedLoanType.max_amount) {
        newErrors.loanAmount = `Monto debe estar entre RD$${selectedLoanType.min_amount} y RD$${selectedLoanType.max_amount}`;
      }
    }
    if (selectedLoanType?.requires_guarantor && !formData.nameCodebtor) {
      newErrors.nameCodebtor = 'Se requiere codeudor para este tipo de préstamo';
    }
    if (selectedLoanType?.requires_collateral && !formData.guarantee_type) {
      newErrors.guarantee_type = 'Se requiere garantía para este tipo de préstamo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!validateForm()) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }

    // setLoading(true);

    try {
      // Preparar datos para SQLite
      const loanData = {
        clientId: formData.customer,
        loanTypeId: formData.loan_type,
        loanTypeName: selectedLoanType?.name || '',
        loanTypeCategory: selectedLoanType?.category || '',
        amount: parseFloat(formData.loanAmount) || 0,
        interestRate: parseFloat(formData.interest) || 0,
        term: parseInt(formData.installments) || 0,
        paymentFrequency: paymentModes.find(m => m.id.toString() === formData.modality)?.code || 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        firstPaymentDate: formData.firstPaymentDate,
        periodicPayment,
        totalInterest,
        totalAmount: totalPayment,
        cashBoxId: formData.cash_box,
        paymentMethodId: formData.payment_method,
        referenceCode: formData.referenceCode,

        // Codeudor
        guarantorName: formData.nameCodebtor,
        guarantorId: formData.coDebtorId,
        guarantorPhone: formData.phoneCodebtor,
        guarantorAddress: formData.addressCodebtor,

        // Garantía
        guaranteeType: formData.guarantee_type,
        guaranteeValue: parseFloat(formData.guarantee_value) || 0,
        guaranteeDescription: formData.guarantee_description,
        guaranteeFileNumber: formData.guarantee_file_number,
        guaranteeNotes: formData.guarantee_notes,

        // San
        sanIncludeWeekends: formData.san_include_weekends,
        sanFirstPaymentTomorrow: formData.san_first_payment_tomorrow,

        // Informal
        informalProfitPercentage: parseFloat(formData.profitPercentage) || 0,

        // Amortización
        amortizationSchedule: amortizationDetails,
      };

      // Guardar en SQLite
      const savedLoan = await createLoan(loanData);
      console.log("SAVELOAN : ", savedLoan);
      // setLoading(false);
      setShowSuccessModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error) {
      // setLoading(false);
      Alert.alert('Error', 'No se pudo guardar el préstamo en SQLite');
    }
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      calculateAmortization();
      setRefreshing(false);
    }, 1000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2
    }).format(value);
  };

  const chartData = useMemo(() => {
    if (amortizationDetails.length === 0) return { labels: [], datasets: [{ data: [] }] };

    const maxPeriods = Math.min(amortizationDetails.length, 30);
    const labels = amortizationDetails.slice(0, maxPeriods).map(d => d.period.toString());
    const principalData = amortizationDetails.slice(0, maxPeriods).map(d => d.principal);
    const interestData = amortizationDetails.slice(0, maxPeriods).map(d => d.interest);

    return {
      labels,
      datasets: [
        { data: principalData, color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`, strokeWidth: 2 },
        { data: interestData, color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, strokeWidth: 2 }
      ],
      legend: ['Capital', 'Interés']
    };
  }, [amortizationDetails]);

  const getPaymentPeriodLabel = () => {
    const mode = paymentModes.find(m => m.id.toString() === formData.modality);
    return mode?.name || 'Período';
  };

  const getHeaderColors = (): [string, string] => {
    if (selectedLoanType?.category === 'san') return [COLORS.successDark, COLORS.success];
    if (selectedLoanType?.category === 'informal') return [COLORS.orange, '#EA580C'];
    return [COLORS.primary, COLORS.primaryLight];
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={getHeaderColors()[0]} />

        <LinearGradient colors={getHeaderColors()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Icon
                name={selectedLoanType?.category === 'san' ? 'calendar-clock' : selectedLoanType?.category === 'informal' ? 'hand-coin' : 'bank'}
                size={28}
                color={COLORS.white}
              />
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>{selectedLoanType?.name || 'Nuevo Préstamo'}</Text>
                <Text style={styles.headerSubtitle}>
                  {selectedLoanType?.category === 'san' ? 'Préstamo tipo San - Pagos diarios' :
                    selectedLoanType?.category === 'informal' ? 'Préstamo informal - Interés plano' :
                      'Complete los datos del préstamo'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowLoanTypeSelector(true)} style={styles.headerButton}>
              <Icon name="swap-horizontal" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.tabsContainer}>
          {[
            { id: 'loan' as const, label: 'Préstamo', icon: 'cash-multiple' },
            { id: 'guarantor' as const, label: 'Codeudor', icon: 'account-group' },
            { id: 'warranty' as const, label: 'Garantía', icon: 'shield-check' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.id);
              }}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            >
              <Icon name={tab.icon} size={18} color={activeTab === tab.id ? COLORS.primary : COLORS.gray500} />
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
              {tab.id === 'guarantor' && selectedLoanType?.requires_guarantor && <View style={styles.tabBadge} />}
              {tab.id === 'warranty' && selectedLoanType?.requires_collateral && <View style={styles.tabBadge} />}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
        >
          {activeTab === 'loan' && (
            <>
              {selectedLoanType && (
                <Card style={styles.selectedTypeCard}>
                  <View style={styles.selectedTypeRow}>
                    <View style={styles.selectedTypeInfo}>
                      <Text style={styles.selectedTypeLabel}>Tipo de préstamo seleccionado</Text>
                      <Text style={styles.selectedTypeName}>{selectedLoanType.name}</Text>
                    </View>
                    <View style={[
                      styles.selectedTypeBadge,
                      selectedLoanType.category === 'san' && styles.badgeSuccess,
                      selectedLoanType.category === 'informal' && styles.badgeOrange,
                      selectedLoanType.category === 'formal' && styles.badgePrimary,
                    ]}>
                      <Text style={[
                        styles.selectedTypeBadgeText,
                        selectedLoanType.category === 'san' && styles.badgeTextSuccess,
                        selectedLoanType.category === 'informal' && styles.badgeTextOrange,
                      ]}>
                        {selectedLoanType.category === 'san' ? 'Tipo San' : selectedLoanType.category === 'informal' ? 'Informal' : 'Formal'}
                      </Text>
                    </View>
                  </View>
                </Card>
              )}

              <Card style={styles.formCard}>
                <Text style={styles.cardTitle}>Información del Cliente</Text>
                <SelectField
                  label="Cliente"
                  value={formData.customer}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customer: value }))}
                  items={customers.map(c => ({ label: `${c.firstName} ${c.lastName}`, value: c.id.toString() }))}
                  error={errors.customer}
                  required
                />

                {selectedCustomer && (
                  <View style={styles.customerCard}>
                    <View style={styles.customerRow}>
                      <View style={styles.customerAvatar}>
                        <Icon name="account" size={20} color={COLORS.primary} />
                      </View>
                      <View style={styles.customerInfo}>
                        <View style={styles.customerNameRow}>
                          <Text style={styles.customerName}>{selectedCustomer.firstName} {selectedCustomer.lastName}</Text>

                        </View>
                        <Text style={styles.customerDetails}>
                          {selectedCustomer.documentType} : {selectedCustomer.documentNumber}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </Card>

              {selectedLoanType?.category === 'san' && (
                <Card style={[styles.formCard, styles.sanCard]}>
                  <View style={styles.sanHeader}>
                    <Icon name="calendar-clock" size={20} color={COLORS.success} />
                    <Text style={styles.sanTitle}>Configuración San</Text>
                  </View>

                  <View style={styles.sanInfo}>
                    <Text style={styles.sanInfoText}>
                      Los préstamos San son pagos diarios fijos con interés calculado sobre el capital inicial.
                    </Text>
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Incluir fines de semana</Text>
                    <Switch
                      value={formData.san_include_weekends}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, san_include_weekends: value }))}
                      trackColor={{ false: COLORS.gray300, true: COLORS.success }}
                      thumbColor={COLORS.white}
                    />
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Primer pago mañana</Text>
                    <Switch
                      value={formData.san_first_payment_tomorrow}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, san_first_payment_tomorrow: value }))}
                      trackColor={{ false: COLORS.gray300, true: COLORS.success }}
                      thumbColor={COLORS.white}
                    />
                  </View>
                </Card>
              )}

              {selectedLoanType?.category === 'informal' && (
                <Card style={[styles.formCard, styles.informalCard]}>
                  <View style={styles.informalHeader}>
                    <Icon name="hand-coin" size={20} color={COLORS.orange} />
                    <Text style={styles.informalTitle}>Configuración Informal</Text>
                  </View>

                  <SelectField
                    label="Frecuencia de pago"
                    value={informalConfig.payment_frequency}
                    onValueChange={(value) => setInformalConfig(prev => ({ ...prev, payment_frequency: value as any }))}
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
                    onChangeText={(value) => setFormData(prev => ({ ...prev, profitPercentage: value }))}
                    placeholder="Ej: 20"
                    keyboardType="numeric"
                    suffix="%"
                    helper="Porcentaje sobre el capital prestado"
                    required
                  />
                </Card>
              )}

              <Card style={styles.formCard}>
                <Text style={styles.cardTitle}>Parámetros del Préstamo</Text>

                <InputField
                  label={selectedLoanType?.category === 'san' ? 'Monto a prestar' : 'Monto del préstamo'}
                  value={formData.loanAmount}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, loanAmount: value }))}
                  placeholder={`Ej: ${selectedLoanType?.min_amount || 5000}`}
                  keyboardType="numeric"
                  prefix="RD$"
                  error={errors.loanAmount}
                  required
                  helper={selectedLoanType ? `Mín: RD$${selectedLoanType.min_amount} - Máx: RD$${selectedLoanType.max_amount}` : ''}
                />

                <InputField
                  label={selectedLoanType?.category === 'san' ? 'Plazo (días)' : 'Plazo'}
                  value={formData.installments}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, installments: value }))}
                  placeholder={selectedLoanType?.category === 'san' ? 'Ej: 30' : 'Ej: 12'}
                  keyboardType="numeric"
                  error={errors.installments}
                  required
                />

                <InputField
                  label={selectedLoanType?.category === 'san' ? 'Porcentaje de beneficio' : 'Tasa de interés anual'}
                  value={formData.interest}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, interest: value }))}
                  placeholder={`Ej: ${selectedLoanType?.default_interest || 12}`}
                  keyboardType="numeric"
                  suffix="%"
                  helper={selectedLoanType?.category === 'san' ? 'Sobre el capital inicial' : 'Tasa anual'}
                  required
                />

                <SelectField
                  label="Modalidad de pago"
                  value={formData.modality}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, modality: value }))}
                  items={paymentModes.map(m => ({ label: m.name, value: m.id.toString() }))}
                  required
                />

                <InputField
                  label="Fecha primer pago"
                  value={formData.firstPaymentDate}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, firstPaymentDate: value }))}
                  placeholder="YYYY-MM-DD"
                  required
                />
              </Card>

              <Card style={styles.formCard}>
                <Text style={styles.cardTitle}>Configuración de Desembolso</Text>

                <SelectField
                  label="Caja"
                  value={formData.cash_box}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cash_box: value }))}
                  items={cashBoxes.map(c => ({ label: `${c.name} (RD$${c.balance.toLocaleString()})`, value: c.id.toString() }))}
                />

                <SelectField
                  label="Forma de entrega"
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                  items={paymentMethods.map(m => ({ label: m.name, value: m.id.toString() }))}
                />

                <InputField
                  label="Referencia"
                  value={formData.referenceCode}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, referenceCode: value }))}
                  placeholder="Número de referencia (opcional)"
                />
              </Card>

              <Card style={styles.formCard}>
                <Text style={styles.cardTitle}>Resumen del Préstamo</Text>

                <View style={styles.statsRow}>
                  <StatCard title="Capital" value={formatCurrency(parseFloat(formData.loanAmount) || 0)} icon="cash" color="blue" />
                  <StatCard title="Plazo" value={`${formData.installments} ${selectedLoanType?.category === 'san' ? 'días' : getPaymentPeriodLabel().toLowerCase()}`} icon="calendar-clock" color="purple" />
                </View>

                <View style={styles.statsRow}>
                  <StatCard title={selectedLoanType?.category === 'san' ? 'Beneficio' : 'Interés'} value={`${formData.interest}%`} icon="percent" color={selectedLoanType?.category === 'san' ? 'green' : 'amber'} />
                  {periodicPayment > 0 && (
                    <StatCard title={`Pago ${selectedLoanType?.category === 'san' ? 'Diario' : 'por Período'}`} value={formatCurrency(periodicPayment)} icon="credit-card" color="orange" />
                  )}
                </View>

                {totalInterest > 0 && (
                  <View style={styles.statsRow}>
                    <StatCard title={selectedLoanType?.category === 'san' ? 'Beneficio Total' : 'Interés Total'} value={formatCurrency(totalInterest)} icon="trending-up" color="red" subtitle={`${((totalInterest / parseFloat(formData.loanAmount)) * 100).toFixed(1)}% del capital`} />
                    <StatCard title="Total a Pagar" value={formatCurrency(totalPayment)} icon="cash-check" color="indigo" />
                  </View>
                )}
              </Card>

              <Card style={styles.formCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {selectedLoanType?.category === 'san' ? 'Plan de Pagos Diarios' : 'Plan de Amortización'}
                  </Text>
                  {amortizationDetails.length > 0 && (
                    <TouchableOpacity onPress={() => setShowAmortizationModal(true)} style={styles.viewAllButton}>
                      <Text style={styles.viewAllText}>Ver todo</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {amortizationDetails.length > 0 ? (
                  <>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, styles.tableCellPeriod]}>#</Text>
                      <Text style={[styles.tableHeaderCell, styles.tableCellDate]}>Fecha</Text>
                      <Text style={[styles.tableHeaderCell, styles.tableCellPayment]}>Pago</Text>
                      <Text style={[styles.tableHeaderCell, styles.tableCellPrincipal]}>Capital</Text>
                      <Text style={[styles.tableHeaderCell, styles.tableCellInterest]}>Interés</Text>
                      <Text style={[styles.tableHeaderCell, styles.tableCellRemaining]}>Saldo</Text>
                    </View>

                    {amortizationDetails.slice(0, 5).map((item) => (
                      <AmortizationRow key={item.period} item={item} paymentMode={formData.modality} />
                    ))}

                    {amortizationDetails.length > 5 && (
                      <Text style={styles.moreItemsText}>
                        + {amortizationDetails.length - 5} {selectedLoanType?.category === 'san' ? 'días' : 'períodos'} más
                      </Text>
                    )}

                    <View style={styles.chartContainer}>
                      <Text style={styles.chartTitle}>Evolución de Pagos</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <LineChart
                          data={chartData}
                          width={Math.max(SCREEN_WIDTH - 80, Math.min(chartData.labels.length * 40, 600))}
                          height={200}
                          chartConfig={{
                            backgroundColor: COLORS.white,
                            backgroundGradientFrom: COLORS.white,
                            backgroundGradientTo: COLORS.white,
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary }
                          }}
                          bezier
                          style={styles.chart}
                        />
                      </ScrollView>
                      <View style={styles.chartLegend}>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                          <Text style={styles.legendText}>Capital</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
                          <Text style={styles.legendText}>Interés</Text>
                        </View>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <Icon name="file-document-outline" size={48} color={COLORS.gray300} />
                    <Text style={styles.emptyStateText}>Complete los datos para generar el plan de pagos</Text>
                  </View>
                )}
              </Card>
            </>
          )}

          {activeTab === 'guarantor' && (
            <Card style={styles.formCard}>
              <View style={styles.guarantorHeader}>
                <Icon name="account-group" size={20} color={COLORS.primary} />
                <Text style={styles.guarantorTitle}>Información del Codeudor</Text>
                {selectedLoanType?.requires_guarantor && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredBadgeText}>Requerido</Text>
                  </View>
                )}
              </View>

              <InputField label="Nombres Completos" value={formData.nameCodebtor} onChangeText={(value) => setFormData(prev => ({ ...prev, nameCodebtor: value }))} placeholder="Nombre completo del codeudor" error={errors.nameCodebtor} required={selectedLoanType?.requires_guarantor} />
              <InputField label="Número de Identificación" value={formData.coDebtorId} onChangeText={(value) => setFormData(prev => ({ ...prev, coDebtorId: value }))} placeholder="Cédula o identificación" required={selectedLoanType?.requires_guarantor} />
              <InputField label="Teléfono" value={formData.phoneCodebtor} onChangeText={(value) => setFormData(prev => ({ ...prev, phoneCodebtor: value }))} placeholder="Número de contacto" keyboardType="phone-pad" />
              <InputField label="Dirección" value={formData.addressCodebtor} onChangeText={(value) => setFormData(prev => ({ ...prev, addressCodebtor: value }))} placeholder="Dirección completa" multiline numberOfLines={3} />

              <View style={styles.infoBox}>
                <Icon name="information" size={20} color={COLORS.info} />
                <Text style={styles.infoBoxText}>
                  El codeudor será responsable solidario del préstamo en caso de incumplimiento.
                </Text>
              </View>
            </Card>
          )}

          {activeTab === 'warranty' && (
            <Card style={styles.formCard}>
              <View style={styles.guarantorHeader}>
                <Icon name="shield-check" size={20} color={COLORS.primary} />
                <Text style={styles.guarantorTitle}>Información de Garantía</Text>
                {selectedLoanType?.requires_collateral && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredBadgeText}>Requerido</Text>
                  </View>
                )}
              </View>

              <SelectField label="Tipo de Garantía" value={formData.guarantee_type} onValueChange={(value) => setFormData(prev => ({ ...prev, guarantee_type: value }))} items={guaranteeTypes.map(g => ({ label: g.name, value: g.id.toString() }))} error={errors.guarantee_type} required={selectedLoanType?.requires_collateral} />
              <InputField label="Valor de la Garantía" value={formData.guarantee_value} onChangeText={(value) => setFormData(prev => ({ ...prev, guarantee_value: value }))} placeholder="Valor estimado" keyboardType="numeric" prefix="RD$" />
              <InputField label="Descripción de la Garantía" value={formData.guarantee_description} onChangeText={(value) => setFormData(prev => ({ ...prev, guarantee_description: value }))} placeholder="Describa detalladamente la garantía" multiline numberOfLines={4} />
              <InputField label="Número de Expediente" value={formData.guarantee_file_number} onChangeText={(value) => setFormData(prev => ({ ...prev, guarantee_file_number: value }))} placeholder="Número de registro" />
              <InputField label="Notas Adicionales" value={formData.guarantee_notes} onChangeText={(value) => setFormData(prev => ({ ...prev, guarantee_notes: value }))} placeholder="Observaciones sobre la garantía" multiline numberOfLines={3} />

              {formData.guarantee_value && parseFloat(formData.guarantee_value) > 0 && parseFloat(formData.loanAmount) > 0 && (
                <View style={[styles.guaranteeValidation, parseFloat(formData.guarantee_value) >= parseFloat(formData.loanAmount) ? styles.guaranteeValid : styles.guaranteeInvalid]}>
                  <Icon name={parseFloat(formData.guarantee_value) >= parseFloat(formData.loanAmount) ? 'check-circle' : 'alert'} size={20} color={parseFloat(formData.guarantee_value) >= parseFloat(formData.loanAmount) ? COLORS.success : COLORS.warning} />
                  <Text style={[styles.guaranteeValidationText, parseFloat(formData.guarantee_value) >= parseFloat(formData.loanAmount) ? styles.guaranteeValidText : styles.guaranteeInvalidText]}>
                    {parseFloat(formData.guarantee_value) >= parseFloat(formData.loanAmount)
                      ? `Garantía suficiente: ${((parseFloat(formData.guarantee_value) / parseFloat(formData.loanAmount)) * 100).toFixed(0)}% del préstamo`
                      : `Garantía insuficiente: solo cubre ${((parseFloat(formData.guarantee_value) / parseFloat(formData.loanAmount)) * 100).toFixed(0)}% del préstamo`}
                  </Text>
                </View>
              )}
            </Card>
          )}

          <View style={styles.actionButtons}>
            <View style={styles.actionButtonWrapper}>
              <GradientButton onPress={() => { }} variant="outline">Cancelar</GradientButton>
            </View>
            <View style={styles.actionButtonWrapper}>
              <GradientButton onPress={handleSubmit} loading={loading} disabled={amortizationDetails.length === 0} variant={selectedLoanType?.category === 'san' ? 'success' : 'primary'} icon="check-circle">
                {selectedLoanType?.category === 'san' ? 'Crear San' : 'Registrar Préstamo'}
              </GradientButton>
            </View>
          </View>
        </ScrollView>

        {/* Modal de Selección de Tipo de Préstamo */}
        <Modal visible={showLoanTypeSelector} animationType="slide" transparent onRequestClose={() => setShowLoanTypeSelector(false)}>
          <BlurView intensity={100} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tipos de Préstamo</Text>
                <TouchableOpacity onPress={() => setShowLoanTypeSelector(false)}>
                  <Icon name="close" size={24} color={COLORS.gray600} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalSectionTitle}>FORMALES</Text>
                {loanTypes.filter(t => t.category === 'formal').map((type) => (
                  <LoanTypeCard key={type.id} loanType={type} isSelected={formData.loan_type === type.id.toString()} onSelect={() => { setFormData(prev => ({ ...prev, loan_type: type.id.toString() })); setShowLoanTypeSelector(false); }} />
                ))}

                <Text style={[styles.modalSectionTitle, styles.modalSectionTitleMargin]}>INFORMALES</Text>
                {loanTypes.filter(t => t.category === 'informal').map((type) => (
                  <LoanTypeCard key={type.id} loanType={type} isSelected={formData.loan_type === type.id.toString()} onSelect={() => { setFormData(prev => ({ ...prev, loan_type: type.id.toString() })); setShowLoanTypeSelector(false); }} />
                ))}

                <Text style={[styles.modalSectionTitle, styles.modalSectionTitleMargin]}>PRÉSTAMOS SAN</Text>
                {loanTypes.filter(t => t.category === 'san').map((type) => (
                  <LoanTypeCard key={type.id} loanType={type} isSelected={formData.loan_type === type.id.toString()} onSelect={() => { setFormData(prev => ({ ...prev, loan_type: type.id.toString() })); setShowLoanTypeSelector(false); }} />
                ))}
              </ScrollView>
            </View>
          </BlurView>
        </Modal>

        {/* Modal de Amortización Completa */}
        <Modal visible={showAmortizationModal} animationType="slide" transparent onRequestClose={() => setShowAmortizationModal(false)}>
          <BlurView intensity={100} tint="dark" style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.modalContentLarge]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {selectedLoanType?.category === 'san' ? 'Plan de Pagos Diarios' : 'Plan de Amortización'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {amortizationDetails.length} {selectedLoanType?.category === 'san' ? 'días' : 'períodos'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowAmortizationModal(false)}>
                  <Icon name="close" size={24} color={COLORS.gray600} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.tableCellPeriod]}>#</Text>
                  <Text style={[styles.tableHeaderCell, styles.tableCellDate]}>Fecha</Text>
                  <Text style={[styles.tableHeaderCell, styles.tableCellPayment]}>Pago</Text>
                  <Text style={[styles.tableHeaderCell, styles.tableCellPrincipal]}>Capital</Text>
                  <Text style={[styles.tableHeaderCell, styles.tableCellInterest]}>Interés</Text>
                  <Text style={[styles.tableHeaderCell, styles.tableCellRemaining]}>Saldo</Text>
                </View>

                {amortizationDetails.map((item) => (
                  <AmortizationRow key={item.period} item={item} paymentMode={formData.modality} />
                ))}

                <View style={styles.modalSummary}>
                  <Text style={styles.modalSummaryTitle}>Resumen Total</Text>
                  <View style={styles.modalSummaryRow}>
                    <Text style={styles.modalSummaryLabel}>Capital prestado:</Text>
                    <Text style={styles.modalSummaryValue}>{formatCurrency(parseFloat(formData.loanAmount) || 0)}</Text>
                  </View>
                  <View style={styles.modalSummaryRow}>
                    <Text style={styles.modalSummaryLabel}>Interés total:</Text>
                    <Text style={styles.modalSummaryValue}>{formatCurrency(totalInterest)}</Text>
                  </View>
                  <View style={styles.modalSummaryRow}>
                    <Text style={styles.modalSummaryLabel}>Total a pagar:</Text>
                    <Text style={styles.modalSummaryValueBold}>{formatCurrency(totalPayment)}</Text>
                  </View>
                  <View style={styles.modalSummaryRow}>
                    <Text style={styles.modalSummaryLabel}>Pago {selectedLoanType?.category === 'san' ? 'diario' : 'periódico'}:</Text>
                    <Text style={styles.modalSummaryValue}>{formatCurrency(periodicPayment)}</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <GradientButton onPress={() => setShowAmortizationModal(false)}>Cerrar</GradientButton>
              </View>
            </View>
          </BlurView>
        </Modal>

        {/* Modal de Éxito */}
        <Modal visible={showSuccessModal} animationType="fade" transparent onRequestClose={() => setShowSuccessModal(false)}>
          <BlurView intensity={100} tint="dark" style={styles.successModalOverlay}>
            <View style={styles.successModalContent}>
              <View style={styles.successModalIcon}>
                <View style={[styles.successIconBg, selectedLoanType?.category === 'san' ? styles.successIconBgGreen : styles.successIconBgPrimary]}>
                  <Icon name="check-circle" size={48} color={selectedLoanType?.category === 'san' ? COLORS.success : COLORS.primary} />
                </View>
              </View>
              <Text style={styles.successModalTitle}>
                ¡{selectedLoanType?.category === 'san' ? 'San Creado!' : 'Préstamo Creado!'}
              </Text>
              <Text style={styles.successModalMessage}>
                El préstamo ha sido registrado exitosamente.
                {selectedLoanType?.category === 'san' && ' Recuerda cobrar el primer pago mañana.'}
              </Text>

              <View style={styles.successModalSummary}>
                <View style={styles.successSummaryRow}>
                  <Text style={styles.successSummaryLabel}>Cliente:</Text>
                  <Text style={styles.successSummaryValue}>{selectedCustomer?.firstName} {selectedCustomer?.lastName}</Text>
                </View>
                <View style={styles.successSummaryRow}>
                  <Text style={styles.successSummaryLabel}>Monto:</Text>
                  <Text style={styles.successSummaryValue}>{formatCurrency(parseFloat(formData.loanAmount) || 0)}</Text>
                </View>
                <View style={styles.successSummaryRow}>
                  <Text style={styles.successSummaryLabel}>Pago {selectedLoanType?.category === 'san' ? 'diario' : ''}:</Text>
                  <Text style={styles.successSummaryValue}>{formatCurrency(periodicPayment)}</Text>
                </View>
                <View style={styles.successSummaryRow}>
                  <Text style={styles.successSummaryLabel}>Total a pagar:</Text>
                  <Text style={styles.successSummaryValueBold}>{formatCurrency(totalPayment)}</Text>
                </View>
              </View>

              <View style={styles.successModalButtons}>
                <GradientButton onPress={() => {
                  setShowSuccessModal(false);
                   const parent = navigation.getParent();
                    if (parent) {
                      parent.navigate('MainDrawer', {
                        screen: 'MainTabs',
                        params: {
                          screen: 'Loans'
                        }
                      });
                    } else {
                      navigation.goBack();
                    }

                  //  (navigation as any).navigate('Loans', {
                  //   refresh: true // por si quieres forzar reload
                  // });

                }} variant={selectedLoanType?.category === 'san' ? 'success' : 'primary'} icon="eye">
                  Ver Préstamo
                </GradientButton>
                <View style={styles.buttonSpacer} />
                <GradientButton onPress={() => { setShowSuccessModal(false); setFormData({ ...formData, loanAmount: '5000', installments: selectedLoanType?.default_term.toString() || '30', interest: selectedLoanType?.default_interest.toString() || '20' }); setAmortizationDetails([]); }} variant="outline">
                  Crear Otro
                </GradientButton>
              </View>
            </View>
          </BlurView>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ============================================================
// ESTILOS (StyleSheet)
// ============================================================

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: COLORS.gray50 },

  // Header
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerTitleContainer: { marginLeft: SPACING.md },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  headerButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  // Tabs
  tabsContainer: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: -SPACING.lg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xs, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md },
  tabActive: { backgroundColor: COLORS.primaryBg },
  tabLabel: { marginLeft: SPACING.xs, fontWeight: '500', color: COLORS.gray500, fontSize: 13 },
  tabLabelActive: { color: COLORS.primary },
  tabBadge: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.danger, marginLeft: SPACING.xs },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },

  // Cards
  card: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.gray100, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  formCard: { marginBottom: SPACING.md },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray800, marginBottom: SPACING.md },

  // Selected Type Card
  selectedTypeCard: { marginBottom: SPACING.md },
  selectedTypeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedTypeInfo: { flex: 1 },
  selectedTypeLabel: { fontSize: 11, color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5 },
  selectedTypeName: { fontSize: 18, fontWeight: '700', color: COLORS.gray800 },
  selectedTypeBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full },
  badgePrimary: { backgroundColor: COLORS.primaryBg },
  badgeSuccess: { backgroundColor: COLORS.successBg },
  badgeOrange: { backgroundColor: COLORS.orangeBg },
  selectedTypeBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  badgeTextSuccess: { color: COLORS.successDark },
  badgeTextOrange: { color: COLORS.orange },

  // Customer Card
  customerCard: { backgroundColor: COLORS.gray50, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm },
  customerRow: { flexDirection: 'row', alignItems: 'center' },
  customerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center' },
  customerInfo: { flex: 1, marginLeft: SPACING.md },
  customerNameRow: { flexDirection: 'row', alignItems: 'center' },
  customerName: { fontWeight: '600', color: COLORS.gray800 },
  vipBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full, marginLeft: SPACING.sm },
  vipText: { fontSize: 10, fontWeight: '600', color: COLORS.warning },
  customerDetails: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },

  // San Card
  sanCard: { backgroundColor: COLORS.successBg, borderColor: COLORS.success },
  sanHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  sanTitle: { fontSize: 15, fontWeight: '600', color: COLORS.successDark, marginLeft: SPACING.sm },
  sanInfo: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  sanInfoText: { fontSize: 13, color: COLORS.gray600, lineHeight: 18 },

  // Informal Card
  informalCard: { backgroundColor: COLORS.orangeBg, borderColor: COLORS.orange },
  informalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  informalTitle: { fontSize: 15, fontWeight: '600', color: '#C2410C', marginLeft: SPACING.sm },

  // Switch
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.sm },
  switchLabel: { fontSize: 14, color: COLORS.gray700 },

  // Inputs
  inputContainer: { marginBottom: SPACING.md },
  labelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  inputLabel: { fontSize: 14, fontWeight: '500', color: COLORS.gray700 },
  requiredStar: { color: COLORS.danger, marginLeft: 2 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray50, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray200 },
  inputError: { borderColor: COLORS.danger },
  inputDisabled: { backgroundColor: COLORS.gray100, opacity: 0.7 },
  inputPrefix: { paddingLeft: SPACING.md },
  preffixText: { fontSize: 16, color: COLORS.gray500 },
  input: { flex: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 15, color: COLORS.gray800 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  inputSuffix: { paddingRight: SPACING.md },
  suffixText: { fontSize: 15, color: COLORS.gray500 },
  helperText: { fontSize: 12, color: COLORS.gray500, marginTop: SPACING.xs },
  errorText: { color: COLORS.danger },

  // Picker
  pickerWrapper: { backgroundColor: COLORS.gray50, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray200 },
  picker: { height: 50 },

  // Stats
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  statCard: { flex: 1, padding: SPACING.md },
  statCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  statIconBg: { width: 40, height: 40, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  statCardTitle: { fontSize: 11, color: COLORS.gray500, marginBottom: 2 },
  statCardValue: { fontSize: 18, fontWeight: '700', color: COLORS.gray800 },
  statCardSubtitle: { fontSize: 10, color: COLORS.gray500, marginTop: 2 },

  // Amortization Table
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.gray800 },
  viewAllButton: { backgroundColor: COLORS.primaryBg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md },
  viewAllText: { fontSize: 12, fontWeight: '500', color: COLORS.primary },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.gray100, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.xs },
  tableHeaderCell: { fontSize: 11, fontWeight: '600', color: COLORS.gray600 },
  tableCellPeriod: { width: 30 },
  tableCellDate: { width: 70 },
  tableCellPayment: { flex: 1, textAlign: 'right' },
  tableCellPrincipal: { width: 60, textAlign: 'right' },
  tableCellInterest: { width: 60, textAlign: 'right' },
  tableCellRemaining: { width: 70, textAlign: 'right' },
  amortizationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  amortizationPeriod: { width: 30 },
  amortizationPeriodText: { fontSize: 13, fontWeight: '500', color: COLORS.gray600 },
  amortizationDate: { width: 70 },
  amortizationDateText: { fontSize: 12, color: COLORS.gray500 },
  amortizationPayment: { flex: 1 },
  amortizationPaymentText: { fontSize: 13, fontWeight: '500', color: COLORS.gray800, textAlign: 'right' },
  amortizationPrincipal: { width: 60 },
  amortizationPrincipalText: { fontSize: 12, color: COLORS.gray600, textAlign: 'right' },
  amortizationInterest: { width: 60 },
  amortizationInterestText: { fontSize: 12, color: COLORS.gray600, textAlign: 'right' },
  amortizationRemaining: { width: 70 },
  amortizationRemainingText: { fontSize: 13, fontWeight: '500', color: COLORS.gray800, textAlign: 'right' },
  moreItemsText: { fontSize: 13, color: COLORS.gray500, textAlign: 'center', marginTop: SPACING.md },

  // Chart
  chartContainer: { marginTop: SPACING.xl },
  chartTitle: { fontSize: 14, fontWeight: '500', color: COLORS.gray700, marginBottom: SPACING.sm },
  chart: { marginVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.md },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: SPACING.xs },
  legendText: { fontSize: 12, color: COLORS.gray600 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxxl },
  emptyStateText: { fontSize: 14, color: COLORS.gray500, marginTop: SPACING.md },

  // Guarantor & Warranty
  guarantorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  guarantorTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray800, marginLeft: SPACING.sm, flex: 1 },
  requiredBadge: { backgroundColor: COLORS.dangerBg, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  requiredBadgeText: { fontSize: 10, fontWeight: '600', color: COLORS.danger },
  infoBox: { backgroundColor: COLORS.infoBg, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, flexDirection: 'row', alignItems: 'flex-start', marginTop: SPACING.md },
  infoBoxText: { fontSize: 13, color: COLORS.info, marginLeft: SPACING.sm, flex: 1 },

  // Guarantee Validation
  guaranteeValidation: { borderRadius: BORDER_RADIUS.md, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  guaranteeValid: { backgroundColor: COLORS.successBg },
  guaranteeInvalid: { backgroundColor: COLORS.warningBg },
  guaranteeValidationText: { fontSize: 13, marginLeft: SPACING.sm, flex: 1 },
  guaranteeValidText: { color: COLORS.successDark },
  guaranteeInvalidText: { color: '#92400E' },

  // Loan Type Card
  loanTypeCard: { padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderWidth: 2, borderColor: COLORS.gray200, marginBottom: SPACING.sm },
  loanTypeCardRow: { flexDirection: 'row', alignItems: 'center' },
  loanTypeIcon: { width: 48, height: 48, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  loanTypeInfo: { flex: 1, marginLeft: SPACING.md },
  loanTypeName: { fontSize: 15, fontWeight: '600', color: COLORS.gray800 },
  loanTypeRange: { fontSize: 11, color: COLORS.gray500, marginTop: 2 },
  loanTypeTags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.sm },
  loanTypeTag: { backgroundColor: COLORS.gray100, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full },
  loanTypeTagText: { fontSize: 11, color: COLORS.gray600 },
  loanTypeTagWarning: { backgroundColor: '#FEF3C7' },
  loanTypeTagTextWarning: { color: '#92400E' },

  // Action Buttons
  actionButtons: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg, marginBottom: SPACING.xl },
  actionButtonWrapper: { flex: 1 },

  // Gradient Button
  gradientButton: { borderRadius: BORDER_RADIUS.md, overflow: 'hidden' },
  gradientButtonDisabled: { opacity: 0.5 },
  gradient: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg },
  gradientOutline: { backgroundColor: COLORS.transparent, borderWidth: 2, borderColor: COLORS.primary },
  gradientContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonIcon: { marginRight: SPACING.sm },
  gradientButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.white, textAlign: 'center' },
  gradientButtonTextOutline: { color: COLORS.primary },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: BORDER_RADIUS.xxl, borderTopRightRadius: BORDER_RADIUS.xxl, maxHeight: '80%' },
  modalContentLarge: { maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray800 },
  modalSubtitle: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  modalBody: { padding: SPACING.lg },
  modalSectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.gray500, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalSectionTitleMargin: { marginTop: SPACING.lg },
  modalFooter: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.gray200 },
  modalSummary: { marginTop: SPACING.xl, padding: SPACING.lg, backgroundColor: COLORS.gray50, borderRadius: BORDER_RADIUS.lg },
  modalSummaryTitle: { fontSize: 15, fontWeight: '600', color: COLORS.gray800, marginBottom: SPACING.md },
  modalSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  modalSummaryLabel: { fontSize: 14, color: COLORS.gray600 },
  modalSummaryValue: { fontSize: 14, fontWeight: '500', color: COLORS.gray800 },
  modalSummaryValueBold: { fontSize: 16, fontWeight: '700', color: COLORS.gray800 },

  // Success Modal
  successModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  successModalContent: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xxl, padding: SPACING.xl, width: '100%', maxWidth: 400 },
  successModalIcon: { alignItems: 'center', marginBottom: SPACING.lg },
  successIconBg: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  successIconBgGreen: { backgroundColor: COLORS.successBg },
  successIconBgPrimary: { backgroundColor: COLORS.primaryBg },
  successModalTitle: { fontSize: 24, fontWeight: '700', color: COLORS.gray800, textAlign: 'center', marginBottom: SPACING.sm },
  successModalMessage: { fontSize: 14, color: COLORS.gray600, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 20 },
  successModalSummary: { backgroundColor: COLORS.gray50, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl },
  successSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  successSummaryLabel: { fontSize: 14, color: COLORS.gray600 },
  successSummaryValue: { fontSize: 14, fontWeight: '500', color: COLORS.gray800 },
  successSummaryValueBold: { fontSize: 16, fontWeight: '700', color: COLORS.gray800 },
  successModalButtons: { gap: SPACING.md },
  buttonSpacer: { height: SPACING.sm },
  // 👇 AGREGAR AQUÍ, antes del cierre });
  selectTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  placeholderText: {
    color: COLORS.gray400,
  },
  iosPickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  iosPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iosPickerContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: SPACING.xxxl,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  iosPickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  iosPickerWheel: {
    width: '100%',
  },
  prefixText: {
    fontSize: 16,
    color: COLORS.gray500,
  },
});