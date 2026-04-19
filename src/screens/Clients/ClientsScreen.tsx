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
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { MainTabParamList } from '../../navigation/types';

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

// ─── ClientAvatar Component ────────────────────────────────────────
const ClientAvatar: React.FC<{ client: Client; size?: number }> = ({ client, size = 50 }) => {
  const initials = `${client.firstName[0]}${client.lastName[0]}`.toUpperCase();
  const gradientIndex = parseInt(client.id) % AVATAR_GRADIENTS.length;
  const [c1, c2] = AVATAR_GRADIENTS[gradientIndex];
  
  return (
    <View style={{ width: size, height: size, borderRadius: size / 3.5, overflow: 'hidden' }}>
      <LinearGradient
        colors={[c1, c2]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: size * 0.3, fontWeight: '800' }}>
          {initials}
        </Text>
      </View>
      {client.status === 'active' && (
        <View style={avatarS.onlineDot} />
      )}
    </View>
  );
};

const avatarS = StyleSheet.create({
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.success,
    borderWidth: 2,
    borderColor: 'white',
  },
});

// ─── StatusBadge Component ─────────────────────────────────────────
const StatusBadge: React.FC<{ status: Client['status'] }> = ({ status }) => {
  const config = {
    active: { label: 'Activo', bg: C.successBg, color: C.success, icon: 'checkmark-circle' },
    inactive: { label: 'Inactivo', bg: C.warningBg, color: C.warning, icon: 'time' },
    blocked: { label: 'Bloqueado', bg: C.dangerBg, color: C.danger, icon: 'close-circle' },
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
  },
});

// ─── CreditScoreIndicator Component ────────────────────────────────
const CreditScoreIndicator: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = (s: number) => {
    if (s >= 700) return C.success;
    if (s >= 600) return C.warning;
    if (s > 0) return C.danger;
    return C.textMuted;
  };

  const getScoreLevel = (s: number) => {
    if (s >= 700) return 'Excelente';
    if (s >= 600) return 'Bueno';
    if (s > 0) return 'Regular';
    return 'Sin score';
  };

  const color = getScoreColor(score);
  const level = getScoreLevel(score);
  const percentage = score > 0 ? (score / 850) * 100 : 0;

  return (
    <View style={scoreS.container}>
      <View style={scoreS.header}>
        <Text style={scoreS.label}>Score Crediticio</Text>
        <Text style={[scoreS.value, { color }]}>{score > 0 ? score : 'N/A'}</Text>
      </View>
      <View style={scoreS.bar}>
        <View style={[scoreS.fill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={[scoreS.level, { color }]}>{level}</Text>
    </View>
  );
};

const scoreS = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textSub,
  },
  value: {
    fontSize: 12,
    fontWeight: '800',
  },
  bar: {
    height: 4,
    backgroundColor: C.primary4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  level: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'right',
  },
});

// ─── FilterChip Component ──────────────────────────────────────────
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
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: C.primary5,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.primary2,
  },
  countTextActive: {
    color: C.white,
  },
});

