import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Animated as RNAnimated,
  Dimensions,
  StatusBar,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeInRight,
  SlideInRight,
  ZoomIn,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Svg, { Circle, Line, Text as SvgText, G, Path } from 'react-native-svg';
import { Loan } from '../../types';
import { LoanService } from '../../services/loanService';
import { RootStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

// ─── Theme ────────────────────────────────────────────────────────
const C = {
  primary: '#5b21b6',
  primary2: '#7c3aed',
  primary3: '#a78bfa',
  primary4: '#ddd6fe',
  primary5: '#f5f3ff',
  bg: '#f5f3ff',
  white: '#ffffff',
  text: '#1e1b4b',
  textSub: '#64748b',
  textMuted: '#94a3b8',
  border: 'rgba(0,0,0,0.06)',
  success: '#059669',
  successBg: '#ecfdf5',
  warning: '#d97706',
  warningBg: '#fffbeb',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#0284c7',
  infoBg: '#f0f9ff',
};

type LoanDetailsRouteProp = RouteProp<RootStackParamList, 'LoanDetails'>;
type LoanDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'LoanDetails'>;

interface LoanDetailsScreenProps {
  route: LoanDetailsRouteProp;
  navigation: LoanDetailsNavigationProp;
}

// ─── Tipos Mejorados ───────────────────────────────────────────────
interface Payment {
  id: string;
  date: string;
  amount: number;
  principal: number;
  interest: number;
  lateFee?: number;
  status: 'paid' | 'pending' | 'late' | 'partial';
  paymentMethod: string;
  receipt?: string;
  notes?: string;
  period: number;
}

interface ExtendedLoan extends Loan {
  // Información del cliente
  clientId?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientDocument?: string;
  
  // Detalles del préstamo
  loanType: 'formal' | 'informal' | 'san';
  loanTypeName: string;
  calculationMethod: 'standard' | 'flat' | 'san';
  paymentFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  
  // Codeudor
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorDocument?: string;
  
  // Garantía
  collateralType?: string;
  collateralValue?: number;
  collateralDescription?: string;
  
  // Financiero
  totalPaid: number;
  remainingBalance: number;
  nextPaymentDate?: string;
  nextPaymentAmount?: number;
  daysLate?: number;
  lateFees: number;
  
  // Historial
  payments: Payment[];
  
  // Notas
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Datos Mock Mejorados ──────────────────────────────────────────
const MOCK_LOAN_DETAILS: Record<string, ExtendedLoan> = {
  '1': {
    id: '1',
    borrowerName: 'Juan Rodríguez Méndez',
    amount: 15750.50,
    status: 'active',
    createdAt: '2026-01-15',
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-07-15'),
    interestRate: 12,
    term: 6,
    
    clientId: 'C001',
    clientEmail: 'juan.rodriguez@email.com',
    clientPhone: '809-555-1234',
    clientAddress: 'Calle Principal #123, Santo Domingo',
    clientDocument: '402-1234567-8',
    
    loanType: 'formal',
    loanTypeName: 'Personal',
    calculationMethod: 'standard',
    paymentFrequency: 'monthly',
    
    guarantorName: 'María Pérez',
    guarantorPhone: '809-555-5678',
    
    totalPaid: 5250.00,
    remainingBalance: 10500.50,
    nextPaymentDate: '2026-04-20',
    nextPaymentAmount: 2625.00,
    daysLate: 0,
    lateFees: 0,
    
    payments: [
      { id: 'p1', date: '2026-01-20', amount: 2625.00, principal: 2400.00, interest: 225.00, status: 'paid', paymentMethod: 'Efectivo', period: 1 },
      { id: 'p2', date: '2026-02-20', amount: 2625.00, principal: 2425.00, interest: 200.00, status: 'paid', paymentMethod: 'Transferencia', period: 2 },
      { id: 'p3', date: '2026-03-20', amount: 2625.00, principal: 2450.00, interest: 175.00, status: 'pending', paymentMethod: '', period: 3 },
      { id: 'p4', date: '2026-04-20', amount: 2625.00, principal: 2475.00, interest: 150.00, status: 'pending', paymentMethod: '', period: 4 },
    ],
    
    notes: 'Cliente VIP, buen historial de pagos.',
    createdBy: 'Carlos Méndez',
    updatedAt: '2026-03-15',
  },
  
  '2': {
    id: '2',
    borrowerName: 'María Pérez González',
    amount: 8250.00,
    status: 'pending',
    createdAt: '2026-03-20',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-05-01'),
    interestRate: 20,
    term: 30,
    
    clientId: 'C002',
    clientEmail: 'maria.perez@email.com',
    clientPhone: '829-555-2345',
    clientAddress: 'Av. Lincoln #456, Santo Domingo',
    clientDocument: '402-8765432-1',
    
    loanType: 'san',
    loanTypeName: 'San Tradicional',
    calculationMethod: 'san',
    paymentFrequency: 'daily',
    
    totalPaid: 0,
    remainingBalance: 9900.00,
    nextPaymentDate: '2026-04-01',
    nextPaymentAmount: 330.00,
    daysLate: 0,
    lateFees: 0,
    
    payments: Array.from({ length: 30 }, (_, i) => ({
      id: `p${i + 1}`,
      date: new Date(2026, 3, i + 1).toISOString().split('T')[0],
      amount: 330.00,
      principal: 275.00,
      interest: 55.00,
      status: 'pending' as const,
      paymentMethod: '',
      period: i + 1,
    })),
    
    notes: 'Préstamo San - primer pago mañana.',
    createdBy: 'Carlos Méndez',
  },
  
  '3': {
    id: '3',
    borrowerName: 'Carlos García López',
    amount: 22300.75,
    status: 'overdue',
    createdAt: '2025-11-10',
    startDate: new Date('2025-11-10'),
    endDate: new Date('2026-11-10'),
    interestRate: 15,
    term: 12,
    
    clientId: 'C003',
    clientEmail: 'carlos.garcia@email.com',
    clientPhone: '809-555-3456',
    clientAddress: 'Calle Las Mercedes #789, Santo Domingo',
    clientDocument: 'PA123456',
    
    loanType: 'informal',
    loanTypeName: 'Préstamo Rápido',
    calculationMethod: 'flat',
    paymentFrequency: 'weekly',
    
    totalPaid: 4500.00,
    remainingBalance: 20150.75,
    nextPaymentDate: '2026-03-15',
    nextPaymentAmount: 1858.40,
    daysLate: 35,
    lateFees: 650.00,
    
    payments: [
      { id: 'p1', date: '2025-11-17', amount: 1858.40, principal: 1700.00, interest: 158.40, status: 'paid', paymentMethod: 'Efectivo', period: 1 },
      { id: 'p2', date: '2025-11-24', amount: 1858.40, principal: 1720.00, interest: 138.40, status: 'paid', paymentMethod: 'Efectivo', period: 2 },
      { id: 'p3', date: '2025-12-01', amount: 1858.40, principal: 1080.00, interest: 118.40, status: 'partial', paymentMethod: 'Efectivo', period: 3, notes: 'Pago parcial de RD$1,080' },
      { id: 'p4', date: '2025-12-08', amount: 1858.40, principal: 0, interest: 0, status: 'late', paymentMethod: '', period: 4 },
      { id: 'p5', date: '2025-12-15', amount: 1858.40, principal: 0, interest: 0, status: 'late', paymentMethod: '', period: 5 },
    ],
    
    notes: 'Cliente con retrasos frecuentes. Llamar para acordar plan de pago.',
    createdBy: 'Ana Martínez',
    updatedAt: '2026-02-10',
  },
};

// ─── Componentes ───────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' | 'lg' }> = ({ status, size = 'md' }) => {
  const config: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    active: { label: 'Al día', bg: C.successBg, color: C.success, icon: 'checkmark-circle' },
    pending: { label: 'Pendiente', bg: C.warningBg, color: C.warning, icon: 'time' },
    overdue: { label: 'Vencido', bg: C.dangerBg, color: C.danger, icon: 'alert-circle' },
    review: { label: 'En revisión', bg: C.primary5, color: C.primary2, icon: 'hourglass' },
    completed: { label: 'Completado', bg: '#f1f5f9', color: '#334155', icon: 'checkmark-done' },
  };
  
  const cfg = config[status] || config.pending;
  const sizes = { sm: { py: 4, px: 8, fontSize: 10, iconSize: 12 }, md: { py: 6, px: 12, fontSize: 12, iconSize: 14 }, lg: { py: 8, px: 16, fontSize: 14, iconSize: 16 } };
  const s = sizes[size];
  
  return (
    <View style={[badgeS.container, { backgroundColor: cfg.bg, paddingVertical: s.py, paddingHorizontal: s.px }]}>
      <Ionicons name={cfg.icon as any} size={s.iconSize} color={cfg.color} />
      <Text style={[badgeS.text, { color: cfg.color, fontSize: s.fontSize }]}>{cfg.label}</Text>
    </View>
  );
};

