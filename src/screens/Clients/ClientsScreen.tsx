import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
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
  TouchableOpacity,
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
import { MainTabParamList } from '../../navigation/types';
import { useClients } from '@/hooks/useClients';

const { width } = Dimensions.get('window');

// ─── Design Tokens (Extraídos de LoanRequestsScreen) ──────────────
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
  warning: '#b45309',
  warningMid: '#d97706',
  warningBg: '#fffbeb',
  danger: '#b91c1c',
  dangerMid: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#0369a1',
  infoMid: '#0284c7',
  infoBg: '#f0f9ff',
  
  // Misc
  gold: '#f59e0b',
  shadow: 'rgba(109,40,217,0.12)',
};

type ClientsScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Clients'>;

interface ClientsScreenProps {
  navigation: ClientsScreenNavigationProp;
}

// ─── Tipos ─────────────────────────────────────────────────────────
interface Client {
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
}

type FilterType = 'all' | 'active' | 'inactive' | 'withLoans' | 'noLoans';
type SortType = 'recent' | 'name' | 'loans_high' | 'loans_low' | 'amount_high';

// ─── Datos Mock Mejorados ──────────────────────────────────────────
const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    firstName: 'Juan',
    lastName: 'Rodríguez Méndez',
    email: 'juan.rodriguez@email.com',
    phone: '809-555-1234',
    documentType: 'cedula',
    documentNumber: '402-1234567-8',
    monthlyIncome: 45000,
    occupation: 'Ingeniero de Software',
    address: 'Calle Principal #123, Ensanche Piantini',
    city: 'Santo Domingo',
    status: 'active',
    totalLoans: 3,
    activeLoans: 1,
    totalAmount: 45750.50,
    lastContact: '2026-04-15',
    createdAt: '2025-06-10',
    creditScore: 720,
  },
  {
    id: '2',
    firstName: 'María',
    lastName: 'Pérez González',
    email: 'maria.perez@email.com',
    phone: '829-555-2345',
    documentType: 'cedula',
    documentNumber: '402-8765432-1',
    monthlyIncome: 35000,
    occupation: 'Contadora',
    address: 'Av. Lincoln #456, La Julia',
    city: 'Santo Domingo',
    status: 'active',
    totalLoans: 2,
    activeLoans: 1,
    totalAmount: 18250.00,
    lastContact: '2026-04-10',
    createdAt: '2025-08-15',
    creditScore: 680,
  },
  {
    id: '3',
    firstName: 'Carlos',
    lastName: 'García López',
    email: 'carlos.garcia@email.com',
    phone: '809-555-3456',
    documentType: 'passport',
    documentNumber: 'PA123456',
    monthlyIncome: 65000,
    occupation: 'Médico',
    address: 'Calle Las Mercedes #789, Los Cacicazgos',
    city: 'Santo Domingo',
    status: 'active',
    totalLoans: 5,
    activeLoans: 2,
    totalAmount: 72300.75,
    lastContact: '2026-04-18',
    createdAt: '2025-01-20',
    creditScore: 790,
  },
  {
    id: '4',
    firstName: 'Ana',
    lastName: 'Martínez Ruiz',
    email: 'ana.martinez@email.com',
    phone: '829-555-4567',
    documentType: 'cedula',
    documentNumber: '402-3456789-0',
    monthlyIncome: 28000,
    occupation: 'Diseñadora Gráfica',
    address: 'Calle El Conde #234, Zona Colonial',
    city: 'Santo Domingo',
    status: 'inactive',
    totalLoans: 1,
    activeLoans: 0,
    totalAmount: 12500.00,
    lastContact: '2026-03-20',
    createdAt: '2025-11-05',
    creditScore: 620,
  },
  {
    id: '5',
    firstName: 'Roberto',
    lastName: 'Fernández Marte',
    email: 'roberto.fernandez@email.com',
    phone: '809-555-5678',
    documentType: 'rnc',
    documentNumber: '130123456',
    monthlyIncome: 85000,
    occupation: 'Empresario',
    address: 'Av. Winston Churchill #890, Ensanche Paraíso',
    city: 'Santo Domingo',
    status: 'active',
    totalLoans: 4,
    activeLoans: 2,
    totalAmount: 118750.25,
    lastContact: '2026-04-12',
    createdAt: '2025-03-01',
    creditScore: 810,
  },
  {
    id: '6',
    firstName: 'Luisa',
    lastName: 'Hernández Díaz',
    email: 'luisa.hernandez@email.com',
    phone: '829-555-6789',
    documentType: 'cedula',
    documentNumber: '402-5678901-2',
    monthlyIncome: 42000,
    occupation: 'Abogada',
    address: 'Calle El Recodo #567, Bella Vista',
    city: 'Santo Domingo',
    status: 'active',
    totalLoans: 2,
    activeLoans: 1,
    totalAmount: 24300.00,
    lastContact: '2026-04-14',
    createdAt: '2025-09-12',
    creditScore: 750,
  },
  {
    id: '7',
    firstName: 'Pedro',
    lastName: 'Sánchez Vega',
    email: 'pedro.sanchez@email.com',
    phone: '809-555-7890',
    documentType: 'cedula',
    documentNumber: '402-7890123-4',
    monthlyIncome: 31000,
    occupation: 'Vendedor',
    address: 'Av. 27 de Febrero #1234, El Millón',
    city: 'Santo Domingo',
    status: 'blocked',
    totalLoans: 3,
    activeLoans: 0,
    totalAmount: 29200.50,
    lastContact: '2026-02-28',
    createdAt: '2025-05-18',
    creditScore: 540,
  },
  {
    id: '8',
    firstName: 'Sofía',
    lastName: 'Ramírez Castro',
    email: 'sofia.ramirez@email.com',
    phone: '829-555-8901',
    documentType: 'passport',
    documentNumber: 'PB789012',
    monthlyIncome: 58000,
    occupation: 'Arquitecta',
    address: 'Calle Padre Billini #345, Gazcue',
    city: 'Santo Domingo',
    status: 'active',
    totalLoans: 1,
    activeLoans: 1,
    totalAmount: 31200.00,
    lastContact: '2026-04-16',
    createdAt: '2026-01-10',
    creditScore: 700,
  },
  {
    id: '9',
    firstName: 'Diego',
    lastName: 'Morales Ruiz',
    email: 'diego.morales@email.com',
    phone: '809-555-9012',
    documentType: 'cedula',
    documentNumber: '402-8901234-5',
    monthlyIncome: 38000,
    occupation: 'Profesor',
    address: 'Av. Independencia #678, San Carlos',
    city: 'Santo Domingo',
    status: 'active',
    totalLoans: 0,
    activeLoans: 0,
    totalAmount: 0,
    lastContact: '2026-04-01',
    createdAt: '2026-02-20',
    creditScore: 0,
  },
  {
    id: '10',
    firstName: 'Carmen',
    lastName: 'Vega Torres',
    email: 'carmen.vega@email.com',
    phone: '829-555-0123',
    documentType: 'cedula',
    documentNumber: '402-9012345-6',
    monthlyIncome: 48000,
    occupation: 'Farmacéutica',
    address: 'Calle José Contreras #901, Villa Consuelo',
    city: 'Santo Domingo',
    status: 'active',
    totalLoans: 2,
    activeLoans: 1,
    totalAmount: 19800.00,
    lastContact: '2026-04-17',
    createdAt: '2025-12-05',
    creditScore: 730,
  },
];

