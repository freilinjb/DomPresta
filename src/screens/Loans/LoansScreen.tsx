// LoansScreen.tsx - Adaptada al diseño unificado
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  SlideInRight,
  ZoomIn,
  Layout,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useLoans } from '../../hooks/useLoans';
import { Loan } from '../../types';
import { MainTabParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

// ─── Design Tokens (Unificado con ClientsScreen y LoanRequestsScreen) ──────────
const C = {
  brand: '#1a0533',
  brandMid: '#3d0f7a',
  brandVibrant: '#6d28d9',
  brandLight: '#8b5cf6',
  brandPale: '#ede9fe',
  brandFaint: '#f5f3ff',
  bg: '#f8f7fc',
  surface: '#ffffff',
  surfaceHover: '#faf9ff',
  border: 'rgba(109,40,217,0.08)',
  borderStrong: 'rgba(109,40,217,0.15)',
  text: '#0f0a1e',
  textSec: '#4a4560',
  textMuted: '#9591a8',
  textPlaceholder: '#b5b0c8',
  success: '#059669',
  successMid: '#10b981',
  successBg: '#ecfdf5',
  warning: '#b45309',
  warningMid: '#d97706',
  warningBg: '#fffbeb',
  danger: '#b91c1c',
  dangerMid: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#0369a1',
  infoMid: '#0284c7',
  infoBg: '#f0f9ff',
  review: '#7c3aed',
  reviewBg: '#f5f3ff',
  shadow: 'rgba(109,40,217,0.12)',
};

type LoansScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Loans'>;

interface LoansScreenProps {
  navigation: LoansScreenNavigationProp;
}

type FilterType = 'all' | 'active' | 'pending' | 'overdue' | 'paid' | 'cancelled';
type SortType = 'recent' | 'amount_high' | 'amount_low' | 'name';

// ─── Status Badge (Estilo unificado) ───────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    active: { label: 'Activo', bg: C.successBg, color: C.successMid, dot: '#10b981' },
    pending: { label: 'Pendiente', bg: C.warningBg, color: C.warningMid, dot: '#f59e0b' },
    overdue: { label: 'Vencido', bg: C.dangerBg, color: C.dangerMid, dot: '#ef4444' },
    paid: { label: 'Pagado', bg: C.infoBg, color: C.infoMid, dot: '#0284c7' },
    cancelled: { label: 'Cancelado', bg: C.brandFaint, color: C.textMuted, dot: '#9591a8' },
  };
  const cfg = config[status] ?? { label: status, bg: C.bg, color: C.textMuted, dot: C.textMuted };
  return (
    <View style={[badgeS.pill, { backgroundColor: cfg.bg, borderColor: C.border }]}>
      <View style={[badgeS.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[badgeS.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const badgeS = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 0.1 },
});

// ─── Avatar (Estilo unificado) ─────────────────────────────────────────────────
const AVATAR_PALETTES: [string, string][] = [
  ['#7c3aed', '#4f46e5'], ['#8b5cf6', '#06b6d4'], ['#f87171', '#f59e0b'],
  ['#059669', '#0891b2'], ['#7c3aed', '#059669'], ['#a78bfa', '#f59e0b'],
  ['#ec4899', '#8b5cf6'], ['#14b8a6', '#3b82f6'], ['#f97316', '#ef4444'],
  ['#6366f1', '#8b5cf6'],
];

const Avatar: React.FC<{ name: string; index: number; size?: number }> = ({ name, index, size = 46 }) => {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const [c1, c2] = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
  const radius = size * 0.28;
  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}>
      <LinearGradient colors={[c1, c2]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: size * 0.32, fontWeight: '800' }}>{initials}</Text>
      </View>
    </View>
  );
};

