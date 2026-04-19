// App.tsx - Versión React Native completa
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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Interfaces
interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
}

interface Amortization {
  id: number;
  name: string;
  code: string;
}

interface PaymentMode {
  id: number;
  name: string;
  code: string;
}

interface AmortizationDetail {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remaining: number;
  status?: string;
  payment_date?: string;
}

interface CashBox {
  id: number;
  name: string;
}

interface PaymentMethod {
  id: number;
  name: string;
}

interface LoanType {
  id: number;
  name: string;
}

interface GuaranteeType {
  id: number;
  name: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH > 768;

// Datos mockeados
const MOCK_CUSTOMERS: Customer[] = [
  { id: 1, first_name: 'Juan', last_name: 'Pérez', phone: '809-555-1234', email: 'juan@email.com' },
  { id: 2, first_name: 'María', last_name: 'González', phone: '809-555-5678', email: 'maria@email.com' },
  { id: 3, first_name: 'Carlos', last_name: 'Rodríguez', phone: '809-555-9012', email: 'carlos@email.com' },
  { id: 4, first_name: 'Ana', last_name: 'Martínez', phone: '809-555-3456', email: 'ana@email.com' },
];

const MOCK_AMORTIZATIONS: Amortization[] = [
  { id: 1, name: 'Francés (Cuota Fija)', code: 'AMRT001' },
  { id: 2, name: 'Alemán (Capital Fijo)', code: 'AMRT002' },
  { id: 3, name: 'Americano', code: 'AMRT003' },
  { id: 4, name: 'Flat (Solo Interés)', code: 'AMRT004' },
];

const MOCK_PAYMENT_MODES: PaymentMode[] = [
  { id: 1, name: 'Mensual', code: 'monthly' },
  { id: 2, name: 'Quincenal', code: 'fortnightly' },
  { id: 3, name: 'Semanal', code: 'weekly' },
  { id: 4, name: 'Diario', code: 'daily' },
];

const MOCK_CASH_BOXES: CashBox[] = [
  { id: 1, name: 'Caja Principal' },
  { id: 2, name: 'Caja Secundaria' },
];

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 1, name: 'Efectivo' },
  { id: 2, name: 'Transferencia' },
  { id: 3, name: 'Cheque' },
];

const MOCK_LOAN_TYPES: LoanType[] = [
  { id: 1, name: 'Personal' },
  { id: 2, name: 'Hipotecario' },
  { id: 3, name: 'Vehículo' },
  { id: 4, name: 'Microcrédito' },
];

const MOCK_GUARANTEE_TYPES: GuaranteeType[] = [
  { id: 1, name: 'Prendaria' },
  { id: 2, name: 'Hipotecaria' },
  { id: 3, name: 'Personal' },
  { id: 4, name: 'Aval' },
];

// Componentes estilizados
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <View className={`bg-white rounded-2xl shadow-lg border border-gray-100 ${className}`}>
    {children}
  </View>
);

