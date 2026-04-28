// LoansScreen.tsx - Versión actualizada con integración real
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  Dimensions,
  StatusBar,
  Animated as RNAnimated,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeInRight,
  SlideInRight,
  Layout,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useLoans } from '../../hooks/useLoans';
import { Loan } from '../../types';
import { MainTabParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

// ─── Theme (mantener igual) ────────────────────────────────────────
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
};

type LoansScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Loans'>;

interface LoansScreenProps {
  navigation: LoansScreenNavigationProp;
}

type FilterType = 'all' | 'active' | 'pending' | 'overdue' | 'review' | 'paid' | 'cancelled';
type SortType = 'recent' | 'amount_high' | 'amount_low' | 'name';

// ─── StatusPill Component (actualizado para más estados) ──────────
const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, { label: string; fg: string; bg: string }> = {
    active: { label: 'Activo', fg: '#059669', bg: '#ecfdf5' },
    pending: { label: 'Pendiente', fg: '#d97706', bg: '#fffbeb' },
    overdue: { label: 'Vencido', fg: '#dc2626', bg: '#fef2f2' },
    paid: { label: 'Pagado', fg: '#059669', bg: '#ecfdf5' },
    cancelled: { label: 'Cancelado', fg: '#64748b', bg: '#f1f5f9' },
    review: { label: 'En revisión', fg: '#7c3aed', bg: '#f5f3ff' },
  };
  const c = cfg[status] ?? { label: status, fg: '#94a3b8', bg: '#f1f5f9' };
  return (
    <View style={[plS.w, { backgroundColor: c.bg }]}>
      <View style={[plS.d, { backgroundColor: c.fg }]} />
      <Text style={[plS.t, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
};

const plS = StyleSheet.create({
  w: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  d: { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
  t: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
});

// ─── Avatar Component (mantener igual) ──────────────────────────────
const AVATAR_GRADIENTS: [string, string][] = [
  ['#7c3aed', '#4f46e5'],
  ['#8b5cf6', '#06b6d4'],
  ['#f87171', '#f59e0b'],
  ['#059669', '#0891b2'],
  ['#7c3aed', '#059669'],
  ['#a78bfa', '#f59e0b'],
];

const LoanAvatar: React.FC<{ name: string; idx: number }> = ({ name, idx }) => {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??';
  const [c1, c2] = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
  return (
    <View style={{ width: 48, height: 48, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient colors={[c1, c2]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <Text style={{ color: 'white', fontSize: 15, fontWeight: '800' }}>{initials}</Text>
    </View>
  );
};

// ─── FilterChip Component (mantener igual) ──────────────────────────
const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: string;
}> = ({ label, active, onPress, icon }) => (
  <TouchableOpacity
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }}
    style={[fcS.chip, active && fcS.chipActive]}
  >
    {icon && <Ionicons name={icon as any} size={14} color={active ? C.white : C.textMuted} style={{ marginRight: 4 }} />}
    <Text style={[fcS.label, active && fcS.labelActive]}>{label}</Text>
  </TouchableOpacity>
);

const fcS = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 0.5,
    borderColor: C.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: C.primary2,
    borderColor: C.primary2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
  },
  labelActive: {
    color: C.white,
  },
});

// ─── StatCard Component (mantener igual) ────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
  onPress?: () => void;
}> = ({ label, value, icon, color, bgColor, onPress }) => (
  <Pressable
    onPress={() => {
      if (onPress) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }
    }}
    style={({ pressed }) => [
      stS.card,
      pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
    ]}
  >
    <View style={[stS.iconBg, { backgroundColor: bgColor }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={stS.value}>{value}</Text>
    <Text style={stS.label}>{label}</Text>
  </Pressable>
);

const stS = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: C.border,
    alignItems: 'center',
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
});