// ─── Filter Chip (Estilo unificado) ────────────────────────────────────────────
const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
  dotColor?: string;
}> = ({ label, active, onPress, count, dotColor }) => (
  <TouchableOpacity
    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
    style={[chipS.chip, active && chipS.chipActive]}
    activeOpacity={0.75}
  >
    {dotColor && !active && <View style={[chipS.dot, { backgroundColor: dotColor }]} />}
    <Text style={[chipS.label, active && chipS.labelActive]}>{label}</Text>
    {count !== undefined && count > 0 && (
      <View style={[chipS.badge, active && chipS.badgeActive]}>
        <Text style={[chipS.badgeText, active && chipS.badgeTextActive]}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const chipS = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, marginRight: 8 },
  chipActive: { backgroundColor: C.brandVibrant, borderColor: C.brandVibrant },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  label: { fontSize: 13, fontWeight: '600', color: C.textSec },
  labelActive: { color: '#fff' },
  badge: { marginLeft: 6, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: C.brandFaint, alignItems: 'center', justifyContent: 'center' },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  badgeText: { fontSize: 10, fontWeight: '800', color: C.brandVibrant },
  badgeTextActive: { color: '#fff' },
});

// ─── Stat Card (Estilo unificado) ──────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
  onPress?: () => void;
}> = ({ label, value, icon, color, bg, onPress }) => (
  <Pressable
    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
    style={({ pressed }) => [statS.pill, pressed && { opacity: 0.82 }]}
  >
    <View style={[statS.iconRing, { backgroundColor: bg }]}>
      <Ionicons name={icon as any} size={18} color={color} />
    </View>
    <View>
      <Text style={[statS.value, { color: C.text }]}>{value}</Text>
      <Text style={statS.label}>{label}</Text>
    </View>
  </Pressable>
);

const statS = StyleSheet.create({
  pill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border },
  iconRing: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 17, fontWeight: '800', letterSpacing: -0.4 },
  label: { fontSize: 10, color: C.textMuted, fontWeight: '600', marginTop: 1 },
});

// ─── Sort Modal (Estilo unificado) ─────────────────────────────────────────────
const SortModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  currentSort: SortType;
  onSelect: (s: SortType) => void;
}> = ({ visible, onClose, currentSort, onSelect }) => {
  const opts: { value: SortType; label: string; icon: string }[] = [
    { value: 'recent', label: 'Más recientes', icon: 'time-outline' },
    { value: 'amount_high', label: 'Mayor monto', icon: 'arrow-up-circle-outline' },
    { value: 'amount_low', label: 'Menor monto', icon: 'arrow-down-circle-outline' },
    { value: 'name', label: 'Cliente A-Z', icon: 'text-outline' },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalS.overlay} onPress={onClose}>
        <Animated.View entering={ZoomIn.duration(180)} style={modalS.sheet}>
          <View style={modalS.handle} />
          <Text style={modalS.title}>Ordenar préstamos</Text>
          {opts.map((o) => {
            const active = currentSort === o.value;
            return (
              <TouchableOpacity
                key={o.value}
                style={[modalS.row, active && modalS.rowActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(o.value); onClose(); }}
                activeOpacity={0.75}
              >
                <View style={[modalS.iconWrap, { backgroundColor: active ? C.brandFaint : '#f5f5f8' }]}>
                  <Ionicons name={o.icon as any} size={20} color={active ? C.brandVibrant : C.textSec} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[modalS.rowLabel, active && { color: C.brandVibrant }]}>{o.label}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={22} color={C.brandVibrant} />}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const modalS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,5,25,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, marginBottom: 4 },
  rowActive: { backgroundColor: C.brandFaint },
  iconWrap: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 1 },
});