const GradientButton = ({ 
  onPress, 
  children, 
  loading = false,
  variant = 'primary',
  disabled = false 
}: { 
  onPress: () => void; 
  children: React.ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}) => {
  const getGradientColors = () => {
    if (disabled) return ['#9CA3AF', '#6B7280'];
    if (variant === 'primary') return ['#4F46E5', '#7C3AED'];
    if (variant === 'secondary') return ['#6B7280', '#4B5563'];
    return ['transparent', 'transparent'];
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      className={`rounded-xl overflow-hidden ${disabled ? 'opacity-50' : ''}`}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className={`px-6 py-4 ${variant === 'outline' ? 'bg-transparent border-2 border-indigo-600' : ''}`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className={`text-center font-semibold text-base ${variant === 'outline' ? 'text-indigo-600' : 'text-white'}`}>
            {children}
          </Text>
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
}) => (
  <View className="mb-4">
    <View className="flex-row items-center mb-2">
      <Text className="text-gray-700 font-medium text-sm">{label}</Text>
      {required && <Text className="text-red-500 ml-1">*</Text>}
    </View>
    <View className={`flex-row items-center bg-gray-50 rounded-xl border ${error ? 'border-red-500' : 'border-gray-200'} ${!editable ? 'bg-gray-100' : ''}`}>
      {prefix && (
        <View className="pl-4">
          <Text className="text-gray-500 text-base">{prefix}</Text>
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
        className={`flex-1 px-4 py-3 text-gray-800 text-base ${multiline ? 'min-h-[100px]' : ''}`}
        placeholderTextColor="#9CA3AF"
      />
      {suffix && (
        <View className="pr-4">
          <Text className="text-gray-500 text-base">{suffix}</Text>
        </View>
      )}
    </View>
    {error && (
      <Text className="text-red-500 text-xs mt-1">{error}</Text>
    )}
  </View>
);

const SelectField = ({ 
  label, 
  value, 
  onValueChange, 
  items, 
  error,
  required = false 
}: { 
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
  error?: string;
  required?: boolean;
}) => (
  <View className="mb-4">
    <View className="flex-row items-center mb-2">
      <Text className="text-gray-700 font-medium text-sm">{label}</Text>
      {required && <Text className="text-red-500 ml-1">*</Text>}
    </View>
    <View className={`bg-gray-50 rounded-xl border ${error ? 'border-red-500' : 'border-gray-200'}`}>
      <Picker
        selectedValue={value}
        onValueChange={onValueChange}
        style={{ height: 50 }}
      >
        <Picker.Item label={`Seleccione ${label.toLowerCase()}`} value="" />
        {items.map((item) => (
          <Picker.Item key={item.value} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
    {error && (
      <Text className="text-red-500 text-xs mt-1">{error}</Text>
    )}
  </View>
);

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color,
  subtitle 
}: { 
  title: string;
  value: string;
  icon: string;
  color: string;
  subtitle?: string;
}) => (
  <Card className="p-4 flex-1">
    <View className="flex-row items-center justify-between mb-2">
      <View className={`w-10 h-10 rounded-full bg-${color}-100 items-center justify-center`}>
        <Icon name={icon} size={20} color={`#${color === 'indigo' ? '4F46E5' : color === 'blue' ? '3B82F6' : color === 'green' ? '10B981' : color === 'red' ? 'EF4444' : color === 'purple' ? '8B5CF6' : 'F59E0B'}`} />
      </View>
    </View>
    <Text className="text-gray-600 text-xs mb-1">{title}</Text>
    <Text className="text-xl font-bold text-gray-800">{value}</Text>
    {subtitle && (
      <Text className="text-gray-500 text-xs mt-1">{subtitle}</Text>
    )}
  </Card>
);

const AmortizationRow = ({ item }: { item: AmortizationDetail }) => (
  <View className="flex-row items-center py-3 border-b border-gray-100">
    <View className="w-12">
      <Text className="text-gray-600 font-medium">{item.month}</Text>
    </View>
    <View className="w-20">
      <Text className="text-gray-600 text-sm">{item.payment_date || '-'}</Text>
    </View>
    <View className="flex-1">
      <Text className="text-gray-800 font-medium text-right">${item.payment.toFixed(2)}</Text>
    </View>
    <View className="w-20">
      <Text className="text-gray-600 text-right">${item.principal.toFixed(2)}</Text>
    </View>
    <View className="w-20">
      <Text className="text-gray-600 text-right">${item.interest.toFixed(2)}</Text>
    </View>
    <View className="w-24">
      <Text className="text-gray-800 font-medium text-right">${item.remaining.toFixed(2)}</Text>
    </View>
  </View>
);

// Componente principal
export default function LoanCreateScreen() {
  // Estados
  const [activeTab, setActiveTab] = useState('loan');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [calculationMode, setCalculationMode] = useState<'standard' | 'fixedPayment' | 'profitPercentage'>('profitPercentage');
  
  // Datos del formulario
  const [formData, setFormData] = useState({
    customer: '',
    loan_type: '1',
    amortization: '1',
    modality: '1',
    loanAmount: '10000',
    installments: '12',
    interest: '12',
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
    guarantee_notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [amortizationDetails, setAmortizationDetails] = useState<AmortizationDetail[]>([]);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [showAmortizationModal, setShowAmortizationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Datos mockeados
  const customers = MOCK_CUSTOMERS;
  const amortizations = MOCK_AMORTIZATIONS;
  const paymentModes = MOCK_PAYMENT_MODES;
  const cashBoxes = MOCK_CASH_BOXES;
  const paymentMethods = MOCK_PAYMENT_METHODS;
  const loanTypes = MOCK_LOAN_TYPES;
  const guaranteeTypes = MOCK_GUARANTEE_TYPES;

  // Efectos
  useEffect(() => {
    if (formData.customer) {
      const customer = customers.find(c => c.id.toString() === formData.customer);
      setSelectedCustomer(customer || null);
    }
  }, [formData.customer]);

  useEffect(() => {
    calculateAmortization();
  }, [
    formData.loanAmount,
    formData.interest,
    formData.installments,
    formData.amortization,
    formData.modality,
    formData.firstPaymentDate,
    formData.profitPercentage,
    calculationMode
  ]);

  // Funciones de cálculo
  const findMonthlyRate = (principal: number, totalProfit: number, periods: number) => {
    const totalPaymentAmount = principal + totalProfit;
    const targetPayment = totalPaymentAmount / periods;
    let rate = (totalProfit / principal / periods) * 2;
    const precision = 1e-8;
    const maxIterations = 100;
    let iteration = 0;
    let error = 10;

    while (error > precision && iteration < maxIterations) {
      const numerator = principal * rate * Math.pow(1 + rate, periods);
      const denominator = Math.pow(1 + rate, periods) - 1;
      const f = numerator / denominator - targetPayment;

      const dfNumerator = principal * Math.pow(1 + rate, periods - 1) *
                        (Math.pow(1 + rate, periods + 1) - (1 + rate + periods * rate));
      const dfDenominator = Math.pow(Math.pow(1 + rate, periods) - 1, 2);
      const df = dfNumerator / dfDenominator;

      const newRate = rate - f / df;
      error = Math.abs(newRate - rate);
      rate = newRate;
      iteration++;
    }

    return rate;
  };

  const calculateInterestFromProfit = (profitPercentage: string) => {
    if (!profitPercentage || isNaN(parseFloat(profitPercentage))) return;

    const amount = parseFloat(formData.loanAmount) || 0;
    const totalInstallments = parseFloat(formData.installments) || 0;
    const profit = amount * (parseFloat(profitPercentage) / 100);

    const monthlyRate = findMonthlyRate(amount, profit, totalInstallments);
    const annualRate = monthlyRate * 12 * 100;

    setFormData(prev => ({ ...prev, interest: annualRate.toFixed(2) }));
  };

  const calculateAmortization = () => {
    const amount = parseFloat(formData.loanAmount) || 0;
    const interestRate = parseFloat(formData.interest) || 0;
    const installments = parseInt(formData.installments) || 0;
    
    if (amount <= 0 || installments <= 0) {
      setAmortizationDetails([]);
      return;
    }

    let payment = 0;
    let balance = amount;
    let totalInterestPaid = 0;
    const table: AmortizationDetail[] = [];

    if (calculationMode === 'profitPercentage') {
      const profitPercentage = parseFloat(formData.profitPercentage) || 0;
      const totalProfit = amount * (profitPercentage / 100);
      totalInterestPaid = totalProfit;
      payment = (amount + totalProfit) / installments;

      const principalPerPayment = amount / installments;
      const interestPerPayment = totalProfit / installments;

      for (let i = 1; i <= installments; i++) {
        let principalPayment = principalPerPayment;
        let interestPayment = interestPerPayment;
        let currentPayment = payment;

        if (i === installments) {
          const totalPrincipalPaid = principalPerPayment * (installments - 1);
          principalPayment = amount - totalPrincipalPaid;
          const totalInterestPaidSoFar = interestPerPayment * (installments - 1);
          interestPayment = totalProfit - totalInterestPaidSoFar;
          currentPayment = principalPayment + interestPayment;
        }

        balance -= principalPayment;
        balance = Math.max(0, balance);

        const paymentDate = new Date(formData.firstPaymentDate);
        paymentDate.setMonth(paymentDate.getMonth() + i - 1);

        table.push({
          month: i,
          payment: currentPayment,
          principal: principalPayment,
          interest: interestPayment,
          remaining: balance,
          status: 'Pendiente',
          payment_date: paymentDate.toISOString().split('T')[0]
        });
      }
    } else {
      const monthlyRate = interestRate / 100 / 12;
      
      if (monthlyRate === 0) {
        payment = amount / installments;
      } else {
        payment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));
      }

      for (let i = 1; i <= installments; i++) {
        const interestPayment = balance * monthlyRate;
        let principalPayment = payment - interestPayment;
        
        if (i === installments) {
          principalPayment = balance;
        }
        
        balance -= principalPayment;
        balance = Math.max(0, balance);
        totalInterestPaid += interestPayment;

        const paymentDate = new Date(formData.firstPaymentDate);
        paymentDate.setMonth(paymentDate.getMonth() + i - 1);

        table.push({
          month: i,
          payment: payment,
          principal: principalPayment,
          interest: interestPayment,
          remaining: balance,
          status: 'Pendiente',
          payment_date: paymentDate.toISOString().split('T')[0]
        });
      }
    }

    setAmortizationDetails(table);
    setMonthlyPayment(payment);
    setTotalInterest(totalInterestPaid);
    setTotalPayment(amount + totalInterestPaid);
  };

  // Validación
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer) newErrors.customer = 'Seleccione un cliente';
    if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) {
      newErrors.loanAmount = 'Monto inválido';
    }
    if (!formData.installments || parseInt(formData.installments) <= 0) {
      newErrors.installments = 'Número de cuotas inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }

    setLoading(true);
    
    // Simular envío
    setTimeout(() => {
      setLoading(false);
      setShowSuccessModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simular recarga
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Datos para el gráfico
  const chartData = useMemo(() => {
    if (amortizationDetails.length === 0) return { labels: [], datasets: [{ data: [] }] };
    
    const labels = amortizationDetails.slice(0, 12).map(d => d.month.toString());
    const principalData = amortizationDetails.slice(0, 12).map(d => d.principal);
    const interestData = amortizationDetails.slice(0, 12).map(d => d.interest);

    return {
      labels,
      datasets: [
        {
          data: principalData,
          color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
          strokeWidth: 2
        },
        {
          data: interestData,
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ['Capital', 'Interés']
    };
  }, [amortizationDetails]);

  // Renderizado
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        
        {/* Header */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-5 pt-3 pb-5"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Icon name="hand-coin" size={28} color="white" />
              <View className="ml-3">
                <Text className="text-white text-xl font-bold">Nuevo Préstamo</Text>
                <Text className="text-white text-sm opacity-90">Complete los datos del préstamo</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => {}} className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <Icon name="dots-vertical" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View className="flex-row bg-white mx-4 -mt-4 rounded-xl shadow-lg p-1">
          {[
            { id: 'loan', label: 'Préstamo', icon: 'cash-multiple' },
            { id: 'guarantor', label: 'Codeudor', icon: 'account-group' },
            { id: 'warranty', label: 'Garantía', icon: 'shield-check' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.id);
              }}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${activeTab === tab.id ? 'bg-indigo-100' : ''}`}
            >
              <Icon 
                name={tab.icon} 
                size={18} 
                color={activeTab === tab.id ? '#4F46E5' : '#6B7280'} 
              />
              <Text className={`ml-2 font-medium ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-500'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView 
          className="flex-1 px-4 pt-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {activeTab === 'loan' && (
            <>
              {/* Modo de cálculo */}
              <Card className="p-4 mb-4">
                <Text className="text-gray-800 font-semibold mb-3">Modo de Cálculo</Text>
                <View className="flex-row gap-2">
                  {[
                    { id: 'standard', label: 'Estándar' },
                    { id: 'fixedPayment', label: 'Pago Fijo' },
                    { id: 'profitPercentage', label: 'Por Beneficio' }
                  ].map((mode) => (
                    <TouchableOpacity
                      key={mode.id}
                      onPress={() => setCalculationMode(mode.id as any)}
                      className={`flex-1 py-3 rounded-lg border ${calculationMode === mode.id ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}
                    >
                      <Text className={`text-center font-medium ${calculationMode === mode.id ? 'text-white' : 'text-gray-700'}`}>
                        {mode.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>

              {/* Cliente */}
              <Card className="p-4 mb-4">
                <Text className="text-gray-800 font-semibold mb-3">Información del Cliente</Text>
                <SelectField
                  label="Cliente"
                  value={formData.customer}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customer: value }))}
                  items={customers.map(c => ({ label: `${c.first_name} ${c.last_name}`, value: c.id.toString() }))}
                  error={errors.customer}
                  required
                />

                {selectedCustomer && (
                  <View className="bg-gray-50 rounded-lg p-3 mt-2">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                        <Icon name="account" size={20} color="#4F46E5" />
                      </View>
                      <View className="ml-3">
                        <Text className="font-medium text-gray-800">
                          {selectedCustomer.first_name} {selectedCustomer.last_name}
                        </Text>
                        {selectedCustomer.phone && (
                          <Text className="text-gray-500 text-sm">{selectedCustomer.phone}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                <SelectField
                  label="Tipo de Préstamo"
                  value={formData.loan_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, loan_type: value }))}
                  items={loanTypes.map(t => ({ label: t.name, value: t.id.toString() }))}
                  required
                />
              </Card>

              {/* Parámetros del préstamo */}
              <Card className="p-4 mb-4">
                <Text className="text-gray-800 font-semibold mb-3">Parámetros del Préstamo</Text>

                {calculationMode === 'profitPercentage' && (
                  <>
                    <InputField
                      label="Porcentaje de beneficio deseado"
                      value={formData.profitPercentage}
                      onChangeText={(value) => {
                        setFormData(prev => ({ ...prev, profitPercentage: value }));
                        calculateInterestFromProfit(value);
                      }}
                      placeholder="Ej: 20"
                      keyboardType="numeric"
                      suffix="%"
                      required
                    />
                    <View className="mb-4">
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-500 text-xs">0%</Text>
                        <Text className="text-gray-500 text-xs">100%</Text>
                      </View>
                    </View>
                  </>
                )}

                <InputField
                  label="Monto del préstamo"
                  value={formData.loanAmount}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, loanAmount: value }))}
                  placeholder="Ej: 10000"
                  keyboardType="numeric"
                  prefix="$"
                  error={errors.loanAmount}
                  required
                />

                <InputField
                  label="Plazo (cuotas)"
                  value={formData.installments}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, installments: value }))}
                  placeholder="Ej: 12"
                  keyboardType="numeric"
                  suffix="meses"
                  error={errors.installments}
                  required
                />

                {calculationMode !== 'profitPercentage' && (
                  <InputField
                    label="Tasa de interés anual"
                    value={formData.interest}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, interest: value }))}
                    placeholder="Ej: 12.00"
                    keyboardType="numeric"
                    suffix="%"
                    required
                  />
                )}
              </Card>

              {/* Configuración de pagos */}
              <Card className="p-4 mb-4">
                <Text className="text-gray-800 font-semibold mb-3">Configuración de Pagos</Text>

                <SelectField
                  label="Modalidad de pago"
                  value={formData.modality}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, modality: value }))}
                  items={paymentModes.map(m => ({ label: m.name, value: m.id.toString() }))}
                  required
                />

                <SelectField
                  label="Tipo de amortización"
                  value={formData.amortization}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, amortization: value }))}
                  items={amortizations.map(a => ({ label: a.name, value: a.id.toString() }))}
                  required
                />

                <InputField
                  label="Fecha primer pago"
                  value={formData.firstPaymentDate}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, firstPaymentDate: value }))}
                  placeholder="YYYY-MM-DD"
                  required
                />

                <SelectField
                  label="Caja"
                  value={formData.cash_box}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cash_box: value }))}
                  items={cashBoxes.map(c => ({ label: c.name, value: c.id.toString() }))}
                />

                <SelectField
                  label="Forma de entrega"
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                  items={paymentMethods.map(m => ({ label: m.name, value: m.id.toString() }))}
                />
              </Card>

              {/* Resumen */}
              <Card className="p-4 mb-4">
                <Text className="text-gray-800 font-semibold mb-3">Resumen del Préstamo</Text>
                
                <View className="flex-row flex-wrap gap-2">
                  <StatCard
                    title="Monto del Préstamo"
                    value={formatCurrency(parseFloat(formData.loanAmount) || 0)}
                    icon="cash"
                    color="blue"
                  />
                  <StatCard
                    title="Plazo Total"
                    value={`${formData.installments} cuotas`}
                    icon="calendar-clock"
                    color="purple"
                  />
                </View>

                <View className="flex-row flex-wrap gap-2 mt-2">
                  <StatCard
                    title="Tasa de Interés"
                    value={`${formData.interest}%`}
                    icon="percent"
                    color="green"
                  />
                  {monthlyPayment > 0 && (
                    <StatCard
                      title="Pago por Cuota"
                      value={formatCurrency(monthlyPayment)}
                      icon="credit-card"
                      color="amber"
                    />
                  )}
                </View>

                {totalInterest > 0 && (
                  <View className="flex-row flex-wrap gap-2 mt-2">
                    <StatCard
                      title="Interés Total"
                      value={formatCurrency(totalInterest)}
                      icon="alert-circle"
                      color="red"
                      subtitle={`${((totalInterest / parseFloat(formData.loanAmount)) * 100).toFixed(1)}%`}
                    />
                    <StatCard
                      title="Total a Pagar"
                      value={formatCurrency(totalPayment)}
                      icon="cash-check"
                      color="indigo"
                    />
                  </View>
                )}
              </Card>

              {/* Tabla de Amortización */}
              <Card className="p-4 mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-800 font-semibold">Plan de Amortización</Text>
                  {amortizationDetails.length > 0 && (
                    <TouchableOpacity 
                      onPress={() => setShowAmortizationModal(true)}
                      className="bg-indigo-100 px-3 py-2 rounded-lg"
                    >
                      <Text className="text-indigo-600 font-medium">Ver todo</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {amortizationDetails.length > 0 ? (
                  <>
                    {/* Vista previa */}
                    {amortizationDetails.slice(0, 3).map((item) => (
                      <AmortizationRow key={item.month} item={item} />
                    ))}
                    
                    {amortizationDetails.length > 3 && (
                      <Text className="text-gray-500 text-center mt-3">
                        + {amortizationDetails.length - 3} cuotas más
                      </Text>
                    )}

                    {/* Gráfico */}
                    <View className="mt-4">
                      <Text className="text-gray-700 font-medium mb-2">Evolución de Pagos</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <LineChart
                          data={chartData}
                          width={Math.max(SCREEN_WIDTH - 80, chartData.labels.length * 60)}
                          height={200}
                          chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                            style: {
                              borderRadius: 16,
                            },
                            propsForDots: {
                              r: '4',
                              strokeWidth: '2',
                              stroke: '#4F46E5'
                            }
                          }}
                          bezier
                          style={{
                            marginVertical: 8,
                            borderRadius: 16,
                          }}
                        />
                      </ScrollView>
                    </View>
                  </>
                ) : (
                  <View className="items-center py-8">
                    <Icon name="file-document-outline" size={48} color="#D1D5DB" />
                    <Text className="text-gray-500 mt-2">Complete los datos para generar el plan de pagos</Text>
                  </View>
                )}
              </Card>
            </>
          )}

          {activeTab === 'guarantor' && (
            <Card className="p-4 mb-4">
              <Text className="text-gray-800 font-semibold mb-3">Información del Codeudor</Text>
              
              <InputField
                label="Nombres Completos"
                value={formData.nameCodebtor}
                onChangeText={(value) => setFormData(prev => ({ ...prev, nameCodebtor: value }))}
                placeholder="Nombre completo del codeudor"
              />

              <InputField
                label="Número de Identificación"
                value={formData.coDebtorId}
                onChangeText={(value) => setFormData(prev => ({ ...prev, coDebtorId: value }))}
                placeholder="Cédula o identificación"
              />

              <InputField
                label="Teléfono"
                value={formData.phoneCodebtor}
                onChangeText={(value) => setFormData(prev => ({ ...prev, phoneCodebtor: value }))}
                placeholder="Número de contacto"
                keyboardType="phone-pad"
              />

              <InputField
                label="Dirección"
                value={formData.addressCodebtor}
                onChangeText={(value) => setFormData(prev => ({ ...prev, addressCodebtor: value }))}
                placeholder="Dirección completa"
                multiline
                numberOfLines={3}
              />

              <View className="bg-indigo-50 rounded-lg p-3 mt-4">
                <View className="flex-row items-center">
                  <Icon name="information" size={20} color="#4F46E5" />
                  <Text className="text-indigo-700 text-sm ml-2 flex-1">
                    La información del codeudor es opcional pero recomendada para préstamos de mayor monto.
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {activeTab === 'warranty' && (
            <Card className="p-4 mb-4">
              <Text className="text-gray-800 font-semibold mb-3">Información de Garantía</Text>

              <SelectField
                label="Tipo de Garantía"
                value={formData.guarantee_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, guarantee_type: value }))}
                items={guaranteeTypes.map(g => ({ label: g.name, value: g.id.toString() }))}
              />

              <InputField
                label="Valor de la Garantía"
                value={formData.guarantee_value}
                onChangeText={(value) => setFormData(prev => ({ ...prev, guarantee_value: value }))}
                placeholder="Valor estimado"
                keyboardType="numeric"
                prefix="$"
              />

              <InputField
                label="Descripción de la Garantía"
                value={formData.guarantee_description}
                onChangeText={(value) => setFormData(prev => ({ ...prev, guarantee_description: value }))}
                placeholder="Describa detalladamente la garantía"
                multiline
                numberOfLines={4}
              />

              <InputField
                label="Número de Expediente"
                value={formData.guarantee_file_number}
                onChangeText={(value) => setFormData(prev => ({ ...prev, guarantee_file_number: value }))}
                placeholder="Número de registro"
              />

              <InputField
                label="Notas Adicionales"
                value={formData.guarantee_notes}
                onChangeText={(value) => setFormData(prev => ({ ...prev, guarantee_notes: value }))}
                placeholder="Observaciones sobre la garantía"
                multiline
                numberOfLines={3}
              />

              <View className="bg-amber-50 rounded-lg p-3 mt-4">
                <View className="flex-row items-center">
                  <Icon name="shield-alert" size={20} color="#D97706" />
                  <Text className="text-amber-700 text-sm ml-2 flex-1">
                    Las garantías ayudan a reducir el riesgo del préstamo. Asegúrese de documentar adecuadamente cada garantía.
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Botones de acción */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1">
              <GradientButton
                onPress={() => {}}
                variant="outline"
              >
                Cancelar
              </GradientButton>
            </View>
            <View className="flex-1">
              <GradientButton
                onPress={handleSubmit}
                loading={loading}
                disabled={amortizationDetails.length === 0}
              >
                Registrar Préstamo
              </GradientButton>
            </View>
          </View>
        </ScrollView>

        {/* Modal de Amortización Completa */}
        <Modal
          visible={showAmortizationModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAmortizationModal(false)}
        >
          <BlurView intensity={100} tint="dark" className="flex-1">
            <View className="flex-1 justify-end">
              <View className="bg-white rounded-t-3xl max-h-[80%]">
                <View className="p-4 border-b border-gray-200">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xl font-bold text-gray-800">Plan de Amortización</Text>
                    <TouchableOpacity onPress={() => setShowAmortizationModal(false)}>
                      <Icon name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView className="p-4">
                  <View className="flex-row bg-gray-100 py-3 px-2 rounded-lg mb-2">
                    <Text className="w-12 text-gray-600 font-medium text-xs">#</Text>
                    <Text className="w-20 text-gray-600 font-medium text-xs">Fecha</Text>
                    <Text className="flex-1 text-gray-600 font-medium text-xs text-right">Pago</Text>
                    <Text className="w-20 text-gray-600 font-medium text-xs text-right">Capital</Text>
                    <Text className="w-20 text-gray-600 font-medium text-xs text-right">Interés</Text>
                    <Text className="w-24 text-gray-600 font-medium text-xs text-right">Saldo</Text>
                  </View>
                  
                  {amortizationDetails.map((item) => (
                    <AmortizationRow key={item.month} item={item} />
                  ))}
                </ScrollView>

                <View className="p-4 border-t border-gray-200">
                  <GradientButton onPress={() => setShowAmortizationModal(false)}>
                    Cerrar
                  </GradientButton>
                </View>
              </View>
            </View>
          </BlurView>
        </Modal>

        {/* Modal de Éxito */}
        <Modal
          visible={showSuccessModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <BlurView intensity={100} tint="dark" className="flex-1 items-center justify-center px-4">
            <View className="bg-white rounded-3xl p-6 w-full max-w-md">
              <View className="items-center">
                <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-4">
                  <Icon name="check-circle" size={48} color="#10B981" />
                </View>
                <Text className="text-2xl font-bold text-gray-800 mb-2">¡Préstamo Creado!</Text>
                <Text className="text-gray-600 text-center mb-6">
                  El préstamo ha sido registrado exitosamente. ¿Qué deseas hacer ahora?
                </Text>
                
                <View className="w-full gap-3">
                  <GradientButton onPress={() => {
                    setShowSuccessModal(false);
                    // Navegar a detalles
                  }}>
                    Ver Préstamo
                  </GradientButton>
                  <GradientButton 
                    onPress={() => {
                      setShowSuccessModal(false);
                      // Resetear formulario
                      setFormData({
                        ...formData,
                        loanAmount: '10000',
                        installments: '12',
                        interest: '12',
                      });
                      setAmortizationDetails([]);
                    }}
                    variant="outline"
                  >
                    Crear Otro
                  </GradientButton>
                </View>
              </View>
            </View>
          </BlurView>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}