// ─── SortModal Component (mantener igual) ───────────────────────────
const SortModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  currentSort: SortType;
  onSelect: (sort: SortType) => void;
}> = ({ visible, onClose, currentSort, onSelect }) => {
  const options: { value: SortType; label: string; icon: string }[] = [
    { value: 'recent', label: 'Más recientes', icon: 'time-outline' },
    { value: 'amount_high', label: 'Monto mayor', icon: 'trending-up-outline' },
    { value: 'amount_low', label: 'Monto menor', icon: 'trending-down-outline' },
    { value: 'name', label: 'Cliente A-Z', icon: 'text-outline' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalS.overlay} onPress={onClose}>
        <Animated.View entering={ZoomIn.duration(200)} style={modalS.content}>
          <View style={modalS.header}>
            <Text style={modalS.title}>Ordenar por</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={C.text} />
            </TouchableOpacity>
          </View>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[modalS.option, currentSort === opt.value && modalS.optionActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(opt.value);
                onClose();
              }}
            >
              <View style={modalS.optionLeft}>
                <Ionicons name={opt.icon as any} size={20} color={currentSort === opt.value ? C.primary2 : C.textSub} />
                <Text style={[modalS.optionLabel, currentSort === opt.value && modalS.optionLabelActive]}>
                  {opt.label}
                </Text>
              </View>
              {currentSort === opt.value && (
                <Ionicons name="checkmark-circle" size={20} color={C.primary2} />
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const modalS = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 350,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  optionActive: {
    backgroundColor: C.primary5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textSub,
  },
  optionLabelActive: {
    color: C.primary2,
  },
});

// ─── EnhancedLoanCard actualizado para usar Loan real ──────────────
const EnhancedLoanCard: React.FC<{
  loan: Loan;
  index: number;
  onPress: () => void;
  onDelete?: (id: string) => void;
}> = ({ loan, index, onPress, onDelete }) => {
  const fmt = (v: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(v);

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'active': return C.success;
      case 'pending': return C.warning;
      case 'overdue': return C.danger;
      case 'paid': return C.success;
      case 'cancelled': return C.textMuted;
      default: return C.primary2;
    }
  };

  // Calcular progreso basado en remainingBalance
  const progress = loan.remainingBalance && loan.totalAmount
    ? Math.max(0, Math.min(1, (loan.totalAmount - loan.remainingBalance) / loan.totalAmount))
    : 0;

  const progressColor = getProgressColor(loan.status || 'active');

  return (
    <Animated.View
      entering={SlideInRight.delay(100 + index * 50).springify()}
      layout={Layout.springify()}
    >
      <Pressable
        style={({ pressed }) => [
          cardS.container,
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
        onPress={onPress}
      >
        <View style={cardS.row}>
          <LoanAvatar name={loan.borrowerName || loan.clientId} idx={index} />
          <View style={cardS.info}>
            <Text style={cardS.name} numberOfLines={1}>
              {loan.borrowerName || `Cliente: ${loan.clientId?.slice(0, 8)}`}
            </Text>
            <View style={cardS.meta}>
              <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
              <Text style={cardS.date}>
                {loan.startDate ? new Date(loan.startDate).toLocaleDateString('es-DO') : 'Fecha no disponible'}
              </Text>
              <View style={cardS.dot} />
              <Ionicons name="document-outline" size={12} color={C.textMuted} />
              <Text style={cardS.id}>#{loan.id?.slice(-8)}</Text>
            </View>
          </View>
          <View style={cardS.amountContainer}>
            <Text style={cardS.amount}>{fmt(loan.amount)}</Text>
            <StatusPill status={loan.status || 'active'} />
          </View>
        </View>
        
        {/* Progress bar */}
        <View style={cardS.progressSection}>
          <View style={cardS.progressLabels}>
            <Text style={cardS.progressText}>Progreso de pago</Text>
            <Text style={[cardS.progressPercent, { color: progressColor }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={cardS.progressBg}>
            <View
              style={[
                cardS.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Información adicional */}
        <View style={cardS.additionalInfo}>
          <View style={cardS.infoItem}>
            <Ionicons name="cash-outline" size={12} color={C.textMuted} />
            <Text style={cardS.infoText}>{loan.paymentFrequency || 'N/A'}</Text>
          </View>
          <View style={cardS.infoItem}>
            <Ionicons name="trending-up-outline" size={12} color={C.textMuted} />
            <Text style={cardS.infoText}>{loan.interestRate}%</Text>
          </View>
          <View style={cardS.infoItem}>
            <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
            <Text style={cardS.infoText}>{loan.term} cuotas</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={cardS.actions}>
          <TouchableOpacity
            style={[cardS.actionBtn, { backgroundColor: C.successBg }]}
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Registrar pago', `Registrar pago para préstamo #${loan.id?.slice(-8)}`);
            }}
          >
            <Ionicons name="cash-outline" size={16} color={C.success} />
            <Text style={[cardS.actionText, { color: C.success }]}>Pagar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[cardS.actionBtn, { backgroundColor: C.primary5 }]}
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Recordatorio', `Enviar recordatorio para préstamo #${loan.id?.slice(-8)}`);
            }}
          >
            <Ionicons name="notifications-outline" size={16} color={C.primary2} />
            <Text style={[cardS.actionText, { color: C.primary2 }]}>Recordar</Text>
          </TouchableOpacity>
          {onDelete && (
            <TouchableOpacity
              style={[cardS.actionBtn, { backgroundColor: C.dangerBg }]}
              onPress={(e) => {
                e.stopPropagation();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert(
                  'Eliminar préstamo',
                  '¿Estás seguro de que deseas eliminar este préstamo?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                      text: 'Eliminar', 
                      style: 'destructive',
                      onPress: () => onDelete(loan.id)
                    }
                  ]
                );
              }}
            >
              <Ionicons name="trash-outline" size={16} color={C.danger} />
              <Text style={[cardS.actionText, { color: C.danger }]}>Eliminar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[cardS.actionBtn, { backgroundColor: C.border }]}
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert(
                'Más opciones',
                `Opciones para préstamo #${loan.id?.slice(-8)}`,
                [
                  { text: 'Editar', onPress: () => console.log('Editar') },
                  { text: 'Ver detalles', onPress: () => onPress() },
                  { text: 'Cancelar', style: 'cancel' },
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={C.textSub} />
          </TouchableOpacity>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const cardS = StyleSheet.create({
  container: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: C.border,
    marginHorizontal: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.textMuted,
    marginHorizontal: 4,
  },
  id: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
  },
  progressSection: {
    marginTop: 14,
    marginBottom: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textSub,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBg: {
    height: 6,
    backgroundColor: C.primary4,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  additionalInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    color: C.textSub,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

// ─── Main Component (actualizado para usar useLoans) ────────────────
export const LoansScreen: React.FC<LoansScreenProps> = ({ navigation }) => {
  const { loans, loading, loadLoans, deleteLoan } = useLoans();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortModal, setShowSortModal] = useState(false);
  const scrollY = React.useRef(new RNAnimated.Value(0)).current;

  // Cargar préstamos al montar el componente
  useEffect(() => {
    loadLoans();
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadLoans();
    setRefreshing(false);
  };

  const handleLoanPress = (loan: Loan) => {
    (navigation as any).navigate('LoanDetails', { loanId: loan.id });
  };

  const handleDeleteLoan = async (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await deleteLoan(id);
      Alert.alert('Éxito', 'Préstamo eliminado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el préstamo');
    }
  };

  const handleAddLoan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    (navigation as any).navigate('LoanForm');
  };

  // Filtrar y ordenar préstamos
  const filteredAndSortedLoans = useMemo(() => {
    let filtered = [...loans];

    // Aplicar filtro por estado
    if (activeFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status === activeFilter);
    }

    // Aplicar búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(loan =>
        (loan.borrowerName?.toLowerCase().includes(query)) ||
        loan.id?.toLowerCase().includes(query) ||
        loan.clientId?.toLowerCase().includes(query)
      );
    }

    // Aplicar ordenamiento
    switch (sortType) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case 'amount_high':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount_low':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      case 'name':
        filtered.sort((a, b) => (a.borrowerName || '').localeCompare(b.borrowerName || ''));
        break;
    }

    return filtered;
  }, [loans, activeFilter, sortType, searchQuery]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = loans.length;
    const active = loans.filter(l => l.status === 'active').length;
    const pending = loans.filter(l => l.status === 'pending').length;
    const overdue = loans.filter(l => l.status === 'overdue').length;
    const paid = loans.filter(l => l.status === 'paid').length;
    const totalAmount = loans.reduce((sum, l) => sum + (l.totalAmount || l.amount), 0);
    
    return { total, active, pending, overdue, paid, totalAmount };
  }, [loans]);

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(v);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const renderEmpty = () => (
    <Animated.View entering={FadeInDown.delay(200)} style={emptyS.container}>
      <View style={emptyS.iconBg}>
        <Ionicons name="document-text-outline" size={48} color={C.primary2} />
      </View>
      <Text style={emptyS.title}>No hay préstamos</Text>
      <Text style={emptyS.subtitle}>
        {searchQuery ? 'No se encontraron resultados' : 'Agrega tu primer préstamo'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={emptyS.button} onPress={handleAddLoan}>
          <Text style={emptyS.buttonText}>Crear préstamo</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  if (loading && loans.length === 0) {
    return (
      <View style={loadS.container}>
        <LinearGradient
          colors={[C.primary, '#6d28d9']}
          style={loadS.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Animated.View entering={ZoomIn.duration(400)} style={loadS.content}>
          <View style={loadS.iconBg}>
            <Ionicons name="cash" size={40} color={C.primary2} />
          </View>
          <Text style={loadS.title}>Cargando préstamos...</Text>
          <View style={loadS.progressBg}>
            <Animated.View
              style={[
                loadS.progressFill,
                {
                  width: '60%',
                },
              ]}
            />
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating header on scroll */}
      <RNAnimated.View style={[styles.floatNav, { opacity: headerOpacity }]}>
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={styles.floatContent}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.getParent?.()?.openDrawer()}>
            <Ionicons name="menu-outline" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.floatTitle}>Préstamos</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={handleAddLoan}>
            <Ionicons name="add" size={22} color={C.text} />
          </TouchableOpacity>
        </View>
      </RNAnimated.View>

      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.primary2}
          />
        }
      >
        {/* ── HEADER ───────────────────────────────────── */}
        <LinearGradient
          colors={[C.primary, '#6d28d9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.getParent?.()?.openDrawer()}>
              <Ionicons name="menu-outline" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Préstamos</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={handleAddLoan}>
              <Ionicons name="add" size={22} color="white" />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{fmtCurrency(stats.totalAmount)}</Text>
              <Text style={styles.statLabel}>Cartera</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.active}</Text>
              <Text style={styles.statLabel}>Activos</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ── SEARCH BAR ───────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={C.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por cliente o ID..."
                placeholderTextColor={C.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={C.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* ─── FILTROS ─────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(180).springify()}>
            <View style={styles.filterHeader}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <FilterChip label="Todos" active={activeFilter === 'all'} onPress={() => setActiveFilter('all')} icon="apps-outline" />
                <FilterChip label="Activos" active={activeFilter === 'active'} onPress={() => setActiveFilter('active')} icon="checkmark-circle-outline" />
                <FilterChip label="Pendientes" active={activeFilter === 'pending'} onPress={() => setActiveFilter('pending')} icon="time-outline" />
                <FilterChip label="Vencidos" active={activeFilter === 'overdue'} onPress={() => setActiveFilter('overdue')} icon="alert-circle-outline" />
                <FilterChip label="Pagados" active={activeFilter === 'paid'} onPress={() => setActiveFilter('paid')} icon="checkmark-done-outline" />
              </ScrollView>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSortModal(true);
                }}
              >
                <Ionicons name="swap-vertical" size={18} color={C.primary2} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── STATS CARDS ──────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(210).springify()} style={styles.statsRow}>
            <StatCard
              label="Activos"
              value={stats.active}
              icon="checkmark-circle"
              color={C.success}
              bgColor={C.successBg}
              onPress={() => setActiveFilter('active')}
            />
            <View style={{ width: 8 }} />
            <StatCard
              label="Pendientes"
              value={stats.pending}
              icon="time"
              color={C.warning}
              bgColor={C.warningBg}
              onPress={() => setActiveFilter('pending')}
            />
            <View style={{ width: 8 }} />
            <StatCard
              label="Vencidos"
              value={stats.overdue}
              icon="alert-circle"
              color={C.danger}
              bgColor={C.dangerBg}
              onPress={() => setActiveFilter('overdue')}
            />
          </Animated.View>

          {/* ── RESULTS COUNT ────────────────────────────── */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {filteredAndSortedLoans.length} {filteredAndSortedLoans.length === 1 ? 'préstamo' : 'préstamos'}
            </Text>
            {activeFilter !== 'all' && (
              <TouchableOpacity onPress={() => setActiveFilter('all')}>
                <Text style={styles.clearFilter}>Limpiar filtro</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── LOANS LIST ───────────────────────────────── */}
          {filteredAndSortedLoans.length > 0 ? (
            filteredAndSortedLoans.map((loan, index) => (
              <EnhancedLoanCard
                key={loan.id}
                loan={loan}
                index={index}
                onPress={() => handleLoanPress(loan)}
                onDelete={handleDeleteLoan}
              />
            ))
          ) : (
            renderEmpty()
          )}

          <View style={{ height: 20 }} />
        </View>
      </RNAnimated.ScrollView>

      {/* ── FAB ────────────────────────────────────────── */}
      <Animated.View entering={ZoomIn.delay(300).springify()} style={styles.fab}>
        <TouchableOpacity style={styles.fabButton} onPress={handleAddLoan} activeOpacity={0.9}>
          <LinearGradient colors={[C.primary2, C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGradient}>
            <Ionicons name="add" size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ─── SORT MODAL ────────────────────────────────── */}
      <SortModal visible={showSortModal} onClose={() => setShowSortModal(false)} currentSort={sortType} onSelect={setSortType} />
    </View>
  );
};

// ─── Styles (mantener igual) ───────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  floatNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    height: 100,
    paddingTop: 50,
    overflow: 'hidden',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  floatContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  floatTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
  },
  header: {
    paddingTop: 56,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  body: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
    color: C.text,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  filterScroll: {
    flex: 1,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 0.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textSub,
  },
  clearFilter: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary2,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 100,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const emptyS = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: C.primary5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primary2,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
});

const loadS = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginBottom: 16,
  },
  progressBg: {
    width: 200,
    height: 4,
    backgroundColor: C.primary4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.primary2,
    borderRadius: 2,
  },
});