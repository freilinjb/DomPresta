import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  orange: '#f97316',
  orangeBg: '#fff7ed',
};

type LoanRequestsScreenNavigationProp = StackNavigationProp<MainTabParamList, 'LoanRequests'>;

interface LoanRequestsScreenProps {
  navigation: LoanRequestsScreenNavigationProp;
}

// ─── Tipos ─────────────────────────────────────────────────────────
interface LoanRequest {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  amount: number;
  term: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  documents?: { name: string; url: string }[];
  creditScore?: number;
  monthlyIncome?: number;
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected' | 'under_review';
type SortType = 'recent' | 'amount_high' | 'amount_low' | 'priority';

// ─── Datos Mock Mejorados ──────────────────────────────────────────
const MOCK_REQUESTS: LoanRequest[] = [
  {
    id: 'REQ-001',
    clientName: 'Juan Rodríguez Méndez',
    clientPhone: '809-555-1234',
    clientEmail: 'juan.rodriguez@email.com',
    amount: 15750.50,
    term: 6,
    purpose: 'Compra de electrodomésticos',
    status: 'pending',
    priority: 'high',
    createdAt: '2026-04-15',
    creditScore: 720,
    monthlyIncome: 45000,
  },
  {
    id: 'REQ-002',
    clientName: 'María Pérez González',
    clientPhone: '829-555-2345',
    clientEmail: 'maria.perez@email.com',
    amount: 8250.00,
    term: 30,
    purpose: 'Préstamo San - Capital de trabajo',
    status: 'under_review',
    priority: 'medium',
    createdAt: '2026-04-14',
    creditScore: 680,
    monthlyIncome: 35000,
  },
  {
    id: 'REQ-003',
    clientName: 'Carlos García López',
    clientPhone: '809-555-3456',
    amount: 22300.75,
    term: 12,
    purpose: 'Reparación de vehículo',
    status: 'approved',
    priority: 'medium',
    createdAt: '2026-04-10',
    reviewedBy: 'Ana Martínez',
    reviewedAt: '2026-04-12',
    creditScore: 550,
    monthlyIncome: 65000,
  },
  {
    id: 'REQ-004',
    clientName: 'Ana Martínez Ruiz',
    clientPhone: '829-555-4567',
    clientEmail: 'ana.martinez@email.com',
    amount: 12500.00,
    term: 8,
    purpose: 'Gastos médicos',
    status: 'pending',
    priority: 'high',
    createdAt: '2026-04-16',
    creditScore: 800,
    monthlyIncome: 28000,
  },
  {
    id: 'REQ-005',
    clientName: 'Roberto Fernández Marte',
    clientPhone: '809-555-5678',
    amount: 18750.25,
    term: 10,
    purpose: 'Pago de matrícula universitaria',
    status: 'rejected',
    priority: 'low',
    createdAt: '2026-04-05',
    reviewedBy: 'Carlos Méndez',
    reviewedAt: '2026-04-08',
    notes: 'Score crediticio insuficiente',
    creditScore: 520,
    monthlyIncome: 85000,
  },
  {
    id: 'REQ-006',
    clientName: 'Luisa Hernández Díaz',
    clientPhone: '829-555-6789',
    clientEmail: 'luisa.hernandez@email.com',
    amount: 14300.00,
    term: 12,
    purpose: 'Compra de mobiliario',
    status: 'under_review',
    priority: 'medium',
    createdAt: '2026-04-13',
    creditScore: 750,
    monthlyIncome: 42000,
  },
  {
    id: 'REQ-007',
    clientName: 'Pedro Sánchez Vega',
    clientPhone: '809-555-7890',
    amount: 9200.50,
    term: 15,
    purpose: 'Préstamo San Express',
    status: 'pending',
    priority: 'high',
    createdAt: '2026-04-17',
    creditScore: 0,
    monthlyIncome: 31000,
  },
  {
    id: 'REQ-008',
    clientName: 'Sofía Ramírez Castro',
    clientPhone: '829-555-8901',
    clientEmail: 'sofia.ramirez@email.com',
    amount: 31200.00,
    term: 20,
    purpose: 'Inversión en negocio',
    status: 'approved',
    priority: 'high',
    createdAt: '2026-04-01',
    reviewedBy: 'Ana Martínez',
    reviewedAt: '2026-04-03',
    creditScore: 700,
    monthlyIncome: 58000,
  },
  {
    id: 'REQ-009',
    clientName: 'Diego Morales Ruiz',
    clientPhone: '809-555-9012',
    amount: 6850.00,
    term: 3,
    purpose: 'Gastos escolares',
    status: 'pending',
    priority: 'low',
    createdAt: '2026-04-18',
    creditScore: 650,
    monthlyIncome: 38000,
  },
  {
    id: 'REQ-010',
    clientName: 'Carmen Vega Torres',
    clientPhone: '829-555-0123',
    clientEmail: 'carmen.vega@email.com',
    amount: 9800.00,
    term: 4,
    purpose: 'Viaje familiar',
    status: 'under_review',
    priority: 'medium',
    createdAt: '2026-04-11',
    creditScore: 730,
    monthlyIncome: 48000,
  },
];

// ─── AVATAR GRADIENTS ──────────────────────────────────────────────
const AVATAR_GRADIENTS: [string, string][] = [
  ['#7c3aed', '#4f46e5'],
  ['#8b5cf6', '#06b6d4'],
  ['#f87171', '#f59e0b'],
  ['#059669', '#0891b2'],
  ['#7c3aed', '#059669'],
  ['#a78bfa', '#f59e0b'],
  ['#ec4899', '#8b5cf6'],
  ['#14b8a6', '#3b82f6'],
  ['#f97316', '#ef4444'],
  ['#6366f1', '#8b5cf6'],
];

// ─── Componentes ───────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: LoanRequest['status'] }> = ({ status }) => {
  const config: Record<LoanRequest['status'], { label: string; bg: string; color: string; icon: string }> = {
    pending: { label: 'Pendiente', bg: C.warningBg, color: C.warning, icon: 'time-outline' },
    approved: { label: 'Aprobado', bg: C.successBg, color: C.success, icon: 'checkmark-circle-outline' },
    rejected: { label: 'Rechazado', bg: C.dangerBg, color: C.danger, icon: 'close-circle-outline' },
    under_review: { label: 'En revisión', bg: C.primary5, color: C.primary2, icon: 'hourglass-outline' },
  };
  const cfg = config[status];
  return (
    <View style={[badgeS.container, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
      <Text style={[badgeS.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const badgeS = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  text: { fontSize: 10, fontWeight: '700' },
});

const PriorityBadge: React.FC<{ priority: LoanRequest['priority'] }> = ({ priority }) => {
  const config: Record<LoanRequest['priority'], { label: string; color: string; icon: string }> = {
    high: { label: 'Alta', color: C.danger, icon: 'alert-circle' },
    medium: { label: 'Media', color: C.warning, icon: 'alert' },
    low: { label: 'Baja', color: C.success, icon: 'checkmark-circle' },
  };
  const cfg = config[priority];
  return (
    <View style={priorityS.container}>
      <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
      <Text style={[priorityS.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const priorityS = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  text: { fontSize: 9, fontWeight: '600' },
});

const RequestAvatar: React.FC<{ name: string; index: number }> = ({ name, index }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const [c1, c2] = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  return (
    <View style={{ width: 48, height: 48, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient colors={[c1, c2]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <Text style={{ color: 'white', fontSize: 15, fontWeight: '800' }}>{initials}</Text>
    </View>
  );
};

const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: string;
  count?: number;
}> = ({ label, active, onPress, icon, count }) => (
  <TouchableOpacity
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }}
    style={[chipS.chip, active && chipS.chipActive]}
  >
    {icon && <Ionicons name={icon as any} size={14} color={active ? C.white : C.textMuted} style={{ marginRight: 4 }} />}
    <Text style={[chipS.label, active && chipS.labelActive]}>{label}</Text>
    {count !== undefined && (
      <View style={[chipS.countBadge, active && chipS.countBadgeActive]}>
        <Text style={[chipS.countText, active && chipS.countTextActive]}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const chipS = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: C.white, borderWidth: 0.5, borderColor: C.border, marginRight: 8 },
  chipActive: { backgroundColor: C.primary2, borderColor: C.primary2 },
  label: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  labelActive: { color: C.white },
  countBadge: { marginLeft: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: C.primary5 },
  countBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  countText: { fontSize: 10, fontWeight: '700', color: C.primary2 },
  countTextActive: { color: C.white },
});

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
    style={({ pressed }) => [statS.card, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
  >
    <View style={[statS.iconBg, { backgroundColor: bgColor }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={statS.value}>{value}</Text>
    <Text style={statS.label}>{label}</Text>
  </Pressable>
);

const statS = StyleSheet.create({
  card: { flex: 1, backgroundColor: C.white, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: C.border, alignItems: 'center' },
  iconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  label: { fontSize: 10, color: C.textMuted, fontWeight: '600', marginTop: 2 },
});

const RequestCard: React.FC<{
  request: LoanRequest;
  index: number;
  onPress: () => void;
  onApprove: () => void;
  onReject: () => void;
  onReview: () => void;
}> = ({ request, index, onPress, onApprove, onReject, onReview }) => {
  const fmt = (v: number) => `RD$${v.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

  return (
    <Animated.View entering={SlideInRight.delay(100 + index * 50).springify()} layout={Layout.springify()}>
      <Pressable
        style={({ pressed }) => [cardS.container, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <View style={cardS.mainRow}>
          <RequestAvatar name={request.clientName} index={index} />
          <View style={cardS.info}>
            <View style={cardS.nameRow}>
              <Text style={cardS.name} numberOfLines={1}>{request.clientName}</Text>
              <PriorityBadge priority={request.priority} />
            </View>
            <View style={cardS.meta}>
              <Ionicons name="call-outline" size={11} color={C.textMuted} />
              <Text style={cardS.phone}>{request.clientPhone}</Text>
              <View style={cardS.dot} />
              <Ionicons name="calendar-outline" size={11} color={C.textMuted} />
              <Text style={cardS.date}>{new Date(request.createdAt).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}</Text>
            </View>
          </View>
          <View style={cardS.amountContainer}>
            <Text style={cardS.amount}>{fmt(request.amount)}</Text>
            <StatusBadge status={request.status} />
          </View>
        </View>

        <View style={cardS.detailsRow}>
          <View style={cardS.detail}>
            <Ionicons name="calendar" size={12} color={C.textMuted} />
            <Text style={cardS.detailText}>{request.term} meses</Text>
          </View>
          <View style={cardS.detail}>
            <Ionicons name="flag" size={12} color={C.textMuted} />
            <Text style={cardS.detailText} numberOfLines={1}>{request.purpose}</Text>
          </View>
          {request.creditScore && (
            <View style={cardS.detail}>
              <Ionicons name="star" size={12} color={C.warning} />
              <Text style={[cardS.detailText, { color: request.creditScore >= 700 ? C.success : request.creditScore >= 600 ? C.warning : C.danger }]}>
                {request.creditScore}
              </Text>
            </View>
          )}
        </View>

        {request.status === 'pending' && (
          <View style={cardS.actions}>
            <TouchableOpacity style={[cardS.actionBtn, cardS.approveBtn]} onPress={(e) => { e.stopPropagation(); onApprove(); }}>
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={cardS.actionTextWhite}>Aprobar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[cardS.actionBtn, cardS.reviewBtn]} onPress={(e) => { e.stopPropagation(); onReview(); }}>
              <Ionicons name="eye" size={16} color={C.primary2} />
              <Text style={[cardS.actionText, { color: C.primary2 }]}>Revisar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[cardS.actionBtn, cardS.rejectBtn]} onPress={(e) => { e.stopPropagation(); onReject(); }}>
              <Ionicons name="close" size={16} color={C.danger} />
              <Text style={[cardS.actionText, { color: C.danger }]}>Rechazar</Text>
            </TouchableOpacity>
          </View>
        )}

        {request.status === 'under_review' && (
          <View style={cardS.actions}>
            <TouchableOpacity style={[cardS.actionBtn, cardS.approveBtn]} onPress={(e) => { e.stopPropagation(); onApprove(); }}>
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={cardS.actionTextWhite}>Aprobar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[cardS.actionBtn, cardS.rejectBtn]} onPress={(e) => { e.stopPropagation(); onReject(); }}>
              <Ionicons name="close" size={16} color={C.danger} />
              <Text style={[cardS.actionText, { color: C.danger }]}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[cardS.actionBtn, { backgroundColor: C.primary5 }]} onPress={(e) => { e.stopPropagation(); onPress(); }}>
              <Ionicons name="ellipsis-horizontal" size={16} color={C.textSub} />
            </TouchableOpacity>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const cardS = StyleSheet.create({
  container: { backgroundColor: C.white, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: C.border, marginHorizontal: 2 },
  mainRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  phone: { fontSize: 11, color: C.textMuted },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textMuted, marginHorizontal: 2 },
  date: { fontSize: 11, color: C.textMuted },
  amountContainer: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 16, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: C.textSub },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: C.primary5 },
  approveBtn: { backgroundColor: C.success },
  reviewBtn: { backgroundColor: C.primary5 },
  rejectBtn: { backgroundColor: C.dangerBg },
  actionText: { fontSize: 12, fontWeight: '600' },
  actionTextWhite: { fontSize: 12, fontWeight: '600', color: 'white' },
});

const SortModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  currentSort: SortType;
  onSelect: (sort: SortType) => void;
}> = ({ visible, onClose, currentSort, onSelect }) => {
  const options: { value: SortType; label: string; icon: string }[] = [
    { value: 'recent', label: 'Más recientes', icon: 'time-outline' },
    { value: 'amount_high', label: 'Monto mayor', icon: 'trending-down-outline' },
    { value: 'amount_low', label: 'Monto menor', icon: 'trending-up-outline' },
    { value: 'priority', label: 'Prioridad', icon: 'flag-outline' },
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
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(opt.value); onClose(); }}
            >
              <View style={modalS.optionLeft}>
                <Ionicons name={opt.icon as any} size={20} color={currentSort === opt.value ? C.primary2 : C.textSub} />
                <Text style={[modalS.optionLabel, currentSort === opt.value && modalS.optionLabelActive]}>{opt.label}</Text>
              </View>
              {currentSort === opt.value && <Ionicons name="checkmark-circle" size={20} color={C.primary2} />}
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const modalS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { backgroundColor: C.white, borderRadius: 24, padding: 20, width: '100%', maxWidth: 350 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: C.text },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12 },
  optionActive: { backgroundColor: C.primary5 },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionLabel: { fontSize: 15, fontWeight: '600', color: C.textSub },
  optionLabelActive: { color: C.primary2 },
});

const SectionHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
  <View style={sectionS.container}>
    <View style={sectionS.left}>
      <View style={sectionS.iconBg}>
        <Ionicons name={icon as any} size={16} color={C.primary2} />
      </View>
      <Text style={sectionS.title}>{title}</Text>
    </View>
  </View>
);

const sectionS = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 6 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBg: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.primary5, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '800', color: C.text },
});

// ─── Componente Principal ──────────────────────────────────────────
export const LoanRequestsScreen: React.FC<LoanRequestsScreenProps> = ({ navigation }) => {
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortModal, setShowSortModal] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    loadRequests();
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const loadRequests = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRequests(MOCK_REQUESTS);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAddRequest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    (navigation as any).navigate('LoanRequestForm');
  };

  const handleRequestPress = (request: LoanRequest) => {
    Alert.alert('Detalles', `Ver detalles de solicitud ${request.id}`);
  };

  const handleApprove = (request: LoanRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Aprobar', `¿Aprobar solicitud de ${request.clientName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aprobar', onPress: () => Alert.alert('✅ Aprobado', 'La solicitud ha sido aprobada') },
    ]);
  };

  const handleReject = (request: LoanRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Rechazar', `¿Rechazar solicitud de ${request.clientName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rechazar', style: 'destructive', onPress: () => Alert.alert('❌ Rechazado', 'La solicitud ha sido rechazada') },
    ]);
  };

  const handleReview = (request: LoanRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('En revisión', `Solicitud de ${request.clientName} marcada como en revisión`);
  };

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = [...requests];

    if (activeFilter !== 'all') {
      filtered = filtered.filter(r => r.status === activeFilter);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(r =>
        r.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.clientPhone.includes(searchQuery)
      );
    }

    switch (sortType) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'amount_high':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount_low':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
    }

    return filtered;
  }, [requests, activeFilter, sortType, searchQuery]);

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const underReview = requests.filter(r => r.status === 'under_review').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    const totalAmount = requests.reduce((sum, r) => sum + r.amount, 0);
    const highPriority = requests.filter(r => r.priority === 'high' && r.status === 'pending').length;

    return { total, pending, underReview, approved, rejected, totalAmount, highPriority };
  }, [requests]);

  const fmt = (v: number) => `RD$${v.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 60], outputRange: [0, 1], extrapolate: 'clamp' });

  const renderEmpty = () => (
    <Animated.View entering={FadeInDown.delay(200)} style={emptyS.container}>
      <View style={emptyS.iconBg}>
        <Ionicons name="document-text-outline" size={48} color={C.primary2} />
      </View>
      <Text style={emptyS.title}>No hay solicitudes</Text>
      <Text style={emptyS.subtitle}>{searchQuery ? 'No se encontraron resultados' : 'Agrega una nueva solicitud'}</Text>
      {!searchQuery && (
        <TouchableOpacity style={emptyS.button} onPress={handleAddRequest}>
          <Text style={emptyS.buttonText}>Nueva solicitud</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={loadS.container}>
        <LinearGradient colors={[C.primary, '#6d28d9']} style={loadS.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <Animated.View entering={ZoomIn.duration(400)} style={loadS.content}>
          <View style={loadS.iconBg}>
            <Ionicons name="hourglass-outline" size={40} color={C.primary2} />
          </View>
          <Text style={loadS.title}>Cargando solicitudes...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <RNAnimated.View style={[styles.floatNav, { opacity: headerOpacity }]}>
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={styles.floatContent}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.floatTitle}>Solicitudes</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={handleAddRequest}>
            <Ionicons name="add" size={22} color={C.text} />
          </TouchableOpacity>
        </View>
      </RNAnimated.View>

      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary2} />}
      >
        <LinearGradient colors={[C.primary, '#6d28d9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Solicitudes de Préstamos</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={handleAddRequest}>
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
              <Text style={styles.statValue}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.highPriority}</Text>
              <Text style={styles.statLabel}>Alta prioridad</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.body}>
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={C.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre, ID o teléfono..."
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

          <Animated.View entering={FadeInDown.delay(180).springify()}>
            <View style={styles.filterHeader}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <FilterChip label="Todas" active={activeFilter === 'all'} onPress={() => setActiveFilter('all')} icon="apps-outline" count={stats.total} />
                <FilterChip label="Pendientes" active={activeFilter === 'pending'} onPress={() => setActiveFilter('pending')} icon="time-outline" count={stats.pending} />
                <FilterChip label="En revisión" active={activeFilter === 'under_review'} onPress={() => setActiveFilter('under_review')} icon="hourglass-outline" count={stats.underReview} />
                <FilterChip label="Aprobadas" active={activeFilter === 'approved'} onPress={() => setActiveFilter('approved')} icon="checkmark-circle-outline" count={stats.approved} />
                <FilterChip label="Rechazadas" active={activeFilter === 'rejected'} onPress={() => setActiveFilter('rejected')} icon="close-circle-outline" count={stats.rejected} />
              </ScrollView>
              <TouchableOpacity style={styles.sortButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSortModal(true); }}>
                <Ionicons name="swap-vertical" size={18} color={C.primary2} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(210).springify()} style={styles.statsRow}>
            <StatCard label="Pendientes" value={stats.pending} icon="time" color={C.warning} bgColor={C.warningBg} onPress={() => setActiveFilter('pending')} />
            <View style={{ width: 8 }} />
            <StatCard label="En revisión" value={stats.underReview} icon="hourglass" color={C.primary2} bgColor={C.primary5} onPress={() => setActiveFilter('under_review')} />
            <View style={{ width: 8 }} />
            <StatCard label="Monto total" value={fmt(stats.totalAmount)} icon="cash" color={C.info} bgColor={C.infoBg} />
          </Animated.View>

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>{filteredAndSortedRequests.length} {filteredAndSortedRequests.length === 1 ? 'solicitud' : 'solicitudes'}</Text>
            {activeFilter !== 'all' && (
              <TouchableOpacity onPress={() => setActiveFilter('all')}>
                <Text style={styles.clearFilter}>Limpiar filtro</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredAndSortedRequests.length > 0 ? (
            filteredAndSortedRequests.map((request, index) => (
              <RequestCard
                key={request.id}
                request={request}
                index={index}
                onPress={() => handleRequestPress(request)}
                onApprove={() => handleApprove(request)}
                onReject={() => handleReject(request)}
                onReview={() => handleReview(request)}
              />
            ))
          ) : (
            renderEmpty()
          )}

          <View style={{ height: 20 }} />
        </View>
      </RNAnimated.ScrollView>

      <Animated.View entering={ZoomIn.delay(300).springify()} style={styles.fab}>
        <TouchableOpacity style={styles.fabButton} onPress={handleAddRequest} activeOpacity={0.9}>
          <LinearGradient colors={[C.primary2, C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGradient}>
            <Ionicons name="add" size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <SortModal visible={showSortModal} onClose={() => setShowSortModal(false)} currentSort={sortType} onSelect={setSortType} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  floatNav: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99, height: 100, paddingTop: 50, overflow: 'hidden', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
  floatContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  floatTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  header: { paddingTop: 56, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: 'white', letterSpacing: -0.5 },
  headerStats: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  body: { padding: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 14, borderWidth: 0.5, borderColor: C.border },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 12, color: C.text },
  filterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  filterScroll: { flex: 1 },
  sortButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.white, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultsCount: { fontSize: 13, fontWeight: '700', color: C.textSub },
  clearFilter: { fontSize: 12, fontWeight: '600', color: C.primary2 },
  fab: { position: 'absolute', bottom: 24, right: 24, zIndex: 100 },
  fabButton: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', elevation: 6, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
});

const emptyS = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  iconBg: { width: 80, height: 80, borderRadius: 20, backgroundColor: C.primary5, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.textMuted, textAlign: 'center', marginBottom: 24 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primary2, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  buttonText: { fontSize: 14, fontWeight: '700', color: 'white' },
});

const loadS = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  iconBg: { width: 80, height: 80, borderRadius: 20, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: '700', color: C.text },
});