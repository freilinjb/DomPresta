import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  FadeInUp,
  SlideInRight,
  ZoomIn,
  Layout,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Design Tokens ──────────────────────────────────────────────────
const C = {
  // Brand
  brand: '#1a0533',
  brandMid: '#3d0f7a',
  brandVibrant: '#6d28d9',
  brandLight: '#8b5cf6',
  brandPale: '#ede9fe',
  brandFaint: '#f5f3ff',

  // Neutrals
  bg: '#f8f7fc',
  surface: '#ffffff',
  surfaceHover: '#faf9ff',
  border: 'rgba(109,40,217,0.08)',
  borderStrong: 'rgba(109,40,217,0.15)',

  // Text
  text: '#0f0a1e',
  textSec: '#4a4560',
  textMuted: '#9591a8',
  textPlaceholder: '#b5b0c8',

  // Semantic
  success: '#059669',
  successMid: '#10b981',
  successBg: '#ecfdf5',
  successBorder: 'rgba(5,150,105,0.15)',

  warning: '#b45309',
  warningMid: '#d97706',
  warningBg: '#fffbeb',
  warningBorder: 'rgba(180,83,9,0.15)',

  danger: '#b91c1c',
  dangerMid: '#dc2626',
  dangerBg: '#fef2f2',
  dangerBorder: 'rgba(185,28,28,0.15)',

  review: '#0369a1',
  reviewMid: '#0284c7',
  reviewBg: '#f0f9ff',
  reviewBorder: 'rgba(3,105,161,0.15)',

  // Misc
  gold: '#f59e0b',
  shadow: 'rgba(109,40,217,0.12)',
};

type LoanRequestsScreenNavigationProp = StackNavigationProp<MainTabParamList, 'LoanRequests'>;
interface LoanRequestsScreenProps { navigation: LoanRequestsScreenNavigationProp; }

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
  creditScore?: number;
  monthlyIncome?: number;
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected' | 'under_review';
type SortType = 'recent' | 'amount_high' | 'amount_low' | 'priority';

const MOCK_REQUESTS: LoanRequest[] = [
  { id: 'REQ-001', clientName: 'Juan Rodríguez Méndez', clientPhone: '809-555-1234', clientEmail: 'juan.rodriguez@email.com', amount: 15750.50, term: 6, purpose: 'Compra de electrodomésticos', status: 'pending', priority: 'high', createdAt: '2026-04-15', creditScore: 720, monthlyIncome: 45000 },
  { id: 'REQ-002', clientName: 'María Pérez González', clientPhone: '829-555-2345', clientEmail: 'maria.perez@email.com', amount: 8250.00, term: 30, purpose: 'Capital de trabajo', status: 'under_review', priority: 'medium', createdAt: '2026-04-14', creditScore: 680, monthlyIncome: 35000 },
  { id: 'REQ-003', clientName: 'Carlos García López', clientPhone: '809-555-3456', amount: 22300.75, term: 12, purpose: 'Reparación de vehículo', status: 'approved', priority: 'medium', createdAt: '2026-04-10', reviewedBy: 'Ana Martínez', reviewedAt: '2026-04-12', creditScore: 650, monthlyIncome: 65000 },
  { id: 'REQ-004', clientName: 'Ana Martínez Ruiz', clientPhone: '829-555-4567', clientEmail: 'ana.martinez@email.com', amount: 12500.00, term: 8, purpose: 'Gastos médicos', status: 'pending', priority: 'high', createdAt: '2026-04-16', creditScore: 800, monthlyIncome: 28000 },
  { id: 'REQ-005', clientName: 'Roberto Fernández Marte', clientPhone: '809-555-5678', amount: 18750.25, term: 10, purpose: 'Matrícula universitaria', status: 'rejected', priority: 'low', createdAt: '2026-04-05', reviewedBy: 'Carlos Méndez', reviewedAt: '2026-04-08', notes: 'Score crediticio insuficiente', creditScore: 520, monthlyIncome: 85000 },
  { id: 'REQ-006', clientName: 'Luisa Hernández Díaz', clientPhone: '829-555-6789', clientEmail: 'luisa.hernandez@email.com', amount: 14300.00, term: 12, purpose: 'Compra de mobiliario', status: 'under_review', priority: 'medium', createdAt: '2026-04-13', creditScore: 750, monthlyIncome: 42000 },
  { id: 'REQ-007', clientName: 'Pedro Sánchez Vega', clientPhone: '809-555-7890', amount: 9200.50, term: 15, purpose: 'Préstamo Express', status: 'pending', priority: 'high', createdAt: '2026-04-17', creditScore: 0, monthlyIncome: 31000 },
  { id: 'REQ-008', clientName: 'Sofía Ramírez Castro', clientPhone: '829-555-8901', clientEmail: 'sofia.ramirez@email.com', amount: 31200.00, term: 20, purpose: 'Inversión en negocio', status: 'approved', priority: 'high', createdAt: '2026-04-01', reviewedBy: 'Ana Martínez', reviewedAt: '2026-04-03', creditScore: 700, monthlyIncome: 58000 },
  { id: 'REQ-009', clientName: 'Diego Morales Ruiz', clientPhone: '809-555-9012', amount: 6850.00, term: 3, purpose: 'Gastos escolares', status: 'pending', priority: 'low', createdAt: '2026-04-18', creditScore: 650, monthlyIncome: 38000 },
  { id: 'REQ-010', clientName: 'Carmen Vega Torres', clientPhone: '829-555-0123', clientEmail: 'carmen.vega@email.com', amount: 9800.00, term: 4, purpose: 'Viaje familiar', status: 'under_review', priority: 'medium', createdAt: '2026-04-11', creditScore: 730, monthlyIncome: 48000 },
];