const badgeS = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, gap: 4, alignSelf: 'flex-start' },
  text: { fontWeight: '700' },
});

const InfoRow: React.FC<{ icon: string; label: string; value: string | number; highlight?: boolean }> = ({ icon, label, value, highlight }) => (
  <View style={infoS.row}>
    <View style={infoS.labelContainer}>
      <Ionicons name={icon as any} size={16} color={C.textMuted} />
      <Text style={infoS.label}>{label}</Text>
    </View>
    <Text style={[infoS.value, highlight && infoS.valueHighlight]}>{value}</Text>
  </View>
);

const infoS = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  labelContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 14, color: C.textSub },
  value: { fontSize: 14, fontWeight: '600', color: C.text },
  valueHighlight: { fontSize: 16, fontWeight: '800', color: C.primary2 },
});

const PaymentStatusBadge: React.FC<{ status: Payment['status'] }> = ({ status }) => {
  const config: Record<Payment['status'], { label: string; bg: string; color: string }> = {
    paid: { label: 'Pagado', bg: C.successBg, color: C.success },
    pending: { label: 'Pendiente', bg: C.warningBg, color: C.warning },
    late: { label: 'Atrasado', bg: C.dangerBg, color: C.danger },
    partial: { label: 'Parcial', bg: C.infoBg, color: C.info },
  };
  const cfg = config[status];
  return (
    <View style={[payBadgeS.container, { backgroundColor: cfg.bg }]}>
      <Text style={[payBadgeS.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const payBadgeS = StyleSheet.create({
  container: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  text: { fontSize: 10, fontWeight: '700' },
});

const PaymentItem: React.FC<{ payment: Payment; index: number; isSan?: boolean }> = ({ payment, index, isSan }) => {
  const formatCurrency = (v: number) => `RD$${v.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  
  return (
    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
      <View style={payItemS.container}>
        <View style={payItemS.left}>
          <View style={[payItemS.periodBadge, payment.status === 'paid' && payItemS.periodBadgePaid]}>
            <Text style={[payItemS.periodText, payment.status === 'paid' && payItemS.periodTextPaid]}>
              {isSan ? `Día ${payment.period}` : `Cuota ${payment.period}`}
            </Text>
          </View>
          <View>
            <Text style={payItemS.date}>{new Date(payment.date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}</Text>
            {payment.notes && <Text style={payItemS.notes}>{payment.notes}</Text>}
          </View>
        </View>
        <View style={payItemS.right}>
          <Text style={payItemS.amount}>{formatCurrency(payment.amount)}</Text>
          <PaymentStatusBadge status={payment.status} />
        </View>
      </View>
    </Animated.View>
  );
};

const payItemS = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  periodBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primary5, alignItems: 'center', justifyContent: 'center' },
  periodBadgePaid: { backgroundColor: C.successBg },
  periodText: { fontSize: 12, fontWeight: '700', color: C.primary2 },
  periodTextPaid: { color: C.success },
  date: { fontSize: 13, fontWeight: '600', color: C.text },
  notes: { fontSize: 10, color: C.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 14, fontWeight: '700', color: C.text },
});

const ProgressCircle: React.FC<{ progress: number; size?: number }> = ({ progress, size = 120 }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={C.primary4}
        strokeWidth={10}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={C.primary2}
        strokeWidth={10}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <SvgText
        x={size / 2}
        y={size / 2 - 5}
        textAnchor="middle"
        fontSize={size * 0.18}
        fontWeight="800"
        fill={C.text}
      >
        {Math.round(progress * 100)}%
      </SvgText>
      <SvgText
        x={size / 2}
        y={size / 2 + 15}
        textAnchor="middle"
        fontSize={size * 0.08}
        fill={C.textMuted}
      >
        Pagado
      </SvgText>
    </Svg>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: string; color: string; bgColor: string }> = ({ label, value, icon, color, bgColor }) => (
  <View style={statS.card}>
    <View style={[statS.iconBg, { backgroundColor: bgColor }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={statS.value}>{value}</Text>
    <Text style={statS.label}>{label}</Text>
  </View>
);

const statS = StyleSheet.create({
  card: { flex: 1, backgroundColor: C.white, borderRadius: 16, padding: 12, borderWidth: 0.5, borderColor: C.border, alignItems: 'center' },
  iconBg: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value: { fontSize: 18, fontWeight: '800', color: C.text },
  label: { fontSize: 10, color: C.textMuted, fontWeight: '600', marginTop: 2, textAlign: 'center' },
});

const SectionHeader: React.FC<{ title: string; icon: string; action?: { label: string; onPress: () => void } }> = ({ title, icon, action }) => (
  <View style={sectionS.container}>
    <View style={sectionS.left}>
      <View style={sectionS.iconBg}>
        <Ionicons name={icon as any} size={16} color={C.primary2} />
      </View>
      <Text style={sectionS.title}>{title}</Text>
    </View>
    {action && (
      <TouchableOpacity onPress={action.onPress}>
        <Text style={sectionS.action}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const sectionS = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBg: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.primary5, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '800', color: C.text },
  action: { fontSize: 12, fontWeight: '600', color: C.primary2 },
});

// ─── Componente Principal ──────────────────────────────────────────
export const LoanDetailsScreen: React.FC<LoanDetailsScreenProps> = ({ route, navigation }) => {
  const { loanId } = route.params;
  const [loan, setLoan] = useState<ExtendedLoan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    loadLoanDetails();
    navigation.setOptions({ headerShown: false });
  }, [loanId]);

  const loadLoanDetails = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const loanData = MOCK_LOAN_DETAILS['1'];
      // const loanData = MOCK_LOAN_DETAILS[loanId];
      setLoan(loanData || null);
    } catch (error) {
      console.error('Error loading loan details:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles del préstamo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLoanDetails();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleShare = async () => {
    if (!loan) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Préstamo de ${loan.borrowerName}\nMonto: RD$${loan.amount.toLocaleString()}\nEstado: ${loan.status}\nSaldo pendiente: RD$${loan.remainingBalance.toLocaleString()}`,
        title: `Detalles del préstamo - ${loan.borrowerName}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleRegisterPayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Error', 'Ingrese un monto válido');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('✅ Pago registrado', `Se ha registrado un pago de RD$${parseFloat(paymentAmount).toLocaleString()}`);
    setShowPaymentModal(false);
    setPaymentAmount('');
    setPaymentNotes('');
  };

  const formatCurrency = (v: number) => `RD$${v.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  const formatDate = (d: string | Date) => new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

  const progress = loan ? (loan.totalPaid / (loan.totalPaid + loan.remainingBalance)) : 0;
  const isSan = loan?.loanType === 'san';
  const isInformal = loan?.loanType === 'informal';

  const getStatusColor = () => {
    if (!loan) return C.primary;
    switch (loan.status) {
      case 'active': return C.success;
      case 'pending': return C.warning;
      case 'overdue': return C.danger;
      default: return C.primary;
    }
  };

  const getHeaderColors = (): [string, string] => {
    if (!loan) return [C.primary, '#6d28d9'];
    if (loan.status === 'overdue') return ['#dc2626', '#b91c1c'];
    if (loan.loanType === 'san') return ['#059669', '#047857'];
    if (loan.loanType === 'informal') return ['#ea580c', '#c2410c'];
    return [C.primary, '#6d28d9'];
  };

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 100], outputRange: [0, 1], extrapolate: 'clamp' });

  if (loading) {
    return (
      <View style={loadS.container}>
        <LinearGradient colors={[C.primary, '#6d28d9']} style={loadS.gradient} />
        <Animated.View entering={ZoomIn.duration(400)} style={loadS.content}>
          <View style={loadS.iconBg}>
            <Ionicons name="hourglass-outline" size={40} color={C.primary2} />
          </View>
          <Text style={loadS.title}>Cargando detalles...</Text>
        </Animated.View>
      </View>
    );
  }

  if (!loan) {
    return (
      <View style={loadS.container}>
        <Animated.View entering={ZoomIn.duration(400)} style={loadS.content}>
          <View style={loadS.iconBg}>
            <Ionicons name="alert-circle-outline" size={40} color={C.danger} />
          </View>
          <Text style={loadS.title}>Préstamo no encontrado</Text>
          <TouchableOpacity style={loadS.button} onPress={() => navigation.goBack()}>
            <Text style={loadS.buttonText}>Volver</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating header */}
      <RNAnimated.View style={[styles.floatNav, { opacity: headerOpacity }]}>
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={styles.floatContent}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.floatTitle} numberOfLines={1}>{loan.borrowerName}</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={C.text} />
          </TouchableOpacity>
        </View>
      </RNAnimated.View>

      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary2} />}
      >
        {/* ── HEADER ───────────────────────────────────── */}
        <LinearGradient colors={getHeaderColors()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {isSan ? '🏦 SAN' : isInformal ? '🤝 INFORMAL' : '📋 FORMAL'}
              </Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerContent}>
            <Text style={styles.headerName}>{loan.borrowerName}</Text>
            <View style={styles.headerMeta}>
              <StatusBadge status={loan.status} size="lg" />
              <Text style={styles.headerId}>#{loan.id}</Text>
            </View>
            <Text style={styles.headerAmount}>{formatCurrency(loan.amount)}</Text>
          </Animated.View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ── PROGRESO ────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Card style={styles.progressCard}>
              <View style={styles.progressRow}>
                <ProgressCircle progress={progress} size={100} />
                <View style={styles.progressStats}>
                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatLabel}>Pagado</Text>
                    <Text style={[styles.progressStatValue, { color: C.success }]}>{formatCurrency(loan.totalPaid)}</Text>
                  </View>
                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatLabel}>Pendiente</Text>
                    <Text style={[styles.progressStatValue, { color: loan.status === 'overdue' ? C.danger : C.warning }]}>
                      {formatCurrency(loan.remainingBalance)}
                    </Text>
                  </View>
                  {loan.daysLate > 0 && (
                    <View style={styles.progressStat}>
                      <Text style={styles.progressStatLabel}>Días de atraso</Text>
                      <Text style={[styles.progressStatValue, { color: C.danger }]}>{loan.daysLate} días</Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          </Animated.View>

          {/* ── PRÓXIMO PAGO ────────────────────────────── */}
          {loan.nextPaymentDate && (
            <Animated.View entering={FadeInDown.delay(180).springify()}>
              <Card style={styles.nextPaymentCard}>
                <View style={styles.nextPaymentHeader}>
                  <Ionicons name="calendar" size={20} color={C.primary2} />
                  <Text style={styles.nextPaymentTitle}>Próximo pago</Text>
                </View>
                <View style={styles.nextPaymentContent}>
                  <View>
                    <Text style={styles.nextPaymentDate}>{formatDate(loan.nextPaymentDate)}</Text>
                    <Text style={styles.nextPaymentLabel}>{isSan ? 'Pago diario' : 'Cuota mensual'}</Text>
                  </View>
                  <Text style={styles.nextPaymentAmount}>{formatCurrency(loan.nextPaymentAmount || 0)}</Text>
                </View>
                {loan.daysLate > 0 && (
                  <View style={styles.lateFeeWarning}>
                    <Ionicons name="warning" size={16} color={C.danger} />
                    <Text style={styles.lateFeeText}>Mora acumulada: {formatCurrency(loan.lateFees)}</Text>
                  </View>
                )}
              </Card>
            </Animated.View>
          )}

          {/* ── ESTADÍSTICAS ────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(210).springify()}>
            <View style={styles.statsRow}>
              <StatCard label="Tasa de interés" value={`${loan.interestRate}%`} icon="trending-up" color={C.primary2} bgColor={C.primary5} />
              <View style={{ width: 8 }} />
              <StatCard label={isSan ? 'Plazo (días)' : 'Plazo'} value={loan.term.toString()} icon="calendar" color={C.info} bgColor={C.infoBg} />
              <View style={{ width: 8 }} />
              <StatCard label="Frecuencia" value={loan.paymentFrequency === 'daily' ? 'Diario' : loan.paymentFrequency === 'weekly' ? 'Semanal' : 'Mensual'} icon="repeat" color={C.warning} bgColor={C.warningBg} />
            </View>
          </Animated.View>

          {/* ── INFORMACIÓN DEL CLIENTE ─────────────────── */}
          <SectionHeader title="Información del Cliente" icon="person-outline" />
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <Card>
              <InfoRow icon="mail-outline" label="Email" value={loan.clientEmail || 'No registrado'} />
              <InfoRow icon="call-outline" label="Teléfono" value={loan.clientPhone || 'No registrado'} />
              <InfoRow icon="card-outline" label="Documento" value={loan.clientDocument || 'No registrado'} />
              <InfoRow icon="location-outline" label="Dirección" value={loan.clientAddress || 'No registrada'} />
            </Card>
          </Animated.View>

          {/* ── DETALLES DEL PRÉSTAMO ───────────────────── */}
          <SectionHeader title="Detalles del Préstamo" icon="document-text-outline" />
          <Animated.View entering={FadeInDown.delay(270).springify()}>
            <Card>
              <InfoRow icon="cash-outline" label="Tipo de préstamo" value={loan.loanTypeName} highlight />
              <InfoRow icon="calculator-outline" label="Método de cálculo" value={
                loan.calculationMethod === 'san' ? 'San (Interés sobre capital)' :
                loan.calculationMethod === 'flat' ? 'Interés plano' : 'Francés (Cuota fija)'
              } />
              <InfoRow icon="calendar-outline" label="Fecha de inicio" value={formatDate(loan.startDate)} />
              <InfoRow icon="calendar-outline" label="Fecha de fin" value={formatDate(loan.endDate)} />
              <InfoRow icon="person-outline" label="Creado por" value={loan.createdBy || 'Sistema'} />
              <InfoRow icon="time-outline" label="Creado el" value={formatDate(loan.createdAt)} />
              {loan.updatedAt && <InfoRow icon="create-outline" label="Actualizado" value={formatDate(loan.updatedAt)} />}
            </Card>
          </Animated.View>

          {/* ── CODEUDOR ────────────────────────────────── */}
          {loan.guarantorName && (
            <>
              <SectionHeader title="Codeudor" icon="people-outline" />
              <Animated.View entering={FadeInDown.delay(300).springify()}>
                <Card>
                  <InfoRow icon="person-outline" label="Nombre" value={loan.guarantorName} />
                  <InfoRow icon="call-outline" label="Teléfono" value={loan.guarantorPhone || 'No registrado'} />
                  <InfoRow icon="card-outline" label="Documento" value={loan.guarantorDocument || 'No registrado'} />
                </Card>
              </Animated.View>
            </>
          )}

          {/* ── GARANTÍA ────────────────────────────────── */}
          {loan.collateralType && (
            <>
              <SectionHeader title="Garantía" icon="shield-checkmark-outline" />
              <Animated.View entering={FadeInDown.delay(330).springify()}>
                <Card>
                  <InfoRow icon="pricetag-outline" label="Tipo" value={loan.collateralType} />
                  <InfoRow icon="cash-outline" label="Valor" value={formatCurrency(loan.collateralValue || 0)} highlight />
                  <InfoRow icon="document-text-outline" label="Descripción" value={loan.collateralDescription || 'Sin descripción'} />
                </Card>
              </Animated.View>
            </>
          )}

          {/* ── HISTORIAL DE PAGOS ──────────────────────── */}
          <SectionHeader 
            title={isSan ? "Plan de Pagos Diarios" : "Historial de Pagos"} 
            icon="receipt-outline"
            action={loan.payments.length > 5 ? { label: 'Ver todos', onPress: () => {} } : undefined}
          />
          <Animated.View entering={FadeInDown.delay(360).springify()}>
            <Card>
              {loan.payments.slice(0, 5).map((payment, index) => (
                <PaymentItem key={payment.id} payment={payment} index={index} isSan={isSan} />
              ))}
              {loan.payments.length > 5 && (
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>Ver todos los pagos ({loan.payments.length})</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.primary2} />
                </TouchableOpacity>
              )}
            </Card>
          </Animated.View>

          {/* ── NOTAS ────────────────────────────────────── */}
          {loan.notes && (
            <>
              <SectionHeader title="Notas" icon="create-outline" />
              <Animated.View entering={FadeInDown.delay(390).springify()}>
                <Card>
                  <Text style={styles.notes}>{loan.notes}</Text>
                </Card>
              </Animated.View>
            </>
          )}

          {/* ── BOTONES DE ACCIÓN ───────────────────────── */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('LoanForm' as any, { loanId });
              }}
            >
              <Ionicons name="create-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.paymentButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowPaymentModal(true);
                setPaymentAmount(loan.nextPaymentAmount?.toString() || '');
              }}
            >
              <Ionicons name="cash-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Registrar Pago</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </RNAnimated.ScrollView>

      {/* ─── MODAL DE PAGO ─────────────────────────────── */}
      <Modal visible={showPaymentModal} transparent animationType="fade" onRequestClose={() => setShowPaymentModal(false)}>
        <BlurView intensity={100} tint="dark" style={modalS.overlay}>
          <Animated.View entering={ZoomIn.duration(200)} style={modalS.content}>
            <View style={modalS.header}>
              <Text style={modalS.title}>Registrar Pago</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            <View style={modalS.body}>
              <Text style={modalS.label}>Monto a pagar</Text>
              <View style={modalS.amountInput}>
                <Text style={modalS.currencySymbol}>RD$</Text>
                <TextInput
                  style={modalS.input}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              </View>

              <Text style={[modalS.label, { marginTop: 16 }]}>Notas (opcional)</Text>
              <TextInput
                style={modalS.notesInput}
                value={paymentNotes}
                onChangeText={setPaymentNotes}
                placeholder="Ej: Pago de cuota #3"
                multiline
              />

              {loan.nextPaymentAmount && (
                <View style={modalS.suggestion}>
                  <Ionicons name="information-circle" size={16} color={C.info} />
                  <Text style={modalS.suggestionText}>
                    Cuota sugerida: {formatCurrency(loan.nextPaymentAmount)}
                  </Text>
                </View>
              )}
            </View>

            <View style={modalS.footer}>
              <TouchableOpacity style={modalS.cancelButton} onPress={() => setShowPaymentModal(false)}>
                <Text style={modalS.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalS.confirmButton} onPress={handleRegisterPayment}>
                <Text style={modalS.confirmText}>Confirmar Pago</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </BlurView>
      </Modal>
    </View>
  );
};