// ─── AVATAR GRADIENTS (Paleta unificada) ──────────────────────────
const AVATAR_PALETTES: [string, string][] = [
  ['#7c3aed', '#4f46e5'], ['#8b5cf6', '#06b6d4'], ['#f87171', '#f59e0b'],
  ['#059669', '#0891b2'], ['#7c3aed', '#059669'], ['#a78bfa', '#f59e0b'],
  ['#ec4899', '#8b5cf6'], ['#14b8a6', '#3b82f6'], ['#f97316', '#ef4444'],
  ['#6366f1', '#8b5cf6'],
];

// ─── Componentes UI Reutilizables (Estilo LoanRequests) ───────────

// Avatar (Estilo exacto de LoanRequestsScreen)
const Avatar: React.FC<{ name: string; index: number; size?: number }> = ({ name, index, size = 46 }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
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

// StatusBadge (Estilo exacto de la pantalla de Solicitudes)
const StatusBadge: React.FC<{ status: Client['status'] }> = ({ status }) => {
  const config: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    active:    { label: 'Activo',   bg: C.successBg,  color: C.successMid,  dot: '#10b981' },
    inactive:  { label: 'Inactivo', bg: C.warningBg,  color: C.warningMid,  dot: '#f59e0b' },
    blocked:   { label: 'Bloqueado',bg: C.dangerBg,   color: C.dangerMid,   dot: '#ef4444' },
  };
  const cfg = config[status];
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

// CreditScoreIndicator (Estilo unificado)
const CreditScoreBar: React.FC<{ score: number }> = ({ score }) => {
  if (!score) return null;
  const pct = Math.min(score / 850, 1);
  const getColor = () => {
    if (score >= 700) return C.successMid;
    if (score >= 600) return C.warningMid;
    return C.dangerMid;
  };
  const color = getColor();
  return (
    <View style={creditS.wrapper}>
      <View style={creditS.track}>
        <View style={[creditS.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[creditS.score, { color }]}>{score}</Text>
    </View>
  );
};
const creditS = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  track: { flex: 1, height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  score: { fontSize: 11, fontWeight: '700', minWidth: 28, textAlign: 'right' },
});

// FilterChip (Estilo unificado)
const FilterChip: React.FC<{ label: string; active: boolean; onPress: () => void; count?: number }> = ({ label, active, onPress, count }) => (
  <TouchableOpacity
    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
    style={[chipS.chip, active && chipS.chipActive]}
    activeOpacity={0.75}
  >
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
  label: { fontSize: 13, fontWeight: '600', color: C.textSec },
  labelActive: { color: '#fff' },
  badge: { marginLeft: 6, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: C.brandFaint, alignItems: 'center', justifyContent: 'center' },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  badgeText: { fontSize: 10, fontWeight: '800', color: C.brandVibrant },
  badgeTextActive: { color: '#fff' },
});