const AVATAR_PALETTES: [string, string][] = [
  ['#7c3aed', '#4f46e5'], ['#8b5cf6', '#06b6d4'], ['#f87171', '#f59e0b'],
  ['#059669', '#0891b2'], ['#7c3aed', '#059669'], ['#a78bfa', '#f59e0b'],
  ['#ec4899', '#8b5cf6'], ['#14b8a6', '#3b82f6'], ['#f97316', '#ef4444'],
  ['#6366f1', '#8b5cf6'],
];

const fmt = (v: number) => `RD$${v.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
const fmtShort = (v: number): string => {
  if (v >= 1_000_000) return `RD$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `RD$${(v / 1_000).toFixed(1)}K`;
  return `RD$${v.toFixed(0)}`;
};

// ─── Status config ────────────────────────────────────────────────
const STATUS_CONFIG: Record<LoanRequest['status'], { label: string; bg: string; color: string; border: string; icon: string; dot: string }> = {
  pending:      { label: 'Pendiente',   bg: C.warningBg,  color: C.warning,     border: C.warningBorder,  icon: 'time',                 dot: '#f59e0b' },
  approved:     { label: 'Aprobado',    bg: C.successBg,  color: C.successMid,  border: C.successBorder,  icon: 'checkmark-circle',     dot: '#10b981' },
  rejected:     { label: 'Rechazado',   bg: C.dangerBg,   color: C.dangerMid,   border: C.dangerBorder,   icon: 'close-circle',         dot: '#ef4444' },
  under_review: { label: 'En revisión', bg: C.reviewBg,   color: C.reviewMid,   border: C.reviewBorder,   icon: 'hourglass',            dot: '#0ea5e9' },
};

const PRIORITY_CONFIG: Record<LoanRequest['priority'], { label: string; color: string; bg: string }> = {
  high:   { label: 'Alta',   color: '#b91c1c', bg: '#fef2f2' },
  medium: { label: 'Media',  color: '#b45309', bg: '#fffbeb' },
  low:    { label: 'Baja',   color: '#047857', bg: '#ecfdf5' },
};

const getCreditColor = (score: number) => {
  if (!score) return C.textMuted;
  if (score >= 750) return C.successMid;
  if (score >= 650) return C.warningMid;
  return C.dangerMid;
};

// ─── Avatar ───────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string; index: number; size?: number }> = ({ name, index, size = 46 }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const [c1, c2] = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
  const radius = size * 0.3;
  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}>
      <LinearGradient colors={[c1, c2]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: size * 0.32, fontWeight: '800', letterSpacing: 0.5 }}>{initials}</Text>
      </View>
    </View>
  );
};

// ─── Credit Score Bar ────────────────────────────────────────────
const CreditBar: React.FC<{ score: number }> = ({ score }) => {
  if (!score) return null;
  const pct = Math.min(score / 850, 1);
  const color = getCreditColor(score);
  return (
    <View style={creditBarS.wrapper}>
      <View style={creditBarS.track}>
        <View style={[creditBarS.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[creditBarS.score, { color }]}>{score}</Text>
    </View>
  );
};
const creditBarS = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  track: { flex: 1, height: 4, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  score: { fontSize: 11, fontWeight: '700', minWidth: 28, textAlign: 'right' },
});

