import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Switch,
  Animated as RNAnimated,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeIn, ZoomIn, SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { RootStackParamList } from '../../navigation/types';

const { width: SW } = Dimensions.get('window');

// ─── Design Tokens (shared with LoanRequestsScreen) ──────────────
const C = {
  brand: '#1a0533',
  brandMid: '#3d0f7a',
  brandVibrant: '#6d28d9',
  brandLight: '#8b5cf6',
  brandPale: '#ede9fe',
  brandFaint: '#f5f3ff',
  bg: '#f8f7fc',
  surface: '#ffffff',
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
  shadow: 'rgba(109,40,217,0.12)',
};

type LoanRequestFormRouteProp = RouteProp<RootStackParamList, 'LoanRequestForm'>;
type LoanRequestFormNavigationProp = StackNavigationProp<RootStackParamList, 'LoanRequestForm'>;
interface LoanRequestFormScreenProps {
  route: LoanRequestFormRouteProp;
  navigation: LoanRequestFormNavigationProp;
}

interface ClientOption {
  id: string; name: string; phone: string; email?: string; documentId?: string;
}
interface LoanTypeOption {
  id: string; name: string; category: 'formal' | 'informal' | 'san';
  minAmount: number; maxAmount: number; defaultTerm: number; defaultInterest: number; icon: string;
}
interface FormData {
  clientId: string; clientName: string; clientPhone: string; clientEmail: string;
  clientDocument: string; isNewClient: boolean; loanType: string; amount: string;
  term: string; purpose: string; priority: 'high' | 'medium' | 'low';
  monthlyIncome: string; employmentStatus: string; employer: string; yearsEmployed: string;
  hasGuarantor: boolean; guarantorName: string; guarantorPhone: string; guarantorRelationship: string;
  hasCollateral: boolean; collateralType: string; collateralValue: string; collateralDescription: string;
  notes: string; notifyWhenApproved: boolean; notifyWhenRejected: boolean;
}

const MOCK_CLIENTS: ClientOption[] = [
  { id: '1', name: 'Juan Rodríguez Méndez', phone: '809-555-1234', email: 'juan@email.com', documentId: '402-1234567-8' },
  { id: '2', name: 'María Pérez González', phone: '829-555-2345', email: 'maria@email.com', documentId: '402-8765432-1' },
  { id: '3', name: 'Carlos García López', phone: '809-555-3456', email: 'carlos@email.com', documentId: '402-3456789-0' },
  { id: '4', name: 'Ana Martínez Ruiz', phone: '829-555-4567', email: 'ana@email.com', documentId: '402-9876543-2' },
];

const MOCK_LOAN_TYPES: LoanTypeOption[] = [
  { id: '1', name: 'Personal', category: 'formal', minAmount: 5000, maxAmount: 500000, defaultTerm: 12, defaultInterest: 12, icon: 'person-outline' },
  { id: '2', name: 'San Tradicional', category: 'san', minAmount: 1000, maxAmount: 100000, defaultTerm: 30, defaultInterest: 20, icon: 'people-outline' },
  { id: '3', name: 'Microcrédito', category: 'informal', minAmount: 500, maxAmount: 25000, defaultTerm: 12, defaultInterest: 15, icon: 'leaf-outline' },
  { id: '4', name: 'San Express', category: 'san', minAmount: 500, maxAmount: 25000, defaultTerm: 15, defaultInterest: 25, icon: 'flash-outline' },
  { id: '5', name: 'Vehículo', category: 'formal', minAmount: 100000, maxAmount: 2000000, defaultTerm: 60, defaultInterest: 10, icon: 'car-outline' },
];

const COLLATERAL_TYPES = [
  { id: '1', name: 'Prendaria', icon: 'lock-closed-outline' },
  { id: '2', name: 'Hipotecaria', icon: 'home-outline' },
  { id: '3', name: 'Vehículo', icon: 'car-outline' },
  { id: '4', name: 'Electrodoméstico', icon: 'tv-outline' },
  { id: '5', name: 'Joyas', icon: 'diamond-outline' },
];

const EMPLOYMENT_STATUS = [
  { id: 'employed', name: 'Empleado', icon: 'briefcase-outline' },
  { id: 'self_employed', name: 'Trabajador independiente', icon: 'construct-outline' },
  { id: 'business_owner', name: 'Dueño de negocio', icon: 'business-outline' },
  { id: 'retired', name: 'Jubilado/Pensionado', icon: 'ribbon-outline' },
  { id: 'unemployed', name: 'Desempleado', icon: 'close-circle-outline' },
];

const PRIORITY_CONFIG = {
  high:   { label: 'Alta prioridad', color: C.dangerMid,  bg: C.dangerBg,  icon: 'flame' },
  medium: { label: 'Prioridad media', color: C.warningMid, bg: C.warningBg, icon: 'alert' },
  low:    { label: 'Baja prioridad', color: C.successMid, bg: C.successBg, icon: 'checkmark-circle' },
};