// StatCard (Estilo unificado)
const StatCard: React.FC<{ label: string; value: string | number; icon: string; color: string; bg: string; onPress?: () => void }> = ({ label, value, icon, color, bg, onPress }) => (
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

// SortModal (Estilo unificado)
const SortModal: React.FC<{ visible: boolean; onClose: () => void; currentSort: SortType; onSelect: (s: SortType) => void }> = ({ visible, onClose, currentSort, onSelect }) => {
  const opts: { value: SortType; label: string; icon: string }[] = [
    { value: 'recent', label: 'Más recientes', icon: 'time-outline' },
    { value: 'name', label: 'Nombre A-Z', icon: 'text-outline' },
    { value: 'loans_high', label: 'Más préstamos', icon: 'arrow-up-circle-outline' },
    { value: 'loans_low', label: 'Menos préstamos', icon: 'arrow-down-circle-outline' },
    { value: 'amount_high', label: 'Mayor monto', icon: 'cash-outline' },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalS.overlay} onPress={onClose}>
        <Animated.View entering={ZoomIn.duration(180)} style={modalS.sheet}>
          <View style={modalS.handle} />
          <Text style={modalS.title}>Ordenar clientes</Text>
          {opts.map((o) => {
            const active = currentSort === o.value;
            return (
              <TouchableOpacity key={o.value} style={[modalS.row, active && modalS.rowActive]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(o.value); onClose(); }} activeOpacity={0.75}>
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

// ─── ClientCard (Rediseñado con el nuevo estilo) ─────────────────
const ClientCard: React.FC<{ client: Client; index: number; onPress: () => void }> = ({ client, index, onPress }) => {
  const fmt = (v: number) => `RD$${v.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  const fullName = `${client.firstName} ${client.lastName}`;
  
  return (
    <Animated.View entering={SlideInRight.delay(100 + index * 50).springify()} layout={Layout.springify()}>
      <Pressable style={({ pressed }) => [cardS.card, pressed && cardS.cardPressed]} onPress={onPress}>
        <View style={cardS.headerRow}>
          <Avatar name={fullName} index={index} size={46} />
          <View style={cardS.headerMid}>
            <View style={cardS.nameRow}>
              <Text style={cardS.name} numberOfLines={1}>{fullName}</Text>
              <StatusBadge status={client.status} />
            </View>
            <View style={cardS.metaRow}>
              <Ionicons name="mail-outline" size={11} color={C.textMuted} />
              <Text style={cardS.metaText}>{client.email}</Text>
            </View>
            <View style={cardS.metaRow}>
              <Ionicons name="call-outline" size={11} color={C.textMuted} />
              <Text style={cardS.metaText}>{client.phone}</Text>
            </View>
          </View>
        </View>

        <View style={cardS.statsRow}>
          <View style={cardS.statItem}>
            <Text style={cardS.statVal}>{client.totalLoans}</Text>
            <Text style={cardS.statKey}>Préstamos</Text>
          </View>
          <View style={cardS.divider} />
          <View style={cardS.statItem}>
            <Text style={cardS.statVal}>{client.activeLoans}</Text>
            <Text style={cardS.statKey}>Activos</Text>
          </View>
          <View style={cardS.divider} />
          <View style={[cardS.statItem, { flex: 2 }]}>
            <Text style={cardS.statVal}>{fmt(client.totalAmount)}</Text>
            <Text style={cardS.statKey}>Total</Text>
          </View>
        </View>

        {client.creditScore ? <CreditScoreBar score={client.creditScore} /> : <View style={{ height: 8 }} />}

        <View style={cardS.footer}>
          <Ionicons name="location-outline" size={12} color={C.textMuted} />
          <Text style={cardS.footerText}>{client.city}</Text>
          <Text style={cardS.dot}>·</Text>
          <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
          <Text style={cardS.footerText}>Contacto: {new Date(client.lastContact).toLocaleDateString('es-DO')}</Text>
        </View>

        <View style={cardS.actions}>
          <ActionBtn icon="call" label="Llamar" color={C.brandVibrant} bg={C.brandFaint} onPress={() => Alert.alert('Llamar', `Llamando a ${fullName}...`)} />
          <ActionBtn icon="logo-whatsapp" label="WhatsApp" color={C.successMid} bg={C.successBg} onPress={() => Alert.alert('WhatsApp', `Enviando mensaje a ${fullName}...`)} />
          <ActionBtn icon="mail" label="Email" color={C.infoMid} bg={C.infoBg} onPress={() => Alert.alert('Email', `Escribiendo a ${client.email}...`)} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const ActionBtn: React.FC<{ icon: string; label: string; color: string; bg: string; onPress: () => void }> = ({ icon, label, color, bg, onPress }) => (
  <TouchableOpacity style={[cardS.actionBtn, { backgroundColor: bg }]} onPress={(e) => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} activeOpacity={0.78}>
    <Ionicons name={icon as any} size={14} color={color} />
    <Text style={[cardS.actionText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const cardS = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 },
  cardPressed: { opacity: 0.87, transform: [{ scale: 0.985 }] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  headerMid: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.brandFaint, borderRadius: 12, padding: 10, marginBottom: 8 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statVal: { fontSize: 15, fontWeight: '800', color: C.text },
  statKey: { fontSize: 9, color: C.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  divider: { width: 1, height: 28, backgroundColor: C.borderStrong },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  footerText: { fontSize: 11, color: C.textMuted },
  dot: { color: C.textMuted, marginHorizontal: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10 },
  actionText: { fontSize: 11, fontWeight: '700' },
});

// ─── Main Component ────────────────────────────────────────────────
export const ClientsScreen: React.FC<ClientsScreenProps> = ({ navigation }) => {
    const { clients, loading, loadClients: refreshClients } = useClients();

  // const [clients, setClients] = useState<Client[]>([]);
  // const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortModal, setShowSortModal] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  // const loadClients = async () => {
  //   try {
  //     await new Promise(resolve => setTimeout(resolve, 1000));
  //     setClients(MOCK_CLIENTS);
  //   } catch (error) {
  //     Alert.alert('Error', 'No se pudieron cargar los clientes');
  //   } finally {
  //     setLoading(false);
  //     setRefreshing(false);
  //   }
  // };


    const handleRefresh = async () => {
      setRefreshing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await refreshClients();
      setRefreshing(false);
    };

      const handleAddClient = () => { 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); 
    (navigation as any).navigate('ClientForm');
  };
  
  const handleClientPress = (client: Client) => { 
    (navigation as any).navigate('ClientDetails', { clientId: client.id }); 
  };

  const filteredAndSortedClients = useMemo(() => {
    let filtered = [...clients];
    if (activeFilter === 'active') filtered = filtered.filter(c => c.status === 'active');
    else if (activeFilter === 'inactive') filtered = filtered.filter(c => c.status === 'inactive');
    else if (activeFilter === 'withLoans') filtered = filtered.filter(c => c.totalLoans > 0);
    else if (activeFilter === 'noLoans') filtered = filtered.filter(c => c.totalLoans === 0);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q) || c.documentNumber.includes(q));
    }

    switch (sortType) {
      case 'recent': filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case 'name': filtered.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)); break;
      case 'loans_high': filtered.sort((a, b) => b.totalLoans - a.totalLoans); break;
      case 'loans_low': filtered.sort((a, b) => a.totalLoans - b.totalLoans); break;
      case 'amount_high': filtered.sort((a, b) => b.totalAmount - a.totalAmount); break;
    }
    return filtered;
  }, [clients, activeFilter, sortType, searchQuery]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'active').length;
    const withLoans = clients.filter(c => c.totalLoans > 0).length;
    const totalAmount = clients.reduce((sum, c) => sum + c.totalAmount, 0);
    return { total, active, withLoans, totalAmount };
  }, [clients]);

  const fmtShort = (v: number): string => {
    if (v >= 1_000_000) return `RD$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `RD$${(v / 1_000).toFixed(1)}K`;
    return `RD$${v.toFixed(0)}`;
  };

  const navOpacity = scrollY.interpolate({ inputRange: [0, 70], outputRange: [0, 1], extrapolate: 'clamp' });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <LinearGradient colors={[C.brand, C.brandMid, C.brandVibrant]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }} />
        <Animated.View entering={ZoomIn.duration(400)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 76, height: 76, borderRadius: 22, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="people" size={36} color={C.brandVibrant} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 16 }}>Cargando clientes…</Text>
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
          <Text style={s.floatTitle}>Clientes</Text>
          <TouchableOpacity style={[s.navBtn, { backgroundColor: C.brandFaint }]} onPress={handleAddClient}>
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
              <Text style={s.headerTitle}>Clientes</Text>
            </View>
            <TouchableOpacity style={s.navBtnWhite} onPress={handleAddClient}>
              <Ionicons name="person-add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.headerStatsRow}>
            <View style={s.hStat}><Text style={s.hStatVal}>{stats.total}</Text><Text style={s.hStatLbl}>Total</Text></View>
            <View style={s.hDivider} />
            <View style={s.hStat}><Text style={s.hStatVal}>{stats.active}</Text><Text style={s.hStatLbl}>Activos</Text></View>
            <View style={s.hDivider} />
            <View style={s.hStat}><Text style={s.hStatVal}>{stats.withLoans}</Text><Text style={s.hStatLbl}>Con préstamos</Text></View>
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
              <TextInput style={s.searchInput} placeholder="Nombre, email, teléfono o cédula…" placeholderTextColor={C.textPlaceholder} value={searchQuery} onChangeText={setSearchQuery} />
              {searchQuery !== '' && <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={17} color={C.textMuted} /></TouchableOpacity>}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <View style={s.filterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
                <FilterChip label="Todos" active={activeFilter === 'all'} onPress={() => setActiveFilter('all')} count={clients.length} />
                <FilterChip label="Activos" active={activeFilter === 'active'} onPress={() => setActiveFilter('active')} count={stats.active} />
                <FilterChip label="Inactivos" active={activeFilter === 'inactive'} onPress={() => setActiveFilter('inactive')} count={clients.filter(c => c.status === 'inactive').length} />
                <FilterChip label="Con préstamos" active={activeFilter === 'withLoans'} onPress={() => setActiveFilter('withLoans')} count={stats.withLoans} />
                <FilterChip label="Sin préstamos" active={activeFilter === 'noLoans'} onPress={() => setActiveFilter('noLoans')} count={clients.filter(c => c.totalLoans === 0).length} />
              </ScrollView>
              <TouchableOpacity style={[s.sortBtn, showSortModal && { backgroundColor: C.brandFaint, borderColor: C.brandVibrant }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSortModal(true); }}>
                <Ionicons name="swap-vertical" size={18} color={showSortModal ? C.brandVibrant : C.textSec} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).springify()} style={s.pillRow}>
            <StatCard icon="checkmark-circle" label="Activos" value={stats.active} color={C.successMid} bg={C.successBg} onPress={() => setActiveFilter('active')} />
            <View style={{ width: 8 }} />
            <StatCard icon="cash" label="Con préstamos" value={stats.withLoans} color={C.brandVibrant} bg={C.brandFaint} onPress={() => setActiveFilter('withLoans')} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={s.resultsBar}>
            <Text style={s.resultsCount}><Text style={{ color: C.brandVibrant, fontWeight: '800' }}>{filteredAndSortedClients.length}</Text> {filteredAndSortedClients.length === 1 ? 'cliente' : 'clientes'}</Text>
            {(activeFilter !== 'all' || searchQuery) && <TouchableOpacity onPress={() => { setActiveFilter('all'); setSearchQuery(''); }} style={s.clearBtn}><Ionicons name="close" size={12} color={C.brandVibrant} /><Text style={s.clearText}>Limpiar</Text></TouchableOpacity>}
          </Animated.View>

          {filteredAndSortedClients.length > 0 ? (
            filteredAndSortedClients.map((client, i) => <ClientCard key={client.id} client={client} index={i} onPress={() => handleClientPress(client)} />)
          ) : (
            <Animated.View entering={FadeIn.delay(100)} style={emptyS.wrap}>
              <View style={emptyS.circle}><Ionicons name="people-outline" size={44} color={C.brandLight} /></View>
              <Text style={emptyS.title}>Sin resultados</Text>
              <Text style={emptyS.sub}>{searchQuery ? `No se encontró "${searchQuery}"` : 'Agrega tu primer cliente'}</Text>
              {!searchQuery && <TouchableOpacity style={emptyS.btn} onPress={handleAddClient}><LinearGradient colors={[C.brandVibrant, C.brandMid]} style={emptyS.btnGrad}><Ionicons name="person-add" size={18} color="#fff" /><Text style={emptyS.btnText}>Nuevo cliente</Text></LinearGradient></TouchableOpacity>}
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </RNAnimated.ScrollView>

      <Animated.View entering={ZoomIn.delay(350).springify()} style={s.fab}>
        <TouchableOpacity onPress={handleAddClient} activeOpacity={0.88} style={s.fabInner}>
          <LinearGradient colors={[C.brandLight, C.brandVibrant, C.brandMid]} style={s.fabGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="person-add" size={28} color="white" />
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

const emptyS = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  circle: { width: 96, height: 96, borderRadius: 28, backgroundColor: C.brandFaint, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: C.border },
  title: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 6 },
  sub: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  btn: { borderRadius: 14, overflow: 'hidden' },
  btnGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});