// ─── Componente Card ────────────────────────────────────────────────
const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[cardS.container, style]}>{children}</View>
);

const cardS = StyleSheet.create({
  container: { backgroundColor: C.white, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: C.border },
});

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  
  floatNav: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99, height: 100, paddingTop: 50, overflow: 'hidden', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
  floatContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  floatTitle: { fontSize: 17, fontWeight: '800', color: C.text, flex: 1, textAlign: 'center' },
  
  header: { paddingTop: 56, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: 'white', letterSpacing: 0.5 },
  headerContent: { paddingHorizontal: 20 },
  headerName: { fontSize: 26, fontWeight: '900', color: 'white', letterSpacing: -0.5, marginBottom: 8 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  headerId: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  headerAmount: { fontSize: 32, fontWeight: '900', color: 'white', letterSpacing: -1 },
  
  body: { padding: 16 },
  
  progressCard: { marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  progressStats: { flex: 1, gap: 12 },
  progressStat: {},
  progressStatLabel: { fontSize: 12, color: C.textMuted, fontWeight: '500' },
  progressStatValue: { fontSize: 18, fontWeight: '800' },
  
  nextPaymentCard: { marginBottom: 12, backgroundColor: C.primary5, borderColor: C.primary3 },
  nextPaymentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  nextPaymentTitle: { fontSize: 14, fontWeight: '700', color: C.primary2 },
  nextPaymentContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextPaymentDate: { fontSize: 18, fontWeight: '800', color: C.text },
  nextPaymentLabel: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  nextPaymentAmount: { fontSize: 22, fontWeight: '900', color: C.primary2 },
  lateFeeWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.primary3 },
  lateFeeText: { fontSize: 13, fontWeight: '600', color: C.danger },
  
  statsRow: { flexDirection: 'row', marginBottom: 8 },
  
  notes: { fontSize: 14, color: C.textSub, lineHeight: 20 },
  
  viewAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12, paddingTop: 8 },
  viewAllText: { fontSize: 13, fontWeight: '600', color: C.primary2 },
  
  actionsContainer: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionButton: { flex: 1, flexDirection: 'row', paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 8 },
  editButton: { backgroundColor: C.primary2 },
  paymentButton: { backgroundColor: C.success },
  actionButtonText: { fontSize: 15, fontWeight: '700', color: 'white' },
});

const modalS = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { backgroundColor: C.white, borderRadius: 24, padding: 20, width: '100%', maxWidth: 400 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: C.text },
  body: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: C.textSub, marginBottom: 8 },
  amountInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.primary5, borderRadius: 14, paddingHorizontal: 16 },
  currencySymbol: { fontSize: 20, fontWeight: '700', color: C.text, marginRight: 8 },
  input: { flex: 1, fontSize: 24, fontWeight: '700', color: C.text, paddingVertical: 16 },
  notesInput: { backgroundColor: C.primary5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: C.text, minHeight: 80, textAlignVertical: 'top' },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 12, backgroundColor: C.infoBg, borderRadius: 12 },
  suggestionText: { fontSize: 13, color: C.info, fontWeight: '500' },
  footer: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: C.border },
  cancelText: { fontSize: 15, fontWeight: '600', color: C.textSub },
  confirmButton: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: C.success },
  confirmText: { fontSize: 15, fontWeight: '700', color: 'white' },
});

const loadS = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  iconBg: { width: 80, height: 80, borderRadius: 20, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 16 },
  button: { backgroundColor: C.primary2, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { fontSize: 16, fontWeight: '700', color: 'white' },
});