const AVATAR_PALETTES: [string, string][] = [
  ['#7c3aed', '#4f46e5'], ['#8b5cf6', '#06b6d4'], ['#f87171', '#f59e0b'], ['#059669', '#0891b2'],
];

const fmtCurrency = (v: string) => {
  const n = parseFloat(v) || 0;
  return `RD$${n.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
};

// ─── Field Input ──────────────────────────────────────────────────
const FieldInput: React.FC<{
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder: string; keyboardType?: any; error?: string; required?: boolean;
  prefix?: string; suffix?: string; editable?: boolean; multiline?: boolean;
  numberOfLines?: number; helper?: string; icon?: string; iconColor?: string;
}> = ({ label, value, onChangeText, placeholder, keyboardType = 'default', error, required, prefix, editable = true, multiline, numberOfLines = 1, helper, icon, iconColor }) => {
  const [focused, setFocused] = useState(false);
  const shake = useRef(new RNAnimated.Value(0)).current;
  const focusAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (error) {
      RNAnimated.sequence([
        RNAnimated.timing(shake, { toValue: 6, duration: 60, useNativeDriver: true }),
        RNAnimated.timing(shake, { toValue: -6, duration: 60, useNativeDriver: true }),
        RNAnimated.timing(shake, { toValue: 4, duration: 60, useNativeDriver: true }),
        RNAnimated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  useEffect(() => {
    RNAnimated.timing(focusAnim, { toValue: focused ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [focused]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? C.dangerMid : C.border, error ? C.dangerMid : C.brandVibrant] as any,
  });
  const shadowOpacity = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] });

  return (
    <RNAnimated.View style={[fieldS.wrap, { transform: [{ translateX: shake }] }]}>
      <View style={fieldS.labelRow}>
        {icon && <Ionicons name={icon as any} size={14} color={focused ? (iconColor || C.brandVibrant) : C.textMuted} />}
        <Text style={fieldS.label}>{label}{required && <Text style={{ color: C.dangerMid }}> *</Text>}</Text>
      </View>
      <RNAnimated.View style={[fieldS.inputBox, { borderColor, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity, shadowRadius: 6, elevation: focused ? 2 : 0 }, !editable && fieldS.disabled]}>
        {prefix && <Text style={fieldS.prefix}>{prefix}</Text>}
        <TextInput
          style={[fieldS.input, multiline && { height: numberOfLines * 22 + 20, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textPlaceholder}
          keyboardType={keyboardType}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </RNAnimated.View>
      {(error || helper) && (
        <View style={fieldS.helperRow}>
          <Ionicons name={error ? 'alert-circle' : 'information-circle'} size={12} color={error ? C.dangerMid : C.textMuted} />
          <Text style={[fieldS.helperText, error && { color: C.dangerMid }]}>{error || helper}</Text>
        </View>
      )}
    </RNAnimated.View>
  );
};

const fieldS = StyleSheet.create({
  wrap: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7 },
  label: { fontSize: 12, fontWeight: '700', color: C.textSec, letterSpacing: 0.1 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 13, paddingHorizontal: 13, borderWidth: 1.5, minHeight: 48 },
  disabled: { backgroundColor: '#f4f3f8', opacity: 0.7 },
  prefix: { fontSize: 14, color: C.textMuted, marginRight: 6, fontWeight: '600' },
  input: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 13, fontWeight: '500' },
  helperRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, marginLeft: 2 },
  helperText: { fontSize: 11, color: C.textMuted },
});

// ─── Picker Field ─────────────────────────────────────────────────
const PickerField: React.FC<{
  label: string; value: string; onValueChange: (v: string) => void;
  items: { label: string; value: string }[]; error?: string; required?: boolean; icon?: string; placeholder?: string;
}> = ({ label, value, onValueChange, items, error, required, icon, placeholder }) => (
  <View style={pickerS.wrap}>
    <View style={fieldS.labelRow}>
      {icon && <Ionicons name={icon as any} size={14} color={C.textMuted} />}
      <Text style={fieldS.label}>{label}{required && <Text style={{ color: C.dangerMid }}> *</Text>}</Text>
    </View>
    <View style={[pickerS.box, error && { borderColor: C.dangerMid }]}>
      <Picker selectedValue={value} onValueChange={onValueChange} style={pickerS.picker} dropdownIconColor={C.textMuted}>
        <Picker.Item label={placeholder || `Seleccione ${label.toLowerCase()}`} value="" color={C.textPlaceholder} />
        {items.map(i => <Picker.Item key={i.value} label={i.label} value={i.value} />)}
      </Picker>
    </View>
    {error && (
      <View style={fieldS.helperRow}>
        <Ionicons name="alert-circle" size={12} color={C.dangerMid} />
        <Text style={[fieldS.helperText, { color: C.dangerMid }]}>{error}</Text>
      </View>
    )}
  </View>
);

const pickerS = StyleSheet.create({
  wrap: { marginBottom: 14 },
  box: { backgroundColor: C.surface, borderRadius: 13, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden' },
  picker: { height: 50, color: C.text },
});

// ─── Section Card ─────────────────────────────────────────────────
const SectionCard: React.FC<{
  title: string; icon: string; children: React.ReactNode;
  expanded: boolean; onToggle: () => void; badge?: string | number; badgeColor?: string;
  index?: number;
}> = ({ title, icon, children, expanded, onToggle, badge, badgeColor, index = 0 }) => {
  const rotateAnim = useRef(new RNAnimated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    RNAnimated.timing(rotateAnim, { toValue: expanded ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [expanded]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 40).springify()} style={secS.card}>
      <TouchableOpacity style={secS.header} onPress={onToggle} activeOpacity={0.75}>
        <View style={secS.iconWrap}>
          <Ionicons name={icon as any} size={17} color={C.brandVibrant} />
        </View>
        <Text style={secS.title}>{title}</Text>
        {badge !== undefined && (
          <View style={[secS.badge, { backgroundColor: badgeColor || C.brandFaint }]}>
            <Text style={[secS.badgeText, { color: badgeColor ? '#fff' : C.brandVibrant }]}>{badge}</Text>
          </View>
        )}
        <RNAnimated.View style={{ transform: [{ rotate }], marginLeft: 'auto' }}>
          <Ionicons name="chevron-down" size={18} color={C.textMuted} />
        </RNAnimated.View>
      </TouchableOpacity>
      {expanded && (
        <Animated.View entering={FadeIn.duration(180)} style={secS.body}>
          <View style={secS.divider} />
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const secS = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.brandFaint, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16, marginBottom: 16 },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
});

// ─── Toggle Switch Row ────────────────────────────────────────────
const ToggleRow: React.FC<{ label: string; sub?: string; icon: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, sub, icon, value, onChange }) => (
  <View style={toggleS.row}>
    <View style={[toggleS.iconWrap, { backgroundColor: value ? C.brandFaint : '#f4f3f8' }]}>
      <Ionicons name={icon as any} size={16} color={value ? C.brandVibrant : C.textMuted} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={toggleS.label}>{label}</Text>
      {sub && <Text style={toggleS.sub}>{sub}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(v); }}
      trackColor={{ false: '#e5e3ef', true: C.brandLight }}
      thumbColor={value ? C.brandVibrant : '#fff'}
      ios_backgroundColor="#e5e3ef"
    />
  </View>
);

const toggleS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: C.text },
  sub: { fontSize: 11, color: C.textMuted, marginTop: 1 },
});

// ─── Loan Type Picker Cards ───────────────────────────────────────
const LoanTypeGrid: React.FC<{ value: string; onSelect: (id: string) => void; error?: string }> = ({ value, onSelect, error }) => (
  <View>
    <View style={ltS.grid}>
      {MOCK_LOAN_TYPES.map(t => {
        const active = value === t.id;
        return (
          <TouchableOpacity key={t.id} style={[ltS.card, active && ltS.cardActive]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(t.id); }} activeOpacity={0.75}>
            <View style={[ltS.iconRing, { backgroundColor: active ? C.brandVibrant : C.brandFaint }]}>
              <Ionicons name={t.icon as any} size={18} color={active ? '#fff' : C.brandVibrant} />
            </View>
            <Text style={[ltS.name, active && { color: C.brandVibrant }]}>{t.name}</Text>
            <Text style={ltS.interest}>{t.defaultInterest}% int.</Text>
            {active && <View style={ltS.checkDot}><Ionicons name="checkmark" size={10} color="#fff" /></View>}
          </TouchableOpacity>
        );
      })}
    </View>
    {error && (
      <View style={[fieldS.helperRow, { marginTop: 6 }]}>
        <Ionicons name="alert-circle" size={12} color={C.dangerMid} />
        <Text style={[fieldS.helperText, { color: C.dangerMid }]}>{error}</Text>
      </View>
    )}
  </View>
);

const ltS = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  card: { width: (SW - 32 - 32 - 8) / 2 - 4, backgroundColor: '#f9f8fd', borderRadius: 13, padding: 12, borderWidth: 1.5, borderColor: C.border, position: 'relative' },
  cardActive: { borderColor: C.brandVibrant, backgroundColor: C.brandFaint },
  iconRing: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  name: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  interest: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  checkDot: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: C.brandVibrant, alignItems: 'center', justifyContent: 'center' },
});

// ─── Priority Selector ────────────────────────────────────────────
const PrioritySelector: React.FC<{ value: FormData['priority']; onChange: (v: FormData['priority']) => void }> = ({ value, onChange }) => (
  <View style={prioS.row}>
    {(['high', 'medium', 'low'] as const).map(p => {
      const cfg = PRIORITY_CONFIG[p];
      const active = value === p;
      return (
        <TouchableOpacity key={p} style={[prioS.btn, active && { backgroundColor: cfg.bg, borderColor: cfg.color }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(p); }} activeOpacity={0.75}>
          <Ionicons name={cfg.icon as any} size={14} color={active ? cfg.color : C.textMuted} />
          <Text style={[prioS.label, active && { color: cfg.color }]}>{active ? cfg.label : p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const prioS = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f4f3f8', borderWidth: 1.5, borderColor: 'transparent' },
  label: { fontSize: 11, fontWeight: '700', color: C.textMuted },
});

// ─── Loan Info Banner ─────────────────────────────────────────────
const LoanInfoBanner: React.FC<{ type: LoanTypeOption }> = ({ type }) => (
  <View style={bannerS.wrap}>
    <View style={bannerS.row}>
      <View style={bannerS.item}>
        <Text style={bannerS.key}>Mín.</Text>
        <Text style={bannerS.val}>RD${type.minAmount.toLocaleString()}</Text>
      </View>
      <View style={bannerS.div} />
      <View style={bannerS.item}>
        <Text style={bannerS.key}>Máx.</Text>
        <Text style={bannerS.val}>RD${type.maxAmount.toLocaleString()}</Text>
      </View>
      <View style={bannerS.div} />
      <View style={bannerS.item}>
        <Text style={bannerS.key}>Interés</Text>
        <Text style={bannerS.val}>{type.defaultInterest}%</Text>
      </View>
      <View style={bannerS.div} />
      <View style={bannerS.item}>
        <Text style={bannerS.key}>Plazo def.</Text>
        <Text style={bannerS.val}>{type.defaultTerm} {type.category === 'san' ? 'd' : 'm'}</Text>
      </View>
    </View>
  </View>
);

const bannerS = StyleSheet.create({
  wrap: { backgroundColor: C.infoBg, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(3,105,161,0.12)' },
  row: { flexDirection: 'row', alignItems: 'center' },
  item: { flex: 1, alignItems: 'center' },
  div: { width: 1, height: 28, backgroundColor: 'rgba(3,105,161,0.15)' },
  key: { fontSize: 9, color: C.infoMid, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  val: { fontSize: 13, color: C.info, fontWeight: '800' },
});

// ─── Summary Card ─────────────────────────────────────────────────
const SummaryCard: React.FC<{ formData: FormData; loanType?: LoanTypeOption }> = ({ formData, loanType }) => {
  if (!formData.amount || parseFloat(formData.amount) <= 0) return null;
  const rows = [
    { key: 'Cliente', val: formData.clientName || '—', icon: 'person-outline' },
    { key: 'Tipo', val: loanType?.name || '—', icon: 'options-outline' },
    { key: 'Monto', val: fmtCurrency(formData.amount), icon: 'cash-outline', bold: true, color: C.brandVibrant },
    { key: 'Plazo', val: formData.term ? `${formData.term} ${loanType?.category === 'san' ? 'días' : 'meses'}` : '—', icon: 'calendar-outline' },
    { key: 'Prioridad', val: PRIORITY_CONFIG[formData.priority].label, icon: 'flag-outline', color: PRIORITY_CONFIG[formData.priority].color },
  ];

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()}>
      <LinearGradient colors={[C.brandMid, C.brandVibrant]} style={sumS.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={sumS.header}>
          <Ionicons name="checkmark-shield" size={20} color="rgba(255,255,255,0.9)" />
          <Text style={sumS.title}>Resumen de solicitud</Text>
        </View>
        {rows.map(r => (
          <View key={r.key} style={sumS.row}>
            <View style={sumS.rowLeft}>
              <Ionicons name={r.icon as any} size={13} color="rgba(255,255,255,0.55)" />
              <Text style={sumS.key}>{r.key}</Text>
            </View>
            <Text style={[sumS.val, r.bold && sumS.valBold, r.color && { color: 'rgba(255,255,255,0.95)' }]}>{r.val}</Text>
          </View>
        ))}
      </LinearGradient>
    </Animated.View>
  );
};

const sumS = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  title: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.95)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  key: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  val: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  valBold: { fontSize: 16, fontWeight: '900', color: '#fff' },
});

// ─── Client Modal ─────────────────────────────────────────────────
const ClientModal: React.FC<{
  visible: boolean; onClose: () => void;
  onSelect: (c: ClientOption) => void; onNewClient: () => void;
  selectedId?: string;
}> = ({ visible, onClose, onSelect, onNewClient, selectedId }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={cliS.overlay}>
      <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
      <Animated.View entering={SlideInDown.springify()} style={cliS.sheet}>
        <View style={cliS.handle} />
        <View style={cliS.sheetHeader}>
          <Text style={cliS.sheetTitle}>Seleccionar cliente</Text>
          <TouchableOpacity onPress={onClose} style={cliS.closeBtn}>
            <Ionicons name="close" size={18} color={C.textSec} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {MOCK_CLIENTS.map((c, i) => {
            const [col1, col2] = AVATAR_PALETTES[i % AVATAR_PALETTES.length];
            const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
            const active = selectedId === c.id;
            return (
              <TouchableOpacity key={c.id} style={[cliS.item, active && cliS.itemActive]} onPress={() => onSelect(c)} activeOpacity={0.78}>
                <View style={{ width: 44, height: 44, borderRadius: 13, overflow: 'hidden' }}>
                  <LinearGradient colors={[col1, col2]} style={StyleSheet.absoluteFillObject} />
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{initials}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={cliS.clientName}>{c.name}</Text>
                  <Text style={cliS.clientPhone}>{c.phone}{c.documentId ? ` · ${c.documentId}` : ''}</Text>
                </View>
                {active && <View style={cliS.checkMark}><Ionicons name="checkmark" size={14} color="#fff" /></View>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity style={cliS.newBtn} onPress={onNewClient} activeOpacity={0.82}>
          <LinearGradient colors={[C.brandVibrant, C.brandMid]} style={cliS.newBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="person-add" size={17} color="#fff" />
            <Text style={cliS.newBtnText}>Registrar nuevo cliente</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  </Modal>
);

const cliS = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,5,25,0.5)' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 36 },
  handle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, marginBottom: 4 },
  itemActive: { backgroundColor: C.brandFaint },
  clientName: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  clientPhone: { fontSize: 11, color: C.textMuted },
  checkMark: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.brandVibrant, alignItems: 'center', justifyContent: 'center' },
  newBtn: { marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  newBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  newBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ─── Progress Steps ───────────────────────────────────────────────
const STEPS = ['Cliente', 'Préstamo', 'Finanzas', 'Garantías', 'Extra'];

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <View style={progS.wrap}>
    <View style={progS.track}>
      <View style={[progS.fill, { width: `${((current) / total) * 100}%` as any }]} />
    </View>
    <Text style={progS.label}>{current}/{total} secciones</Text>
  </View>
);

const progS = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 14 },
  track: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', minWidth: 60, textAlign: 'right' },
});

// ─── Main Screen ──────────────────────────────────────────────────
export const LoanRequestFormScreen: React.FC<LoanRequestFormScreenProps> = ({ route, navigation }) => {
  const { requestId } = (route.params || {}) as any;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  const [sections, setSections] = useState({
    client: true, loan: true, financial: false, guarantor: false, collateral: false, additional: false,
  });

  const [form, setForm] = useState<FormData>({
    clientId: '', clientName: '', clientPhone: '', clientEmail: '', clientDocument: '',
    isNewClient: false, loanType: '', amount: '', term: '', purpose: '',
    priority: 'medium', monthlyIncome: '', employmentStatus: '', employer: '',
    yearsEmployed: '', hasGuarantor: false, guarantorName: '', guarantorPhone: '',
    guarantorRelationship: '', hasCollateral: false, collateralType: '', collateralValue: '',
    collateralDescription: '', notes: '', notifyWhenApproved: true, notifyWhenRejected: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    if (requestId) loadRequest();
  }, []);

  const loadRequest = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setForm(prev => ({
      ...prev, clientId: '1', clientName: 'Juan Rodríguez Méndez', clientPhone: '809-555-1234',
      clientEmail: 'juan@email.com', clientDocument: '402-1234567-8', loanType: '2',
      amount: '15000', term: '30', purpose: 'Capital de trabajo para negocio', priority: 'high',
      monthlyIncome: '45000', employmentStatus: 'self_employed', employer: 'Negocio propio',
      yearsEmployed: '5', hasGuarantor: true, guarantorName: 'María Pérez',
      guarantorPhone: '809-555-5678', guarantorRelationship: 'Hermana',
      notes: 'Cliente VIP, buen historial',
    }));
    setLoading(false);
  };

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const toggle = (section: keyof typeof sections) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLoanType = (id: string) => {
    const t = MOCK_LOAN_TYPES.find(x => x.id === id);
    setForm(prev => ({ ...prev, loanType: id, term: t ? t.defaultTerm.toString() : prev.term }));
    if (errors.loanType) setErrors(prev => ({ ...prev, loanType: undefined }));
  };

  const handleSelectClient = (c: ClientOption) => {
    setForm(prev => ({ ...prev, clientId: c.id, clientName: c.name, clientPhone: c.phone, clientEmail: c.email || '', clientDocument: c.documentId || '', isNewClient: false }));
    setShowClientModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (errors.clientName) setErrors(prev => ({ ...prev, clientName: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.clientId && !form.isNewClient) e.clientName = 'Seleccione o registre un cliente';
    if (form.isNewClient && !form.clientName.trim()) e.clientName = 'Nombre requerido';
    if (form.isNewClient && !form.clientPhone.trim()) e.clientPhone = 'Teléfono requerido';
    if (!form.loanType) e.loanType = 'Seleccione un tipo de préstamo';
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Ingrese un monto válido';
    if (!form.term || parseInt(form.term) <= 0) e.term = 'Ingrese un plazo válido';
    if (!form.purpose.trim()) e.purpose = 'Describa el propósito del préstamo';
    if (form.hasGuarantor && !form.guarantorName.trim()) e.guarantorName = 'Nombre del codeudor requerido';
    if (form.hasCollateral && !form.collateralType) e.collateralType = 'Seleccione tipo de garantía';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Auto-expand sections with errors
      const hasClientErr = errors.clientName || errors.clientPhone;
      const hasLoanErr = errors.loanType || errors.amount || errors.term || errors.purpose;
      const hasGuarantorErr = errors.guarantorName;
      const hasCollateralErr = errors.collateralType;
      setSections(prev => ({
        ...prev,
        client: hasClientErr ? true : prev.client,
        loan: hasLoanErr ? true : prev.loan,
        guarantor: hasGuarantorErr ? true : prev.guarantor,
        collateral: hasCollateralErr ? true : prev.collateral,
      }));
      Alert.alert('Campos incompletos', 'Revisa los campos marcados en rojo antes de continuar.');
      return;
    }
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 1400));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Solicitud enviada', requestId ? 'La solicitud fue actualizada.' : 'La solicitud fue enviada para revisión.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo procesar la solicitud. Intenta de nuevo.');
    } finally { setSaving(false); }
  };

  const selectedLoanType = MOCK_LOAN_TYPES.find(t => t.id === form.loanType);
  const openSections = Object.values(sections).filter(Boolean).length;

  const navOpacity = scrollY.interpolate({ inputRange: [0, 70], outputRange: [0, 1], extrapolate: 'clamp' });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <LinearGradient colors={[C.brand, C.brandMid, C.brandVibrant]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View entering={ZoomIn.duration(350)} style={{ alignItems: 'center' }}>
            <View style={{ width: 76, height: 76, borderRadius: 22, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: C.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20, elevation: 8 }}>
              <Ionicons name="document-text" size={36} color={C.brandVibrant} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 16 }}>Cargando solicitud…</Text>
            <ActivityIndicator size="large" color={C.brandVibrant} />
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Sticky nav */}
      <RNAnimated.View style={[s.floatNav, { opacity: navOpacity }]} pointerEvents="box-none">
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={s.floatRow}>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.floatTitle}>{requestId ? 'Editar solicitud' : 'Nueva solicitud'}</Text>
          <TouchableOpacity style={[s.navBtn, { backgroundColor: saving ? C.brandFaint : C.bg }]} onPress={handleSubmit} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={C.brandVibrant} /> : <Ionicons name="checkmark" size={20} color={C.brandVibrant} />}
          </TouchableOpacity>
        </View>
      </RNAnimated.View>

      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <LinearGradient colors={[C.brand, C.brandMid, C.brandVibrant]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
          <View style={s.decCircle1} /><View style={s.decCircle2} />
          <View style={s.headerTop}>
            <TouchableOpacity style={s.navBtnWhite} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={s.headerLabel}>{requestId ? 'EDICIÓN' : 'NUEVA SOLICITUD'}</Text>
              <Text style={s.headerTitle}>{requestId ? 'Editar solicitud' : 'Solicitud de préstamo'}</Text>
            </View>
            <TouchableOpacity style={[s.navBtnWhite, saving && { opacity: 0.5 }]} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.headerSub}>
            <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={s.headerSubText}>Los campos marcados con <Text style={{ color: '#fbbf24' }}>*</Text> son obligatorios</Text>
          </Animated.View>
          <ProgressBar current={openSections} total={Object.keys(sections).length} />
        </LinearGradient>

        <View style={s.body}>

          {/* ─── 1. Cliente ──────────────────────────── */}
          <SectionCard title="Información del cliente" icon="person-outline" expanded={sections.client} onToggle={() => toggle('client')} badge={form.clientName ? '✓' : undefined} badgeColor={C.successMid} index={0}>
            <ToggleRow label="Cliente nuevo" sub="Registrar uno que no existe" icon="person-add-outline" value={form.isNewClient} onChange={v => set('isNewClient', v)} />
            <View style={s.divider} />

            {!form.isNewClient ? (
              <>
                <TouchableOpacity style={[s.clientPicker, form.clientId && s.clientPickerFilled]} onPress={() => setShowClientModal(true)} activeOpacity={0.8}>
                  {form.clientId ? (
                    <View style={s.clientPickerRow}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden' }}>
                        <LinearGradient colors={AVATAR_PALETTES[0]} style={StyleSheet.absoluteFillObject} />
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                            {form.clientName.split(' ').map(w => w[0]).slice(0, 2).join('')}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.clientPickerName}>{form.clientName}</Text>
                        <Text style={s.clientPickerPhone}>{form.clientPhone}</Text>
                      </View>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.successBg, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark" size={14} color={C.successMid} />
                      </View>
                    </View>
                  ) : (
                    <View style={s.clientPickerRow}>
                      <View style={s.clientPickerIcon}>
                        <Ionicons name="person-outline" size={20} color={C.brandVibrant} />
                      </View>
                      <Text style={s.clientPickerPlaceholder}>Seleccionar cliente existente</Text>
                      <Ionicons name="chevron-down" size={16} color={C.textMuted} />
                    </View>
                  )}
                </TouchableOpacity>
                {errors.clientName && (
                  <View style={[fieldS.helperRow, { marginTop: 6 }]}>
                    <Ionicons name="alert-circle" size={12} color={C.dangerMid} />
                    <Text style={[fieldS.helperText, { color: C.dangerMid }]}>{errors.clientName}</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <FieldInput label="Nombre completo" value={form.clientName} onChangeText={v => set('clientName', v)} placeholder="Ej: Juan Pérez García" icon="person-outline" error={errors.clientName} required />
                <FieldInput label="Teléfono" value={form.clientPhone} onChangeText={v => set('clientPhone', v)} placeholder="Ej: 809-555-1234" keyboardType="phone-pad" icon="call-outline" error={errors.clientPhone} required />
                <FieldInput label="Email" value={form.clientEmail} onChangeText={v => set('clientEmail', v)} placeholder="cliente@email.com" keyboardType="email-address" icon="mail-outline" />
                <FieldInput label="Cédula / Pasaporte" value={form.clientDocument} onChangeText={v => set('clientDocument', v)} placeholder="402-1234567-8" icon="card-outline" />
              </>
            )}
          </SectionCard>

          {/* ─── 2. Préstamo ─────────────────────────── */}
          <SectionCard title="Detalles del préstamo" icon="cash-outline" expanded={sections.loan} onToggle={() => toggle('loan')} badge={form.amount ? fmtCurrency(form.amount).replace('RD$', '') : undefined} index={1}>
            <Text style={s.subLabel}>Tipo de préstamo *</Text>
            <LoanTypeGrid value={form.loanType} onSelect={handleLoanType} error={errors.loanType} />

            {selectedLoanType && <LoanInfoBanner type={selectedLoanType} />}

            <FieldInput label="Monto solicitado" value={form.amount} onChangeText={v => set('amount', v)} placeholder="Ej: 25000" keyboardType="numeric" prefix="RD$" icon="cash-outline" error={errors.amount} required helper={selectedLoanType ? `Límite: RD$${selectedLoanType.minAmount.toLocaleString()} – RD$${selectedLoanType.maxAmount.toLocaleString()}` : undefined} />
            <FieldInput label={selectedLoanType?.category === 'san' ? 'Plazo (días)' : 'Plazo (meses)'} value={form.term} onChangeText={v => set('term', v)} placeholder={selectedLoanType?.category === 'san' ? 'Ej: 30' : 'Ej: 12'} keyboardType="numeric" icon="calendar-outline" error={errors.term} required />
            <FieldInput label="Propósito del préstamo" value={form.purpose} onChangeText={v => set('purpose', v)} placeholder="Describa el uso que dará al préstamo…" multiline numberOfLines={3} icon="create-outline" error={errors.purpose} required />

            <Text style={[s.subLabel, { marginTop: 2 }]}>Prioridad</Text>
            <PrioritySelector value={form.priority} onChange={v => set('priority', v)} />
          </SectionCard>

          {/* ─── 3. Información financiera ───────────── */}
          <SectionCard title="Información financiera" icon="trending-up-outline" expanded={sections.financial} onToggle={() => toggle('financial')} index={2}>
            <FieldInput label="Ingreso mensual" value={form.monthlyIncome} onChangeText={v => set('monthlyIncome', v)} placeholder="Ej: 35000" keyboardType="numeric" prefix="RD$" icon="wallet-outline" helper="Ingreso neto mensual aproximado" />
            <PickerField label="Situación laboral" value={form.employmentStatus} onValueChange={v => set('employmentStatus', v)} items={EMPLOYMENT_STATUS.map(e => ({ label: e.name, value: e.id }))} icon="briefcase-outline" placeholder="Seleccione situación" />
            <FieldInput label="Empleador / Negocio" value={form.employer} onChangeText={v => set('employer', v)} placeholder="Nombre del empleador o negocio" icon="business-outline" />
            <FieldInput label="Años en empleo actual" value={form.yearsEmployed} onChangeText={v => set('yearsEmployed', v)} placeholder="Ej: 3" keyboardType="numeric" icon="time-outline" />
          </SectionCard>

          {/* ─── 4. Codeudor ─────────────────────────── */}
          <SectionCard title="Codeudor / Aval" icon="people-outline" expanded={sections.guarantor} onToggle={() => toggle('guarantor')} badge={form.hasGuarantor ? 'Activo' : undefined} badgeColor={form.hasGuarantor ? C.successMid : undefined} index={3}>
            <ToggleRow label="Incluir codeudor" sub="Responsable solidario del préstamo" icon="shield-checkmark-outline" value={form.hasGuarantor} onChange={v => set('hasGuarantor', v)} />
            {form.hasGuarantor && (
              <Animated.View entering={FadeIn.duration(200)}>
                <View style={s.divider} />
                <View style={s.infoBox}>
                  <Ionicons name="information-circle" size={15} color={C.infoMid} />
                  <Text style={s.infoText}>El codeudor asumirá responsabilidad solidaria ante cualquier incumplimiento.</Text>
                </View>
                <FieldInput label="Nombre completo" value={form.guarantorName} onChangeText={v => set('guarantorName', v)} placeholder="Nombre del codeudor" icon="person-outline" error={errors.guarantorName} required />
                <FieldInput label="Teléfono" value={form.guarantorPhone} onChangeText={v => set('guarantorPhone', v)} placeholder="Teléfono de contacto" keyboardType="phone-pad" icon="call-outline" />
                <FieldInput label="Relación con el cliente" value={form.guarantorRelationship} onChangeText={v => set('guarantorRelationship', v)} placeholder="Ej: Familiar, Amigo, Socio…" icon="git-network-outline" />
              </Animated.View>
            )}
          </SectionCard>

          {/* ─── 5. Garantía ─────────────────────────── */}
          <SectionCard title="Garantía / Colateral" icon="shield-outline" expanded={sections.collateral} onToggle={() => toggle('collateral')} badge={form.hasCollateral ? 'Activa' : undefined} badgeColor={form.hasCollateral ? C.infoMid : undefined} index={4}>
            <ToggleRow label="Incluir garantía" sub="Bien que respalda el préstamo" icon="lock-closed-outline" value={form.hasCollateral} onChange={v => set('hasCollateral', v)} />
            {form.hasCollateral && (
              <Animated.View entering={FadeIn.duration(200)}>
                <View style={s.divider} />
                <PickerField label="Tipo de garantía" value={form.collateralType} onValueChange={v => set('collateralType', v)} items={COLLATERAL_TYPES.map(t => ({ label: t.name, value: t.id }))} icon="shield-outline" error={errors.collateralType} required placeholder="Seleccione tipo" />
                <FieldInput label="Valor estimado" value={form.collateralValue} onChangeText={v => set('collateralValue', v)} placeholder="Valor de la garantía" keyboardType="numeric" prefix="RD$" icon="pricetag-outline" />
                <FieldInput label="Descripción" value={form.collateralDescription} onChangeText={v => set('collateralDescription', v)} placeholder="Describa el bien dado en garantía…" multiline numberOfLines={3} icon="document-text-outline" />
              </Animated.View>
            )}
          </SectionCard>

          {/* ─── 6. Adicional ────────────────────────── */}
          <SectionCard title="Información adicional" icon="ellipsis-horizontal-circle-outline" expanded={sections.additional} onToggle={() => toggle('additional')} index={5}>
            <FieldInput label="Notas" value={form.notes} onChangeText={v => set('notes', v)} placeholder="Observaciones o información adicional relevante…" multiline numberOfLines={4} icon="create-outline" helper="Opcional — visible solo para el equipo" />
            <View style={s.divider} />
            <ToggleRow label="Notificar al aprobar" sub="Recibirás una alerta cuando sea aprobada" icon="checkmark-circle-outline" value={form.notifyWhenApproved} onChange={v => set('notifyWhenApproved', v)} />
            <ToggleRow label="Notificar al rechazar" sub="Recibirás una alerta si es rechazada" icon="close-circle-outline" value={form.notifyWhenRejected} onChange={v => set('notifyWhenRejected', v)} />
          </SectionCard>

          {/* ─── Resumen ──────────────────────────────── */}
          <SummaryCard formData={form} loanType={selectedLoanType} />

          {/* ─── Botones ──────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()} disabled={saving} activeOpacity={0.75}>
              <Ionicons name="close" size={16} color={C.textSec} />
              <Text style={s.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.submitBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving} activeOpacity={0.88}>
              <LinearGradient colors={[C.brandLight, C.brandVibrant, C.brandMid]} style={s.submitGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={17} color="#fff" />
                    <Text style={s.submitText}>{requestId ? 'Actualizar' : 'Enviar solicitud'}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 48 }} />
        </View>
      </RNAnimated.ScrollView>

      <ClientModal visible={showClientModal} onClose={() => setShowClientModal(false)} onSelect={handleSelectClient} onNewClient={() => { setShowClientModal(false); set('isNewClient', true); }} selectedId={form.clientId} />
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  floatNav: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99, height: 94, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  floatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  floatTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  header: { paddingTop: 56, overflow: 'hidden' },
  decCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40 },
  decCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 20, left: -20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 16 },
  navBtnWhite: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  headerSub: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginBottom: 14 },
  headerSubText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  body: { padding: 12, paddingTop: 14 },

  subLabel: { fontSize: 12, fontWeight: '700', color: C.textSec, marginBottom: 8, letterSpacing: 0.1 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.infoBg, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(3,105,161,0.12)' },
  infoText: { fontSize: 12, color: C.info, flex: 1, lineHeight: 18 },

  clientPicker: { backgroundColor: '#f4f3f8', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: C.border, marginBottom: 2 },
  clientPickerFilled: { backgroundColor: C.brandFaint, borderColor: C.borderStrong },
  clientPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clientPickerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  clientPickerPlaceholder: { flex: 1, fontSize: 14, color: C.textPlaceholder, fontWeight: '500' },
  clientPickerName: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 1 },
  clientPickerPhone: { fontSize: 11, color: C.textMuted },

  actions: { flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: 6 },
  cancelBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 15, borderRadius: 15, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  cancelText: { fontSize: 14, fontWeight: '700', color: C.textSec },
  submitBtn: { flex: 2.5, borderRadius: 15, overflow: 'hidden', shadowColor: C.brandVibrant, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  submitText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});