// ─── StatCard Component ────────────────────────────────────────────
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
      statS.card,
      pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
    ]}
  >
    <View style={[statS.iconBg, { backgroundColor: bgColor }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={statS.value}>{value}</Text>
    <Text style={statS.label}>{label}</Text>
  </Pressable>
);

const statS = StyleSheet.create({
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

// ─── SortModal Component ───────────────────────────────────────────
const SortModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  currentSort: SortType;
  onSelect: (sort: SortType) => void;
}> = ({ visible, onClose, currentSort, onSelect }) => {
  const options: { value: SortType; label: string; icon: string }[] = [
    { value: 'recent', label: 'Más recientes', icon: 'time-outline' },
    { value: 'name', label: 'Nombre A-Z', icon: 'text-outline' },
    { value: 'loans_high', label: 'Más préstamos', icon: 'trending-down-outline' },
    { value: 'loans_low', label: 'Menos préstamos', icon: 'trending-up-outline' },
    { value: 'amount_high', label: 'Mayor monto', icon: 'cash-outline' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
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

// ─── ClientCard Component ──────────────────────────────────────────
const ClientCard: React.FC<{
  client: Client;
  index: number;
  onPress: () => void;
}> = ({ client, index, onPress }) => {
  const fmt = (v: number) =>
    `RD$${v.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <View style={cardS.mainRow}>
          <ClientAvatar client={client} />
          <View style={cardS.info}>
            <View style={cardS.nameRow}>
              <Text style={cardS.name} numberOfLines={1}>
                {client.firstName} {client.lastName}
              </Text>
              <StatusBadge status={client.status} />
            </View>
            <View style={cardS.contactRow}>
              <Ionicons name="mail-outline" size={12} color={C.textMuted} />
              <Text style={cardS.email} numberOfLines={1}>{client.email}</Text>
            </View>
            <View style={cardS.contactRow}>
              <Ionicons name="call-outline" size={12} color={C.textMuted} />
              <Text style={cardS.phone}>{client.phone}</Text>
            </View>
          </View>
        </View>

        <View style={cardS.statsRow}>
          <View style={cardS.stat}>
            <Text style={cardS.statValue}>{client.totalLoans}</Text>
            <Text style={cardS.statLabel}>Préstamos</Text>
          </View>
          <View style={cardS.statDivider} />
          <View style={cardS.stat}>
            <Text style={cardS.statValue}>{client.activeLoans}</Text>
            <Text style={cardS.statLabel}>Activos</Text>
          </View>
          <View style={cardS.statDivider} />
          <View style={cardS.stat}>
            <Text style={[cardS.statValue, { fontSize: 13 }]} numberOfLines={1}>
              {fmt(client.totalAmount)}
            </Text>
            <Text style={cardS.statLabel}>Total</Text>
          </View>
        </View>

        {client.creditScore !== undefined && (
          <CreditScoreIndicator score={client.creditScore || 0} />
        )}

        <View style={cardS.footer}>
          <View style={cardS.footerItem}>
            <Ionicons name="location-outline" size={12} color={C.textMuted} />
            <Text style={cardS.footerText} numberOfLines={1}>{client.city}</Text>
          </View>
          <View style={cardS.footerItem}>
            <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
            <Text style={cardS.footerText}>
              Último contacto: {new Date(client.lastContact).toLocaleDateString('es-DO')}
            </Text>
          </View>
        </View>

        <View style={cardS.actions}>
          <TouchableOpacity
            style={[cardS.actionBtn, { backgroundColor: C.primary5 }]}
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Llamar', `Llamar a ${client.firstName} ${client.lastName}`);
            }}
          >
            <Ionicons name="call" size={16} color={C.primary2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[cardS.actionBtn, { backgroundColor: C.successBg }]}
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('WhatsApp', `Enviar mensaje a ${client.firstName}`);
            }}
          >
            <Ionicons name="logo-whatsapp" size={16} color={C.success} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[cardS.actionBtn, { backgroundColor: C.infoBg }]}
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Email', `Enviar email a ${client.email}`);
            }}
          >
            <Ionicons name="mail" size={16} color={C.info} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[cardS.actionBtn, { backgroundColor: C.border }]}
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert(
                'Más opciones',
                `Opciones para ${client.firstName} ${client.lastName}`,
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
  mainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    flex: 1,
    marginRight: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  email: {
    fontSize: 12,
    color: C.textSub,
    flex: 1,
  },
  phone: {
    fontSize: 12,
    color: C.textSub,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  statLabel: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: C.border,
  },
  footer: {
    marginTop: 8,
    gap: 4,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: C.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Main Component ────────────────────────────────────────────────
export const ClientsScreen: React.FC<ClientsScreenProps> = ({ navigation }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortModal, setShowSortModal] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    loadClients();
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const loadClients = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setClients(MOCK_CLIENTS);
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadClients();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAddClient = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    (navigation as any).navigate('ClientForm');
  };

  const handleClientPress = (client: Client) => {
    (navigation as any).navigate('ClientDetails', { clientId: client.id });
  };

  // Filtrar y ordenar clientes
  const filteredAndSortedClients = useMemo(() => {
    let filtered = [...clients];

    // Aplicar filtro
    switch (activeFilter) {
      case 'active':
        filtered = filtered.filter(c => c.status === 'active');
        break;
      case 'inactive':
        filtered = filtered.filter(c => c.status === 'inactive');
        break;
      case 'withLoans':
        filtered = filtered.filter(c => c.totalLoans > 0);
        break;
      case 'noLoans':
        filtered = filtered.filter(c => c.totalLoans === 0);
        break;
    }

    // Aplicar búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.documentNumber.includes(searchQuery)
      );
    }

    // Aplicar ordenamiento
    switch (sortType) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
        break;
      case 'loans_high':
        filtered.sort((a, b) => b.totalLoans - a.totalLoans);
        break;
      case 'loans_low':
        filtered.sort((a, b) => a.totalLoans - b.totalLoans);
        break;
      case 'amount_high':
        filtered.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
    }

    return filtered;
  }, [clients, activeFilter, sortType, searchQuery]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'active').length;
    const withLoans = clients.filter(c => c.totalLoans > 0).length;
    const totalAmount = clients.reduce((sum, c) => sum + c.totalAmount, 0);
    const avgCreditScore = clients.filter(c => c.creditScore && c.creditScore > 0).length > 0
      ? Math.round(clients.filter(c => c.creditScore && c.creditScore > 0).reduce((sum, c) => sum + (c.creditScore || 0), 0) / clients.filter(c => c.creditScore && c.creditScore > 0).length)
      : 0;

    return { total, active, withLoans, totalAmount, avgCreditScore };
  }, [clients]);

  const fmt = (v: number) =>
    `RD$${v.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const renderEmpty = () => (
    <Animated.View entering={FadeInDown.delay(200)} style={emptyS.container}>
      <View style={emptyS.iconBg}>
        <Ionicons name="people-outline" size={48} color={C.primary2} />
      </View>
      <Text style={emptyS.title}>No hay clientes</Text>
      <Text style={emptyS.subtitle}>
        {searchQuery ? 'No se encontraron resultados' : 'Agrega tu primer cliente'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={emptyS.button} onPress={handleAddClient}>
          <Text style={emptyS.buttonText}>Crear cliente</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  if (loading) {
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
            <Ionicons name="people" size={40} color={C.primary2} />
          </View>
          <Text style={loadS.title}>Cargando clientes...</Text>
          <View style={loadS.progressBg}>
            <Animated.View
              style={[
                loadS.progressFill,
                { width: '60%' },
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

      {/* Floating header */}
      <RNAnimated.View style={[styles.floatNav, { opacity: headerOpacity }]}>
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={styles.floatContent}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.getParent?.()?.openDrawer()}>
            <Ionicons name="menu-outline" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.floatTitle}>Clientes</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={handleAddClient}>
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
            <Text style={styles.headerTitle}>Clientes</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={handleAddClient}>
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
              <Text style={styles.statValue}>{stats.active}</Text>
              <Text style={styles.statLabel}>Activos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{fmt(stats.totalAmount)}</Text>
              <Text style={styles.statLabel}>Cartera</Text>
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
                placeholder="Buscar por nombre, email, teléfono o documento..."
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
                <FilterChip
                  label="Todos"
                  active={activeFilter === 'all'}
                  onPress={() => setActiveFilter('all')}
                  icon="apps-outline"
                  count={clients.length}
                />
                <FilterChip
                  label="Activos"
                  active={activeFilter === 'active'}
                  onPress={() => setActiveFilter('active')}
                  icon="checkmark-circle-outline"
                  count={stats.active}
                />
                <FilterChip
                  label="Inactivos"
                  active={activeFilter === 'inactive'}
                  onPress={() => setActiveFilter('inactive')}
                  icon="time-outline"
                  count={clients.filter(c => c.status === 'inactive').length}
                />
                <FilterChip
                  label="Con préstamos"
                  active={activeFilter === 'withLoans'}
                  onPress={() => setActiveFilter('withLoans')}
                  icon="cash-outline"
                  count={stats.withLoans}
                />
                <FilterChip
                  label="Sin préstamos"
                  active={activeFilter === 'noLoans'}
                  onPress={() => setActiveFilter('noLoans')}
                  icon="document-outline"
                  count={clients.filter(c => c.totalLoans === 0).length}
                />
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
              label="Con préstamos"
              value={stats.withLoans}
              icon="cash"
              color={C.primary2}
              bgColor={C.primary5}
              onPress={() => setActiveFilter('withLoans')}
            />
            <View style={{ width: 8 }} />
            <StatCard
              label="Score promedio"
              value={stats.avgCreditScore || 'N/A'}
              icon="trending-up"
              color={C.info}
              bgColor={C.infoBg}
            />
          </Animated.View>

          {/* ── RESULTS COUNT ────────────────────────────── */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {filteredAndSortedClients.length} {filteredAndSortedClients.length === 1 ? 'cliente' : 'clientes'}
            </Text>
            {activeFilter !== 'all' && (
              <TouchableOpacity onPress={() => setActiveFilter('all')}>
                <Text style={styles.clearFilter}>Limpiar filtro</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── CLIENTS LIST ─────────────────────────────── */}
          {filteredAndSortedClients.length > 0 ? (
            filteredAndSortedClients.map((client, index) => (
              <ClientCard
                key={client.id}
                client={client}
                index={index}
                onPress={() => handleClientPress(client)}
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
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleAddClient}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[C.primary2, C.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="person-add" size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ─── SORT MODAL ────────────────────────────────── */}
      <SortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        currentSort={sortType}
        onSelect={setSortType}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
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