// ─── Status Badge ────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: LoanRequest['status']; compact?: boolean }> = ({ status, compact }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[badgeS.pill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <View style={[badgeS.dot, { backgroundColor: cfg.dot }]} />
      {!compact && <Text style={[badgeS.text, { color: cfg.color }]}>{cfg.label}</Text>}
    </View>
  );
};
const badgeS = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.1 },
});

// ─── Priority Tag ─────────────────────────────────────────────────
const PriorityTag: React.FC<{ priority: LoanRequest['priority'] }> = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority];
  if (priority === 'low') return null;
  return (
    <View style={[priorityS.tag, { backgroundColor: cfg.bg }]}>
      <Ionicons name={priority === 'high' ? 'flame' : 'alert'} size={9} color={cfg.color} />
      <Text style={[priorityS.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};
const priorityS = StyleSheet.create({
  tag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' },
});

// ─── Filter Chip ──────────────────────────────────────────────────
const FilterChip: React.FC<{ label: string; active: boolean; onPress: () => void; count?: number; dotColor?: string }> = ({ label, active, onPress, count, dotColor }) => (
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

// ─── Stat Pill ────────────────────────────────────────────────────
const StatPill: React.FC<{ icon: string; value: string | number; label: string; color: string; bg: string; onPress?: () => void }> = ({ icon, value, label, color, bg, onPress }) => (
  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }} style={({ pressed }) => [statS.pill, pressed && { opacity: 0.82 }]}>
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

// ─── Action Button ────────────────────────────────────────────────
const ActionBtn: React.FC<{ icon: string; label: string; color: string; bg: string; onPress: () => void; filled?: boolean }> = ({ icon, label, color, bg, onPress, filled }) => (
  <TouchableOpacity
    onPress={(e) => { (e as any).stopPropagation?.(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
    style={[actionS.btn, { backgroundColor: filled ? color : bg, borderColor: filled ? color : `${color}30` }]}
    activeOpacity={0.78}
  >
    <Ionicons name={icon as any} size={14} color={filled ? '#fff' : color} />
    <Text style={[actionS.label, { color: filled ? '#fff' : color }]}>{label}</Text>
  </TouchableOpacity>
);
const actionS = StyleSheet.create({
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  label: { fontSize: 12, fontWeight: '700' },
});

// ─── Request Card ─────────────────────────────────────────────────
const RequestCard: React.FC<{
  request: LoanRequest;
  index: number;
  onPress: () => void;
  onApprove: () => void;
  onReject: () => void;
  onReview: () => void;
}> = ({ request, index, onPress, onApprove, onReject, onReview }) => {
  const isPending = request.status === 'pending';
  const isReview = request.status === 'under_review';
  const showActions = isPending || isReview;
  const dateStr = new Date(request.createdAt).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' });

  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 45).springify()} layout={Layout.springify()}>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        style={({ pressed }) => [cardS.card, pressed && cardS.cardPressed]}
      >
        {/* Top stripe accent for high priority */}
        {request.priority === 'high' && request.status === 'pending' && (
          <View style={cardS.urgentStripe} />
        )}

        {/* Header row */}
        <View style={cardS.headerRow}>
          <Avatar name={request.clientName} index={index} size={46} />
          <View style={cardS.headerMid}>
            <View style={cardS.nameRow}>
              <Text style={cardS.name} numberOfLines={1}>{request.clientName}</Text>
              <PriorityTag priority={request.priority} />
            </View>
            <View style={cardS.metaRow}>
              <Ionicons name="call-outline" size={11} color={C.textMuted} />
              <Text style={cardS.metaText}>{request.clientPhone}</Text>
              <Text style={cardS.sep}>·</Text>
              <Ionicons name="calendar-outline" size={11} color={C.textMuted} />
              <Text style={cardS.metaText}>{dateStr}</Text>
            </View>
          </View>
          <StatusBadge status={request.status} />
        </View>

        {/* Amount + Purpose row */}
        <View style={cardS.amountBlock}>
          <View>
            <Text style={cardS.amountLabel}>Monto solicitado</Text>
            <Text style={cardS.amount}>{fmt(request.amount)}</Text>
          </View>
          <View style={cardS.purposeChip}>
            <Ionicons name="briefcase-outline" size={12} color={C.brandLight} />
            <Text style={cardS.purposeText} numberOfLines={1}>{request.purpose}</Text>
          </View>
        </View>

        {/* Details row */}
        <View style={cardS.detailsRow}>
          <View style={cardS.detailItem}>
            <Text style={cardS.detailKey}>Plazo</Text>
            <Text style={cardS.detailVal}>{request.term} meses</Text>
          </View>
          <View style={cardS.divider} />
          {request.monthlyIncome ? (
            <View style={cardS.detailItem}>
              <Text style={cardS.detailKey}>Ing. mensual</Text>
              <Text style={cardS.detailVal}>{fmtShort(request.monthlyIncome)}</Text>
            </View>
          ) : null}
          {request.monthlyIncome ? <View style={cardS.divider} /> : null}
          <View style={[cardS.detailItem, { flex: 2 }]}>
            <Text style={cardS.detailKey}>Score crediticio</Text>
            {request.creditScore
              ? <CreditBar score={request.creditScore} />
              : <Text style={[cardS.detailVal, { color: C.textMuted }]}>Sin datos</Text>
            }
          </View>
        </View>

        {/* Reviewed by */}
        {request.reviewedBy && (
          <View style={cardS.reviewedRow}>
            <Ionicons name="person-circle-outline" size={13} color={C.textMuted} />
            <Text style={cardS.reviewedText}>Revisado por <Text style={{ color: C.brandVibrant, fontWeight: '700' }}>{request.reviewedBy}</Text></Text>
            {request.notes && <Text style={cardS.noteText}> · {request.notes}</Text>}
          </View>
        )}

        {/* Action buttons */}
        {showActions && (
          <View style={cardS.actions}>
            <ActionBtn icon="checkmark" label="Aprobar" color={C.successMid} bg={C.successBg} filled onPress={onApprove} />
            {isPending && (
              <ActionBtn icon="eye-outline" label="Revisar" color={C.brandVibrant} bg={C.brandFaint} onPress={onReview} />
            )}
            <ActionBtn icon="close" label="Rechazar" color={C.dangerMid} bg={C.dangerBg} onPress={onReject} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const cardS = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.87, transform: [{ scale: 0.985 }] },
  urgentStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#ef4444', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  headerMid: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  sep: { color: C.textMuted, marginHorizontal: 2, fontSize: 11 },
  amountBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.brandFaint, borderRadius: 12, padding: 12, marginBottom: 12 },
  amountLabel: { fontSize: 10, color: C.textMuted, fontWeight: '600', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  amount: { fontSize: 20, fontWeight: '900', color: C.brandVibrant, letterSpacing: -0.8 },
  purposeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(109,40,217,0.08)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, maxWidth: SCREEN_WIDTH * 0.38 },
  purposeText: { fontSize: 11, color: C.brandMid, fontWeight: '600', flex: 1 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f8fd', borderRadius: 10, padding: 10, marginBottom: 10, gap: 8 },
  detailItem: { flex: 1, gap: 3 },
  detailKey: { fontSize: 9, color: C.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailVal: { fontSize: 13, color: C.text, fontWeight: '700' },
  divider: { width: 1, height: 28, backgroundColor: C.border },
  reviewedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10, paddingTop: 2 },
  reviewedText: { fontSize: 11, color: C.textMuted },
  noteText: { fontSize: 11, color: C.textMuted, fontStyle: 'italic', flex: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 2 },
});

// ─── Sort Modal ───────────────────────────────────────────────────
const SortModal: React.FC<{ visible: boolean; onClose: () => void; currentSort: SortType; onSelect: (s: SortType) => void }> = ({ visible, onClose, currentSort, onSelect }) => {
  const opts: { value: SortType; label: string; sub: string; icon: string }[] = [
    { value: 'recent', label: 'Más recientes', sub: 'Ordenar por fecha', icon: 'time-outline' },
    { value: 'amount_high', label: 'Mayor monto', sub: 'De mayor a menor', icon: 'arrow-up-circle-outline' },
    { value: 'amount_low', label: 'Menor monto', sub: 'De menor a mayor', icon: 'arrow-down-circle-outline' },
    { value: 'priority', label: 'Prioridad', sub: 'Alta primero', icon: 'flag-outline' },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalS.overlay} onPress={onClose}>
        <Animated.View entering={ZoomIn.duration(180)} style={modalS.sheet}>
          <View style={modalS.handle} />
          <Text style={modalS.title}>Ordenar solicitudes</Text>
          {opts.map((o) => {
            const active = currentSort === o.value;
            return (
              <TouchableOpacity key={o.value} style={[modalS.row, active && modalS.rowActive]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(o.value); onClose(); }} activeOpacity={0.75}>
                <View style={[modalS.iconWrap, { backgroundColor: active ? C.brandFaint : '#f5f5f8' }]}>
                  <Ionicons name={o.icon as any} size={20} color={active ? C.brandVibrant : C.textSec} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[modalS.rowLabel, active && { color: C.brandVibrant }]}>{o.label}</Text>
                  <Text style={modalS.rowSub}>{o.sub}</Text>
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
  rowSub: { fontSize: 12, color: C.textMuted },
});

// ─── Empty State ──────────────────────────────────────────────────
const EmptyState: React.FC<{ query: string; onAdd: () => void }> = ({ query, onAdd }) => (
  <Animated.View entering={FadeIn.delay(100)} style={emptyS.wrap}>
    <LinearGradient colors={[C.brandFaint, C.surface]} style={emptyS.circle}>
      <Ionicons name={query ? 'search-outline' : 'document-text-outline'} size={44} color={C.brandLight} />
    </LinearGradient>
    <Text style={emptyS.title}>{query ? 'Sin resultados' : 'Sin solicitudes'}</Text>
    <Text style={emptyS.sub}>{query ? `No se encontró "${query}"` : 'Crea la primera solicitud de préstamo'}</Text>
    {!query && (
      <TouchableOpacity style={emptyS.btn} onPress={onAdd} activeOpacity={0.85}>
        <LinearGradient colors={[C.brandVibrant, C.brandMid]} style={emptyS.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={emptyS.btnText}>Nueva solicitud</Text>
        </LinearGradient>
      </TouchableOpacity>
    )}
  </Animated.View>
);
const emptyS = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  circle: { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: C.border },
  title: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 6 },
  sub: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  btn: { borderRadius: 14, overflow: 'hidden' },
  btnGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Skeleton Loader ──────────────────────────────────────────────
const SkeletonCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const opacity = useRef(new RNAnimated.Value(0.4)).current;
  useEffect(() => {
    const anim = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        RNAnimated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    const t = setTimeout(() => anim.start(), delay);
    return () => { clearTimeout(t); anim.stop(); };
  }, []);
  const S = (w: any, h: number, r = 6) => (
    <RNAnimated.View style={{ width: w, height: h, borderRadius: r, backgroundColor: '#e8e5f2', opacity }} />
  );
  return (
    <View style={skelS.card}>
      <View style={skelS.row}>
        {S(46, 46, 14)}
        <View style={skelS.lines}>
          {S('65%', 14, 6)}
          <View style={{ height: 6 }} />
          {S('45%', 10, 5)}
        </View>
        {S(72, 22, 11)}
      </View>
      <View style={{ height: 12 }} />
      {S('100%', 52, 12)}
      <View style={{ height: 10 }} />
      {S('100%', 36, 10)}
    </View>
  );
};
const skelS = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lines: { flex: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────
export const LoanRequestsScreen: React.FC<LoanRequestsScreenProps> = ({ navigation }) => {
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortModal, setShowSortModal] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const searchAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => { navigation.setOptions({ headerShown: false }); loadRequests(); }, []);

  useEffect(() => {
    RNAnimated.timing(searchAnim, { toValue: searchFocused ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [searchFocused]);

  const loadRequests = async () => {
    try {
      await new Promise(r => setTimeout(r, 1000));
      setRequests(MOCK_REQUESTS);
    } catch { Alert.alert('Error', 'No se pudieron cargar las solicitudes'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleRefresh = () => { setRefreshing(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); loadRequests(); };
  const handleAdd = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); (navigation as any).navigate('LoanRequestForm'); };

  const handleApprove = (req: LoanRequest) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Aprobar solicitud', `¿Confirmas la aprobación del préstamo de ${req.clientName}?\n\nMonto: ${fmt(req.amount)}`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aprobar', onPress: () => { setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r)); } },
    ]);
  };

  const handleReject = (req: LoanRequest) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert('Rechazar solicitud', `¿Seguro que quieres rechazar la solicitud de ${req.clientName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rechazar', style: 'destructive', onPress: () => setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r)) },
    ]);
  };

  const handleReview = (req: LoanRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'under_review' } : r));
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...requests];
    if (activeFilter !== 'all') list = list.filter(r => r.status === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => r.clientName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.clientPhone.includes(q) || r.purpose.toLowerCase().includes(q));
    }
    const order = { high: 0, medium: 1, low: 2 };
    switch (sortType) {
      case 'recent': list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case 'amount_high': list.sort((a, b) => b.amount - a.amount); break;
      case 'amount_low': list.sort((a, b) => a.amount - b.amount); break;
      case 'priority': list.sort((a, b) => order[a.priority] - order[b.priority]); break;
    }
    return list;
  }, [requests, activeFilter, sortType, searchQuery]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    underReview: requests.filter(r => r.status === 'under_review').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    totalAmount: requests.reduce((s, r) => s + r.amount, 0),
    highPriority: requests.filter(r => r.priority === 'high' && (r.status === 'pending' || r.status === 'under_review')).length,
  }), [requests]);

  const navOpacity = scrollY.interpolate({ inputRange: [0, 70], outputRange: [0, 1], extrapolate: 'clamp' });
  const searchBorder = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.brandVibrant] as any });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating nav */}
      <RNAnimated.View style={[s.floatNav, { opacity: navOpacity }]} pointerEvents="box-none">
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={s.floatRow}>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.floatTitle}>Solicitudes de Préstamos</Text>
          <TouchableOpacity style={[s.navBtn, { backgroundColor: C.brandFaint }]} onPress={handleAdd}>
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
        {/* Header */}
        <LinearGradient colors={[C.brand, C.brandMid, C.brandVibrant]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
          {/* Decorative circles */}
          <View style={s.decCircle1} />
          <View style={s.decCircle2} />

          <View style={s.headerTop}>
            <TouchableOpacity style={s.navBtnWhite} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={s.headerLabel}>GESTIÓN</Text>
              <Text style={s.headerTitle}>Solicitudes de Préstamos</Text>
            </View>
            <TouchableOpacity style={s.navBtnWhite} onPress={handleAdd}>
              <Ionicons name="add" size={22} color="white" />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.headerStatsRow}>
            <View style={s.hStat}>
              <Text style={s.hStatVal}>{stats.total}</Text>
              <Text style={s.hStatLbl}>Total</Text>
            </View>
            <View style={s.hDivider} />
            <View style={s.hStat}>
              <Text style={s.hStatVal}>{stats.pending}</Text>
              <Text style={s.hStatLbl}>Pendientes</Text>
            </View>
            <View style={s.hDivider} />
            <View style={s.hStat}>
              <Text style={s.hStatVal}>{stats.approved}</Text>
              <Text style={s.hStatLbl}>Aprobados</Text>
            </View>
            <View style={s.hDivider} />
            <View style={s.hStat}>
              <Text style={[s.hStatVal, stats.highPriority > 0 && { color: '#fbbf24' }]}>{stats.highPriority}</Text>
              <Text style={s.hStatLbl}>Alta prioridad</Text>
            </View>
          </Animated.View>

          {/* Total amount banner */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={s.amountBanner}>
            <Ionicons name="cash-outline" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={s.amountBannerLabel}>Monto total en cartera: </Text>
            <Text style={s.amountBannerVal}>{fmtShort(stats.totalAmount)}</Text>
          </Animated.View>
        </LinearGradient>

        <View style={s.body}>
          {/* Search */}
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <RNAnimated.View style={[s.searchBox, { borderColor: searchBorder }]}>
              <Ionicons name="search" size={17} color={searchFocused ? C.brandVibrant : C.textMuted} />
              <TextInput
                style={s.searchInput}
                placeholder="Nombre, ID, teléfono o propósito…"
                placeholderTextColor={C.textPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                returnKeyType="search"
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={17} color={C.textMuted} />
                </TouchableOpacity>
              )}
            </RNAnimated.View>
          </Animated.View>

          {/* Filter chips */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <View style={s.filterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
                <FilterChip label="Todas" active={activeFilter === 'all'} onPress={() => setActiveFilter('all')} count={stats.total} />
                <FilterChip label="Pendientes" active={activeFilter === 'pending'} onPress={() => setActiveFilter('pending')} count={stats.pending} dotColor={STATUS_CONFIG.pending.dot} />
                <FilterChip label="En revisión" active={activeFilter === 'under_review'} onPress={() => setActiveFilter('under_review')} count={stats.underReview} dotColor={STATUS_CONFIG.under_review.dot} />
                <FilterChip label="Aprobadas" active={activeFilter === 'approved'} onPress={() => setActiveFilter('approved')} count={stats.approved} dotColor={STATUS_CONFIG.approved.dot} />
                <FilterChip label="Rechazadas" active={activeFilter === 'rejected'} onPress={() => setActiveFilter('rejected')} count={stats.rejected} dotColor={STATUS_CONFIG.rejected.dot} />
              </ScrollView>
              <TouchableOpacity
                style={[s.sortBtn, showSortModal && { backgroundColor: C.brandFaint, borderColor: C.brandVibrant }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSortModal(true); }}
              >
                <Ionicons name="swap-vertical" size={18} color={showSortModal ? C.brandVibrant : C.textSec} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Stat pills */}
          <Animated.View entering={FadeInDown.delay(180).springify()} style={s.pillRow}>
            <StatPill icon="time" value={stats.pending} label="Pendientes" color={C.warningMid} bg={C.warningBg} onPress={() => setActiveFilter('pending')} />
            <View style={{ width: 8 }} />
            <StatPill icon="hourglass" value={stats.underReview} label="En revisión" color={C.reviewMid} bg={C.reviewBg} onPress={() => setActiveFilter('under_review')} />
          </Animated.View>

          {/* Results bar */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={s.resultsBar}>
            <Text style={s.resultsCount}>
              <Text style={{ color: C.brandVibrant, fontWeight: '800' }}>{filteredAndSorted.length}</Text>
              {' '}{filteredAndSorted.length === 1 ? 'solicitud' : 'solicitudes'}
              {activeFilter !== 'all' && <Text style={{ color: C.textMuted }}> · {STATUS_CONFIG[activeFilter as LoanRequest['status']]?.label}</Text>}
            </Text>
            {(activeFilter !== 'all' || searchQuery) && (
              <TouchableOpacity onPress={() => { setActiveFilter('all'); setSearchQuery(''); }} style={s.clearBtn}>
                <Ionicons name="close" size={12} color={C.brandVibrant} />
                <Text style={s.clearText}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* List */}
          {loading ? (
            [0, 1, 2].map(i => <SkeletonCard key={i} delay={i * 120} />)
          ) : filteredAndSorted.length > 0 ? (
            filteredAndSorted.map((req, i) => (
              <RequestCard
                key={req.id}
                request={req}
                index={i}
                onPress={() => Alert.alert(req.id, `Ver detalles de ${req.clientName}`)}
                onApprove={() => handleApprove(req)}
                onReject={() => handleReject(req)}
                onReview={() => handleReview(req)}
              />
            ))
          ) : (
            <EmptyState query={searchQuery} onAdd={handleAdd} />
          )}

          <View style={{ height: 100 }} />
        </View>
      </RNAnimated.ScrollView>

      {/* FAB */}
      <Animated.View entering={ZoomIn.delay(350).springify()} style={s.fab}>
        <TouchableOpacity onPress={handleAdd} activeOpacity={0.88} style={s.fabInner}>
          <LinearGradient colors={[C.brandLight, C.brandVibrant, C.brandMid]} style={s.fabGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="add" size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <SortModal visible={showSortModal} onClose={() => setShowSortModal(false)} currentSort={sortType} onSelect={setSortType} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Float nav
  floatNav: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99, height: 96, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  floatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  floatTitle: { fontSize: 15, fontWeight: '800', color: C.text, flex: 1, textAlign: 'center' },
  navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  // Header
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
  hStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 2, textAlign: 'center' },
  hDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.15)' },
  amountBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  amountBannerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  amountBannerVal: { fontSize: 14, color: '#fff', fontWeight: '800' },

  // Body
  body: { padding: 16 },

  // Search
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 3, marginBottom: 14, borderWidth: 1.5, gap: 10,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 11, color: C.text, fontWeight: '500' },

  // Filters
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sortBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },

  // Pills
  pillRow: { flexDirection: 'row', marginBottom: 14 },

  // Results
  resultsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultsCount: { fontSize: 13, color: C.textSec, fontWeight: '600' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.brandFaint, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  clearText: { fontSize: 12, color: C.brandVibrant, fontWeight: '700' },

  // FAB
  fab: { position: 'absolute', bottom: 28, right: 20, zIndex: 100, shadowColor: C.brandVibrant, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabInner: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden' },
  fabGrad: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
});