// ─── Action Button (Estilo unificado) ──────────────────────────────────────────
const ActionBtn: React.FC<{ icon: string; label: string; color: string; bg: string; onPress: () => void }> = ({ icon, label, color, bg, onPress }) => (
  <TouchableOpacity
    style={[actionS.btn, { backgroundColor: bg }]}
    onPress={(e) => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
    activeOpacity={0.78}
  >
    <Ionicons name={icon as any} size={14} color={color} />
    <Text style={[actionS.text, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const actionS = StyleSheet.create({
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10 },
  text: { fontSize: 11, fontWeight: '700' },
});

// ─── Progress Bar (Estilo unificado) ───────────────────────────────────────────
const ProgressBar: React.FC<{ progress: number; color: string }> = ({ progress, color }) => (
  <View style={progS.track}>
    <View style={[progS.fill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: color }]} />
  </View>
);

const progS = StyleSheet.create({
  track: { flex: 1, height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});

// ─── Loan Card (Estilo unificado) ──────────────────────────────────────────────
const LoanCard: React.FC<{
  loan: Loan;
  index: number;
  onPress: () => void;
  onDelete?: (id: string) => void;
}> = ({ loan, index, onPress, onDelete }) => {
  const fmt = (v: number) => `RD$${v.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  const fullName = loan.borrowerName || `Cliente ${loan.clientId?.slice(0, 8)}`;

  const getProgressColor = () => {
    switch (loan.status) {
      case 'active': return C.successMid;
      case 'pending': return C.warningMid;
      case 'overdue': return C.dangerMid;
      case 'paid': return C.infoMid;
      default: return C.textMuted;
    }
  };

  const progress = loan.remainingBalance && loan.totalAmount
    ? (loan.totalAmount - loan.remainingBalance) / loan.totalAmount
    : 0;

  return (
    <Animated.View entering={SlideInRight.delay(100 + index * 50).springify()} layout={Layout.springify()}>
      <Pressable style={({ pressed }) => [cardS.card, pressed && cardS.cardPressed]} onPress={onPress}>
        <View style={cardS.headerRow}>
          <Avatar name={fullName} index={index} size={46} />
          <View style={cardS.headerMid}>
            <View style={cardS.nameRow}>
              <Text style={cardS.name} numberOfLines={1}>{fullName}</Text>
              <StatusBadge status={loan.status || 'active'} />
            </View>
            <View style={cardS.metaRow}>
              <Ionicons name="calendar-outline" size={11} color={C.textMuted} />
              <Text style={cardS.metaText}>
                {loan.startDate ? new Date(loan.startDate).toLocaleDateString('es-DO') : 'Fecha no disponible'}
              </Text>
              <Text style={cardS.dot}>·</Text>
              <Ionicons name="document-text-outline" size={11} color={C.textMuted} />
              <Text style={cardS.metaText}>#{loan.id?.slice(-8)}</Text>
            </View>
          </View>
          <View style={cardS.amountContainer}>
            <Text style={cardS.amount}>{fmt(loan.amount)}</Text>
          </View>
        </View>

        <View style={cardS.progressSection}>
          <View style={cardS.progressLabels}>
            <Text style={cardS.progressText}>Progreso de pago</Text>
            <Text style={[cardS.progressPercent, { color: getProgressColor() }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <ProgressBar progress={progress} color={getProgressColor()} />
        </View>

        <View style={cardS.detailsRow}>
          <View style={cardS.detailItem}>
            <Text style={cardS.detailKey}>Plazo</Text>
            <Text style={cardS.detailVal}>{loan.term} meses</Text>
          </View>
          <View style={cardS.divider} />
          <View style={cardS.detailItem}>
            <Text style={cardS.detailKey}>Tasa</Text>
            <Text style={cardS.detailVal}>{loan.interestRate}%</Text>
          </View>
          <View style={cardS.divider} />
          <View style={[cardS.detailItem, { flex: 2 }]}>
            <Text style={cardS.detailKey}>Frecuencia</Text>
            <Text style={cardS.detailVal}>{loan.paymentFrequency || 'Mensual'}</Text>
          </View>
        </View>

        <View style={cardS.actions}>
          <ActionBtn icon="cash-outline" label="Pagar" color={C.successMid} bg={C.successBg} onPress={() => Alert.alert('Pagar', `Registrar pago para ${fullName}`)} />
          <ActionBtn icon="notifications-outline" label="Recordar" color={C.brandVibrant} bg={C.brandFaint} onPress={() => Alert.alert('Recordatorio', `Enviar recordatorio a ${fullName}`)} />
          {onDelete && (
            <ActionBtn icon="trash-outline" label="Eliminar" color={C.dangerMid} bg={C.dangerBg} onPress={() => {
              Alert.alert('Eliminar', `¿Eliminar préstamo de ${fullName}?`, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(loan.id) }
              ]);
            }} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const cardS = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 },
  cardPressed: { opacity: 0.87, transform: [{ scale: 0.985 }] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  headerMid: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  dot: { color: C.textMuted, marginHorizontal: 2 },
  amountContainer: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '800', color: C.brandVibrant },
  progressSection: { marginBottom: 12 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 10, color: C.textMuted, fontWeight: '600' },
  progressPercent: { fontSize: 11, fontWeight: '700' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.brandFaint, borderRadius: 12, padding: 10, marginBottom: 12 },
  detailItem: { flex: 1, alignItems: 'center', gap: 2 },
  detailKey: { fontSize: 9, color: C.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  detailVal: { fontSize: 13, fontWeight: '700', color: C.text },
  divider: { width: 1, height: 28, backgroundColor: C.borderStrong },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
});

// ─── Empty State (Estilo unificado) ────────────────────────────────────────────
const EmptyState: React.FC<{ query: string; onAdd: () => void }> = ({ query, onAdd }) => (
  <Animated.View entering={FadeIn.delay(100)} style={emptyS.wrap}>
    <View style={emptyS.circle}>
      <Ionicons name={query ? 'search-outline' : 'cash-outline'} size={44} color={C.brandLight} />
    </View>
    <Text style={emptyS.title}>{query ? 'Sin resultados' : 'Sin préstamos'}</Text>
    <Text style={emptyS.sub}>{query ? `No se encontró "${query}"` : 'Agrega el primer préstamo'}</Text>
    {!query && (
      <TouchableOpacity style={emptyS.btn} onPress={onAdd}>
        <LinearGradient colors={[C.brandVibrant, C.brandMid]} style={emptyS.btnGrad}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={emptyS.btnText}>Nuevo préstamo</Text>
        </LinearGradient>
      </TouchableOpacity>
    )}
  </Animated.View>
);

const emptyS = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  circle: { width: 96, height: 96, borderRadius: 28, backgroundColor: C.brandFaint, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: C.border },
  title: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 6 },
  sub: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  btn: { borderRadius: 14, overflow: 'hidden' },
  btnGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Main Component ────────────────────────────────────────────────────────────
export const LoansScreen: React.FC<LoansScreenProps> = ({ navigation }) => {
  const { loans, loading, loadLoans, deleteLoan } = useLoans();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortModal, setShowSortModal] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    loadLoans();
    navigation.setOptions({ headerShown: false });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadLoans();
    setRefreshing(false);
  };

  const handleAddLoan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    (navigation as any).navigate('LoanForm');
  };

  const handleDeleteLoan = async (id: string) => {
    try {
      await deleteLoan(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Eliminado', 'Préstamo eliminado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el préstamo');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let filtered = [...loans];
    if (activeFilter !== 'all') {
      filtered = filtered.filter(l => l.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.borrowerName?.toLowerCase().includes(q) ||
        l.id?.toLowerCase().includes(q) ||
        l.clientId?.toLowerCase().includes(q)
      );
    }
    switch (sortType) {
      case 'recent': filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()); break;
      case 'amount_high': filtered.sort((a, b) => b.amount - a.amount); break;
      case 'amount_low': filtered.sort((a, b) => a.amount - b.amount); break;
      case 'name': filtered.sort((a, b) => (a.borrowerName || '').localeCompare(b.borrowerName || '')); break;
    }
    return filtered;
  }, [loans, activeFilter, sortType, searchQuery]);

  const stats = useMemo(() => ({
    total: loans.length,
    active: loans.filter(l => l.status === 'active').length,
    pending: loans.filter(l => l.status === 'pending').length,
    overdue: loans.filter(l => l.status === 'overdue').length,
    totalAmount: loans.reduce((sum, l) => sum + (l.totalAmount || l.amount), 0),
  }), [loans]);

  const fmtShort = (v: number): string => {
    if (v >= 1_000_000) return `RD$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `RD$${(v / 1_000).toFixed(1)}K`;
    return `RD$${v.toFixed(0)}`;
  };

  const navOpacity = scrollY.interpolate({ inputRange: [0, 70], outputRange: [0, 1], extrapolate: 'clamp' });

  if (loading && loans.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <LinearGradient colors={[C.brand, C.brandMid, C.brandVibrant]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }} />
        <Animated.View entering={ZoomIn.duration(400)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 76, height: 76, borderRadius: 22, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="cash" size={36} color={C.brandVibrant} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 16 }}>Cargando préstamos…</Text>
          <View style={{ width: 200, height: 4, backgroundColor: C.brandPale, borderRadius: 2, overflow: 'hidden' }}>
            <Animated.View style={{ width: '60%', height: '100%', backgroundColor: C.brandVibrant, borderRadius: 2 }} />
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <RNAnimated.View style={[s.floatNav, { opacity: navOpacity }]} pointerEvents="box-none">
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={s.floatRow}>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.getParent?.()?.openDrawer()}>
            <Ionicons name="menu-outline" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.floatTitle}>Préstamos</Text>
          <TouchableOpacity style={[s.navBtn, { backgroundColor: C.brandFaint }]} onPress={handleAddLoan}>
            <Ionicons name="add" size={20} color={C.brandVibrant} />
          </TouchableOpacity>
        </View>
      </RNAnimated.View>

      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.brandVibrant} colors={[C.brandVibrant]} />}
      >
        <LinearGradient colors={[C.brand, C.brandMid, C.brandVibrant]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
          <View style={s.decCircle1} /><View style={s.decCircle2} />

          <View style={s.headerTop}>
            <TouchableOpacity style={s.navBtnWhite} onPress={() => navigation.getParent?.()?.openDrawer()}>
              <Ionicons name="menu-outline" size={20} color="white" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.headerLabel}>GESTIÓN</Text>
              <Text style={s.headerTitle}>Préstamos</Text>
            </View>
            <TouchableOpacity style={s.navBtnWhite} onPress={handleAddLoan}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.headerStatsRow}>
            <View style={s.hStat}><Text style={s.hStatVal}>{stats.total}</Text><Text style={s.hStatLbl}>Total</Text></View>
            <View style={s.hDivider} />
            <View style={s.hStat}><Text style={s.hStatVal}>{stats.active}</Text><Text style={s.hStatLbl}>Activos</Text></View>
            <View style={s.hDivider} />
            <View style={s.hStat}><Text style={s.hStatVal}>{stats.pending}</Text><Text style={s.hStatLbl}>Pendientes</Text></View>
            <View style={s.hDivider} />
            <View style={s.hStat}><Text style={[s.hStatVal, stats.overdue > 0 && { color: '#fbbf24' }]}>{stats.overdue}</Text><Text style={s.hStatLbl}>Vencidos</Text></View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).springify()} style={s.amountBanner}>
            <Ionicons name="cash-outline" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={s.amountBannerLabel}>Cartera total: </Text>
            <Text style={s.amountBannerVal}>{fmtShort(stats.totalAmount)}</Text>
          </Animated.View>
        </LinearGradient>

        <View style={s.body}>
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <View style={s.searchBox}>
              <Ionicons name="search" size={17} color={C.textMuted} />
              <TextInput
                style={s.searchInput}
                placeholder="Buscar por cliente o ID…"
                placeholderTextColor={C.textPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== '' && <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={17} color={C.textMuted} /></TouchableOpacity>}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <View style={s.filterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
                <FilterChip label="Todos" active={activeFilter === 'all'} onPress={() => setActiveFilter('all')} count={stats.total} />
                <FilterChip label="Activos" active={activeFilter === 'active'} onPress={() => setActiveFilter('active')} count={stats.active} dotColor="#10b981" />
                <FilterChip label="Pendientes" active={activeFilter === 'pending'} onPress={() => setActiveFilter('pending')} count={stats.pending} dotColor="#f59e0b" />
                <FilterChip label="Vencidos" active={activeFilter === 'overdue'} onPress={() => setActiveFilter('overdue')} count={stats.overdue} dotColor="#ef4444" />
                <FilterChip label="Pagados" active={activeFilter === 'paid'} onPress={() => setActiveFilter('paid')} count={loans.filter(l => l.status === 'paid').length} dotColor="#0284c7" />
              </ScrollView>
              <TouchableOpacity
                style={[s.sortBtn, showSortModal && { backgroundColor: C.brandFaint, borderColor: C.brandVibrant }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSortModal(true); }}
              >
                <Ionicons name="swap-vertical" size={18} color={showSortModal ? C.brandVibrant : C.textSec} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).springify()} style={s.pillRow}>
            <StatCard icon="checkmark-circle" label="Activos" value={stats.active} color={C.successMid} bg={C.successBg} onPress={() => setActiveFilter('active')} />
            <View style={{ width: 8 }} />
            <StatCard icon="time" label="Pendientes" value={stats.pending} color={C.warningMid} bg={C.warningBg} onPress={() => setActiveFilter('pending')} />
            <View style={{ width: 8 }} />
            <StatCard icon="alert-circle" label="Vencidos" value={stats.overdue} color={C.dangerMid} bg={C.dangerBg} onPress={() => setActiveFilter('overdue')} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={s.resultsBar}>
            <Text style={s.resultsCount}>
              <Text style={{ color: C.brandVibrant, fontWeight: '800' }}>{filteredAndSorted.length}</Text>
              {' '}{filteredAndSorted.length === 1 ? 'préstamo' : 'préstamos'}
            </Text>
            {(activeFilter !== 'all' || searchQuery) && (
              <TouchableOpacity onPress={() => { setActiveFilter('all'); setSearchQuery(''); }} style={s.clearBtn}>
                <Ionicons name="close" size={12} color={C.brandVibrant} />
                <Text style={s.clearText}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {filteredAndSorted.length > 0 ? (
            filteredAndSorted.map((loan, i) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                index={i}
                onPress={() => (navigation as any).navigate('LoanDetails', { loanId: loan.id })}
                onDelete={handleDeleteLoan}
              />
            ))
          ) : (
            <EmptyState query={searchQuery} onAdd={handleAddLoan} />
          )}

          <View style={{ height: 100 }} />
        </View>
      </RNAnimated.ScrollView>

      <Animated.View entering={ZoomIn.delay(350).springify()} style={s.fab}>
        <TouchableOpacity onPress={handleAddLoan} activeOpacity={0.88} style={s.fabInner}>
          <LinearGradient colors={[C.brandLight, C.brandVibrant, C.brandMid]} style={s.fabGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="add" size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <SortModal visible={showSortModal} onClose={() => setShowSortModal(false)} currentSort={sortType} onSelect={setSortType} />
    </View>
  );
};

// ─── Styles (Unificados) ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  floatNav: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99, height: 94, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  floatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  floatTitle: { fontSize: 15, fontWeight: '800', color: C.text, flex: 1, textAlign: 'center' },
  navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20, overflow: 'hidden' },
  decCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40 },
  decCircle2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 10, left: -30 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  navBtnWhite: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  headerStatsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginBottom: 12 },
  hStat: { flex: 1, alignItems: 'center' },
  hStatVal: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.6 },
  hStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 2 },
  hDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.15)' },
  amountBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  amountBannerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  amountBannerVal: { fontSize: 14, color: '#fff', fontWeight: '800' },
  body: { padding: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 3, marginBottom: 14, borderWidth: 1.5, borderColor: C.border, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 11, color: C.text, fontWeight: '500' },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sortBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  pillRow: { flexDirection: 'row', marginBottom: 14 },
  resultsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultsCount: { fontSize: 13, color: C.textSec, fontWeight: '600' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.brandFaint, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  clearText: { fontSize: 12, color: C.brandVibrant, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 28, right: 20, zIndex: 100, shadowColor: C.brandVibrant, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabInner: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden' },
  fabGrad: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
});