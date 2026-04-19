import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Switch,
  Animated,
  Modal,
  FlatList,
  Platform,
  Pressable,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '../../services/authService';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';

// ─── Design System (idéntico al resto de la app) ──────────────────────────────
const DS = {
  colors: {
    grad0: '#3b0764',
    grad1: '#5b21b6',
    grad2: '#6d28d9',
    grad3: '#7c3aed',
    accent: '#a78bfa',
    accentSoft: '#ede9fe',
    surface: '#f5f3ff',
    surfaceCard: '#ffffff',
    text: '#1e1b4b',
    textSub: '#4b5563',
    textMuted: '#94a3b8',
    border: 'rgba(0,0,0,0.07)',
    borderActive: '#7c3aed',
    success: '#059669',
    successBg: '#ecfdf5',
    danger: '#dc2626',
    dangerBg: '#fef2f2',
    warning: '#d97706',
    warningBg: '#fffbeb',
    info: '#0284c7',
    infoBg: '#f0f9ff',
    white: '#ffffff',
    overlayDark: 'rgba(0,0,0,0.45)',
    overlayLight: 'rgba(255,255,255,0.13)',
  },
  font: { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, title: 26 },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 },
  radius: { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 },
};

const GRAD_HEADER = [DS.colors.grad0, DS.colors.grad2] as const;
const GRAD_AVATAR = [DS.colors.accent, DS.colors.grad3] as const;
const GRAD_BTN    = [DS.colors.grad3, DS.colors.grad1] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type ProfileScreenTabProp  = BottomTabNavigationProp<MainTabParamList, 'Profile'>;
type ProfileScreenStackProp = StackNavigationProp<RootStackParamList, 'MainDrawer'>;
type ProfileScreenNavigationProp = CompositeNavigationProp<ProfileScreenTabProp, ProfileScreenStackProp>;
interface ProfileScreenProps { navigation: ProfileScreenNavigationProp; }

// ─── Data & helpers ───────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'DOP', symbol: 'RD$', name: 'Peso Dominicano' },
  { code: 'USD', symbol: '$',   name: 'Dólar Americano' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
  { code: 'MXN', symbol: '$',   name: 'Peso Mexicano' },
  { code: 'COP', symbol: '$',   name: 'Peso Colombiano' },
  { code: 'PEN', symbol: 'S/',  name: 'Sol Peruano' },
  { code: 'GTQ', symbol: 'Q',   name: 'Quetzal Guatemalteco' },
  { code: 'HNL', symbol: 'L',   name: 'Lempira Hondureño' },
];

const FREQ_OPTIONS = ['Diario', 'Semanal', 'Quincenal', 'Mensual'];
const INTEREST_TYPE = ['Fijo', 'Decreciente', 'Simple', 'Compuesto'];
const PENALTY_TYPE  = ['Porcentaje diario', 'Monto fijo', 'Sin mora'];

type Section = 'perfil' | 'empresa' | 'prestamos' | 'recibos' | 'seguridad' | null;

// ─── Reusable UI pieces ───────────────────────────────────────────────────────
const SectionHeader = ({ icon, label, color = DS.colors.grad2 }: { icon: string; label: string; color?: string }) => (
  <View style={st.sectionHeader}>
    <View style={[st.sectionIconWrap, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon as any} size={16} color={color} />
    </View>
    <Text style={st.sectionTitle}>{label}</Text>
  </View>
);

const FieldRow = ({
  label, value, onEdit, suffix, mono = false,
}: { label: string; value: string; onEdit?: () => void; suffix?: string; mono?: boolean }) => (
  <View style={st.fieldRow}>
    <Text style={st.fieldLabel}>{label}</Text>
    <TouchableOpacity style={st.fieldValueRow} onPress={onEdit} activeOpacity={onEdit ? 0.7 : 1}>
      <Text style={[st.fieldValue, mono && st.fieldValueMono]} numberOfLines={1}>{value}</Text>
      {suffix && <Text style={st.fieldSuffix}>{suffix}</Text>}
      {onEdit && <Ionicons name="chevron-forward" size={14} color={DS.colors.textMuted} />}
    </TouchableOpacity>
  </View>
);

const ToggleRow = ({
  label, desc, value, onChange, color = DS.colors.grad3,
}: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void; color?: string }) => (
  <View style={st.toggleRow}>
    <View style={{ flex: 1, marginRight: DS.space.md }}>
      <Text style={st.fieldLabel}>{label}</Text>
      {desc && <Text style={st.toggleDesc}>{desc}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(v); }}
      trackColor={{ false: DS.colors.border, true: color + '60' }}
      thumbColor={value ? color : '#d1d5db'}
      ios_backgroundColor={DS.colors.border}
    />
  </View>
);

const NumberInput = ({
  label, value, onChange, suffix, min = 0, max = 9999, step = 1,
}: { label: string; value: number; onChange: (v: number) => void; suffix?: string; min?: number; max?: number; step?: number }) => (
  <View style={st.numberRow}>
    <Text style={[st.fieldLabel, { flex: 1 }]}>{label}</Text>
    <View style={st.numberCtrl}>
      <TouchableOpacity
        style={st.numberBtn}
        onPress={() => { const n = Math.max(min, value - step); onChange(n); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      >
        <Ionicons name="remove" size={16} color={DS.colors.grad3} />
      </TouchableOpacity>
      <View style={st.numberValWrap}>
        <Text style={st.numberVal}>{value}</Text>
        {suffix && <Text style={st.numberSuffix}>{suffix}</Text>}
      </View>
      <TouchableOpacity
        style={st.numberBtn}
        onPress={() => { const n = Math.min(max, value + step); onChange(n); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      >
        <Ionicons name="add" size={16} color={DS.colors.grad3} />
      </TouchableOpacity>
    </View>
  </View>
);

const ChipSelect = ({
  options, value, onChange,
}: { options: string[]; value: string; onChange: (v: string) => void }) => (
  <View style={st.chipRow}>
    {options.map((opt) => {
      const active = opt === value;
      return (
        <TouchableOpacity
          key={opt}
          style={[st.chip, active && st.chipActive]}
          onPress={() => { onChange(opt); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          activeOpacity={0.75}
        >
          {active && (
            <LinearGradient colors={GRAD_BTN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: DS.radius.pill }]} />
          )}
          <Text style={[st.chipTxt, active && st.chipTxtActive]}>{opt}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────
const EditModal = ({
  visible, title, value, onSave, onClose, keyboardType = 'default', multiline = false,
}: {
  visible: boolean; title: string; value: string;
  onSave: (v: string) => void; onClose: () => void;
  keyboardType?: any; multiline?: boolean;
}) => {
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value, visible]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.modalOverlay} onPress={onClose}>
        <Pressable style={st.modalCard} onPress={() => {}}>
          <Text style={st.modalTitle}>{title}</Text>
          <TextInput
            style={[st.modalInput, multiline && { height: 90, textAlignVertical: 'top' }]}
            value={text}
            onChangeText={setText}
            keyboardType={keyboardType}
            autoFocus
            multiline={multiline}
          />
          <View style={st.modalBtns}>
            <TouchableOpacity style={st.modalCancel} onPress={onClose}>
              <Text style={st.modalCancelTxt}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.modalSave} onPress={() => { onSave(text); onClose(); }}>
              <LinearGradient colors={GRAD_BTN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.modalSaveGrad}>
                <Text style={st.modalSaveTxt}>Guardar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── Currency Picker Modal ────────────────────────────────────────────────────
const CurrencyModal = ({
  visible, selected, onSelect, onClose,
}: { visible: boolean; selected: string; onSelect: (c: typeof CURRENCIES[0]) => void; onClose: () => void }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={st.modalOverlay} onPress={onClose}>
      <Pressable style={[st.modalCard, { paddingHorizontal: 0, paddingBottom: 0 }]} onPress={() => {}}>
        <Text style={[st.modalTitle, { paddingHorizontal: DS.space.xl }]}>Seleccionar Moneda</Text>
        <FlatList
          data={CURRENCIES}
          keyExtractor={(i) => i.code}
          style={{ maxHeight: 360 }}
          renderItem={({ item }) => {
            const active = item.code === selected;
            return (
              <TouchableOpacity
                style={[st.currencyItem, active && st.currencyItemActive]}
                onPress={() => { onSelect(item); onClose(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                activeOpacity={0.7}
              >
                <View style={[st.symbolBadge, active && st.symbolBadgeActive]}>
                  <Text style={[st.symbolBadgeTxt, active && { color: DS.colors.white }]}>{item.symbol}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[st.currencyCode, active && { color: DS.colors.grad2 }]}>{item.code}</Text>
                  <Text style={st.currencyName}>{item.name}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={20} color={DS.colors.grad3} />}
              </TouchableOpacity>
            );
          }}
        />
        <TouchableOpacity style={st.currencyClose} onPress={onClose}>
          <Text style={st.currencyCloseTxt}>Cerrar</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  </Modal>
);

// ─── Collapsible Section ──────────────────────────────────────────────────────
const CollapseSection = ({
  id, current, title, icon, color, children, onToggle,
}: {
  id: Section; current: Section; title: string; icon: string; color?: string;
  children: React.ReactNode; onToggle: (id: Section) => void;
}) => {
  const open = current === id;
  const anim = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: open ? 1 : 0, useNativeDriver: false, tension: 80, friction: 12 }).start();
  }, [open]);

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={st.collapseCard}>
      <TouchableOpacity
        style={st.collapseHeader}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(open ? null : id); }}
        activeOpacity={0.75}
      >
        <View style={[st.collapseIconWrap, { backgroundColor: (color ?? DS.colors.grad2) + '18' }]}>
          <Ionicons name={icon as any} size={18} color={color ?? DS.colors.grad2} />
        </View>
        <Text style={st.collapseTitle}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={18} color={DS.colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>
      {open && <View style={st.collapseBody}>{children}</View>}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [openSection, setOpenSection] = useState<Section>('perfil');

  // ── Perfil ──────────────────────────────────────────────────────────────────
  const [userName,  setUserName]  = useState('Usuario Administrador');
  const [userEmail, setUserEmail] = useState('admin@dompresta.com');
  const [userPhone, setUserPhone] = useState('+1 809 555 1234');

  // ── Empresa ─────────────────────────────────────────────────────────────────
  const [companyName,    setCompanyName]    = useState('DomPresta S.R.L.');
  const [companyRNC,     setCompanyRNC]     = useState('1-31-12345-6');
  const [companyPhone,   setCompanyPhone]   = useState('+1 809 555 9000');
  const [companyAddress, setCompanyAddress] = useState('Av. 27 de Febrero #123, Santo Domingo');
  const [companyEmail,   setCompanyEmail]   = useState('info@dompresta.com');
  const [companySlogan,  setCompanySlogan]  = useState('Tu préstamo, tu futuro.');

  // ── Moneda & Formato ────────────────────────────────────────────────────────
  const [currency,        setCurrency]       = useState(CURRENCIES[0]);
  const [showCurrPicker,  setShowCurrPicker] = useState(false);
  const [decimalSep,      setDecimalSep]     = useState('.');
  const [thousandSep,     setThousandSep]    = useState(',');
  const [symbolPosition,  setSymbolPosition] = useState<'izq' | 'der'>('izq');
  const [dateFormat,      setDateFormat]     = useState('DD/MM/YYYY');

  // ── Préstamos ───────────────────────────────────────────────────────────────
  const [defaultAmount,   setDefaultAmount]   = useState(5000);
  const [defaultTerm,     setDefaultTerm]     = useState(12);
  const [defaultRate,     setDefaultRate]     = useState(5);
  const [minAmount,       setMinAmount]       = useState(1000);
  const [maxAmount,       setMaxAmount]       = useState(500000);
  const [payFreq,         setPayFreq]         = useState('Semanal');
  const [interestType,    setInterestType]    = useState('Decreciente');
  const [penaltyType,     setPenaltyType]     = useState('Porcentaje diario');
  const [penaltyRate,     setPenaltyRate]     = useState(2);
  const [graceDays,       setGraceDays]       = useState(3);
  const [autoCalcInterest, setAutoCalcInterest] = useState(true);
  const [allowPartial,    setAllowPartial]    = useState(true);
  const [requireGuarantor, setRequireGuarantor] = useState(false);

  // ── Recibos & Tickets ────────────────────────────────────────────────────────
  const [ticketFooter,    setTicketFooter]    = useState('Gracias por su preferencia. DomPresta.');
  const [showLogo,        setShowLogo]        = useState(true);
  const [showRNC,         setShowRNC]         = useState(true);
  const [showBalance,     setShowBalance]     = useState(true);
  const [showSignature,   setShowSignature]   = useState(true);
  const [copies,          setCopies]          = useState(2);
  const [paperSize,       setPaperSize]       = useState('58mm');
  const [autoPrint,       setAutoPrint]       = useState(false);

  // ── Seguridad ────────────────────────────────────────────────────────────────
  const [biometric,       setBiometric]       = useState(false);
  const [autoLock,        setAutoLock]        = useState(true);
  const [lockTimeout,     setLockTimeout]     = useState(5);
  const [twoFactor,       setTwoFactor]       = useState(false);
  const [sessionLog,      setSessionLog]      = useState(true);

  // ── Edit modal state ─────────────────────────────────────────────────────────
  const [editModal, setEditModal] = useState<{ visible: boolean; title: string; value: string; onSave: (v: string) => void; kb?: any; multi?: boolean }>({
    visible: false, title: '', value: '', onSave: () => {},
  });
  const openEdit = (title: string, value: string, onSave: (v: string) => void, kb?: any, multi?: boolean) => {
    setEditModal({ visible: true, title, value, onSave, kb, multi });
  };

  // ── Header hamburger ──────────────────────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.getParent()?.openDrawer()} style={{ marginLeft: DS.space.md }}>
          <View style={st.menuBtn}>
            <Ionicons name="menu" size={22} color={DS.colors.white} />
          </View>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión', style: 'destructive',
        onPress: async () => {
          try { await AuthService.logout(); navigation.replace('Login'); }
          catch (e) { console.error(e); }
        },
      },
    ]);
  };

  const handleSaveAll = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('✓ Configuración guardada', 'Todos los cambios fueron guardados correctamente.');
  };

  // ─── initials ──────────────────────────────────────────────────────────────
  const initials = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View style={[st.root, { paddingBottom: insets.bottom }]}>

      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <LinearGradient colors={GRAD_HEADER} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
        {/* Orbe decorativo */}
        <View style={st.heroOrb} />

        <View style={st.avatarWrap}>
          <LinearGradient colors={GRAD_AVATAR} style={st.avatar}>
            <Text style={st.avatarTxt}>{initials}</Text>
          </LinearGradient>
          <TouchableOpacity style={st.avatarEdit}>
            <Ionicons name="camera" size={13} color={DS.colors.white} />
          </TouchableOpacity>
        </View>

        <Text style={st.heroName}>{userName}</Text>
        <Text style={st.heroEmail}>{userEmail}</Text>

        <View style={st.badgeRow}>
          <View style={st.badge}>
            <Ionicons name="shield-checkmark" size={11} color={DS.colors.accent} />
            <Text style={st.badgeTxt}>Administrador</Text>
          </View>
          <View style={st.badge}>
            <Ionicons name="business" size={11} color={DS.colors.accent} />
            <Text style={st.badgeTxt}>{companyName}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Scrollable Sections ───────────────────────────────────────────── */}
      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Perfil de Usuario ─────────────────────────────────────────── */}
        <CollapseSection id="perfil" current={openSection} title="Perfil de Usuario" icon="person-circle-outline" color={DS.colors.grad2} onToggle={setOpenSection}>
          <FieldRow label="Nombre completo" value={userName}  onEdit={() => openEdit('Nombre completo', userName,  setUserName)} />
          <FieldRow label="Correo"          value={userEmail} onEdit={() => openEdit('Correo electrónico', userEmail, setUserEmail, 'email-address')} />
          <FieldRow label="Teléfono"        value={userPhone} onEdit={() => openEdit('Teléfono', userPhone, setUserPhone, 'phone-pad')} />
          <TouchableOpacity
            style={st.inlineBtn}
            onPress={() => Alert.alert('Cambiar contraseña', 'Se enviará un enlace de restablecimiento a tu correo.')}
          >
            <Ionicons name="lock-closed-outline" size={15} color={DS.colors.grad3} />
            <Text style={st.inlineBtnTxt}>Cambiar contraseña</Text>
          </TouchableOpacity>
        </CollapseSection>

        {/* ── Empresa ───────────────────────────────────────────────────── */}
        <CollapseSection id="empresa" current={openSection} title="Empresa" icon="business-outline" color="#0284c7" onToggle={setOpenSection}>
          <FieldRow label="Razón social"  value={companyName}    onEdit={() => openEdit('Razón social', companyName, setCompanyName)} />
          <FieldRow label="RNC / RUC"     value={companyRNC}     onEdit={() => openEdit('RNC / RUC', companyRNC, setCompanyRNC)} />
          <FieldRow label="Teléfono"      value={companyPhone}   onEdit={() => openEdit('Teléfono empresa', companyPhone, setCompanyPhone, 'phone-pad')} />
          <FieldRow label="Email"         value={companyEmail}   onEdit={() => openEdit('Email empresa', companyEmail, setCompanyEmail, 'email-address')} />
          <FieldRow label="Slogan"        value={companySlogan}  onEdit={() => openEdit('Slogan', companySlogan, setCompanySlogan)} />
          <FieldRow label="Dirección"     value={companyAddress} onEdit={() => openEdit('Dirección', companyAddress, setCompanyAddress, 'default', true)} />
        </CollapseSection>

        {/* ── Moneda & Formato ──────────────────────────────────────────── */}
        <CollapseSection id="recibos" current={openSection} title="Moneda & Formato" icon="cash-outline" color="#059669" onToggle={setOpenSection}>

          <SectionHeader icon="wallet-outline" label="Moneda" color="#059669" />
          <TouchableOpacity style={st.currencySelector} onPress={() => setShowCurrPicker(true)} activeOpacity={0.8}>
            <View style={st.currSymbolBig}>
              <Text style={st.currSymbolBigTxt}>{currency.symbol}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.currCode}>{currency.code}</Text>
              <Text style={st.currName}>{currency.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={DS.colors.textMuted} />
          </TouchableOpacity>

          <View style={st.separator} />
          <SectionHeader icon="text-outline" label="Separadores numéricos" color="#059669" />
          <View style={st.rowTwo}>
            <View style={st.halfField}>
              <Text style={st.halfLabel}>Decimal</Text>
              <ChipSelect options={['.', ',']} value={decimalSep} onChange={setDecimalSep} />
            </View>
            <View style={st.halfField}>
              <Text style={st.halfLabel}>Miles</Text>
              <ChipSelect options={[',', '.']} value={thousandSep} onChange={setThousandSep} />
            </View>
          </View>

          <View style={st.separator} />
          <SectionHeader icon="calendar-outline" label="Formato de fecha" color="#059669" />
          <ChipSelect options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']} value={dateFormat} onChange={setDateFormat} />

          <View style={st.separator} />
          <SectionHeader icon="location-outline" label="Posición del símbolo" color="#059669" />
          <ChipSelect options={['izq', 'der']} value={symbolPosition} onChange={(v) => setSymbolPosition(v as 'izq' | 'der')} />

        </CollapseSection>

        {/* ── Parámetros de Préstamos ───────────────────────────────────── */}
        <CollapseSection id="prestamos" current={openSection} title="Parámetros de Préstamos" icon="trending-up-outline" color="#d97706" onToggle={setOpenSection}>

          <SectionHeader icon="cash-outline" label="Montos" color="#d97706" />
          <NumberInput label="Monto mínimo"      value={minAmount}      onChange={setMinAmount}      suffix={currency.code} step={500}  min={0}   max={maxAmount} />
          <NumberInput label="Monto máximo"      value={maxAmount}      onChange={setMaxAmount}      suffix={currency.code} step={1000} min={minAmount} max={9999999} />
          <NumberInput label="Monto por defecto" value={defaultAmount}  onChange={setDefaultAmount}  suffix={currency.code} step={500}  min={minAmount} max={maxAmount} />

          <View style={st.separator} />
          <SectionHeader icon="time-outline" label="Plazo y cuotas" color="#d97706" />
          <NumberInput label="Plazo por defecto (meses)" value={defaultTerm} onChange={setDefaultTerm} suffix="meses" min={1} max={360} />
          <View style={st.labelAbove}><Text style={st.fieldLabel}>Frecuencia de pago</Text></View>
          <ChipSelect options={FREQ_OPTIONS} value={payFreq} onChange={setPayFreq} />

          <View style={st.separator} />
          <SectionHeader icon="percent-outline" label="Tasas e intereses" color="#d97706" />
          <NumberInput label="Tasa por defecto (%)" value={defaultRate}  onChange={setDefaultRate}  suffix="%" min={0} max={100} />
          <NumberInput label="Mora (%/día o monto)" value={penaltyRate}  onChange={setPenaltyRate}  suffix="%" min={0} max={50} />
          <NumberInput label="Días de gracia"       value={graceDays}    onChange={setGraceDays}    suffix="días" min={0} max={30} />
          <View style={st.labelAbove}><Text style={st.fieldLabel}>Tipo de interés</Text></View>
          <ChipSelect options={INTEREST_TYPE} value={interestType} onChange={setInterestType} />
          <View style={st.labelAbove}><Text style={st.fieldLabel}>Tipo de mora</Text></View>
          <ChipSelect options={PENALTY_TYPE}  value={penaltyType}  onChange={setPenaltyType} />

          <View style={st.separator} />
          <SectionHeader icon="options-outline" label="Opciones" color="#d97706" />
          <ToggleRow label="Calcular interés automáticamente" desc="Aplica tasa al generar cuotas" value={autoCalcInterest} onChange={setAutoCalcInterest} color="#d97706" />
          <ToggleRow label="Permitir pagos parciales"         desc="El cliente puede abonar montos menores" value={allowPartial}    onChange={setAllowPartial}    color="#d97706" />
          <ToggleRow label="Requiere fiador/garante"          desc="Obligatorio al crear préstamo" value={requireGuarantor} onChange={setRequireGuarantor} color="#d97706" />

        </CollapseSection>

        {/* ── Recibos & Tickets ─────────────────────────────────────────── */}
        <CollapseSection id="seguridad" current={openSection} title="Recibos & Tickets" icon="receipt-outline" color="#7c3aed" onToggle={setOpenSection}>

          <SectionHeader icon="print-outline" label="Impresión" color="#7c3aed" />
          <View style={st.labelAbove}><Text style={st.fieldLabel}>Tamaño de papel</Text></View>
          <ChipSelect options={['58mm', '80mm', 'A4']} value={paperSize} onChange={setPaperSize} />
          <NumberInput label="Copias por recibo" value={copies} onChange={setCopies} suffix="cop." min={1} max={5} />

          <View style={st.separator} />
          <SectionHeader icon="eye-outline" label="Contenido del ticket" color="#7c3aed" />
          <ToggleRow label="Mostrar logo"        value={showLogo}      onChange={setShowLogo}      color="#7c3aed" />
          <ToggleRow label="Mostrar RNC / RUC"   value={showRNC}       onChange={setShowRNC}       color="#7c3aed" />
          <ToggleRow label="Mostrar saldo pendiente" value={showBalance} onChange={setShowBalance}  color="#7c3aed" />
          <ToggleRow label="Incluir línea de firma" value={showSignature} onChange={setShowSignature} color="#7c3aed" />
          <ToggleRow label="Imprimir automáticamente" desc="Al registrar un pago" value={autoPrint} onChange={setAutoPrint} color="#7c3aed" />

          <View style={st.separator} />
          <SectionHeader icon="text-outline" label="Pie de recibo" color="#7c3aed" />
          <TouchableOpacity style={st.textAreaBtn} onPress={() => openEdit('Pie de recibo', ticketFooter, setTicketFooter, 'default', true)}>
            <Text style={st.textAreaValue} numberOfLines={3}>{ticketFooter}</Text>
            <Ionicons name="create-outline" size={16} color={DS.colors.textMuted} />
          </TouchableOpacity>

        </CollapseSection>

        {/* ── Seguridad ─────────────────────────────────────────────────── */}
        <View style={st.collapseCard}>
          <TouchableOpacity
            style={st.collapseHeader}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOpenSection(openSection === null ? 'seguridad' : null); }}
            activeOpacity={0.75}
          >
            <View style={[st.collapseIconWrap, { backgroundColor: '#dc262618' }]}>
              <Ionicons name="shield-outline" size={18} color="#dc2626" />
            </View>
            <Text style={st.collapseTitle}>Seguridad</Text>
            <Ionicons name="chevron-down" size={18} color={DS.colors.textMuted} />
          </TouchableOpacity>
          {openSection === null && (
            <View style={st.collapseBody}>
              <ToggleRow label="Autenticación biométrica" desc="Huella o Face ID para desbloquear" value={biometric}  onChange={setBiometric}  color="#dc2626" />
              <ToggleRow label="Bloqueo automático"       desc="Bloquea la app tras inactividad"  value={autoLock}   onChange={setAutoLock}   color="#dc2626" />
              {autoLock && <NumberInput label="Tiempo sin uso (min)" value={lockTimeout} onChange={setLockTimeout} suffix="min" min={1} max={60} />}
              <ToggleRow label="Doble factor (2FA)"       desc="Código SMS al iniciar sesión"    value={twoFactor}  onChange={setTwoFactor}  color="#dc2626" />
              <ToggleRow label="Registro de sesiones"     desc="Historial de accesos"            value={sessionLog} onChange={setSessionLog} color="#dc2626" />
              <TouchableOpacity style={[st.inlineBtn, { marginTop: DS.space.sm }]} onPress={() => Alert.alert('Sesiones activas', 'Solo existe 1 sesión activa.')}>
                <Ionicons name="desktop-outline" size={15} color="#dc2626" />
                <Text style={[st.inlineBtnTxt, { color: '#dc2626' }]}>Ver sesiones activas</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Botón guardar ────────────────────────────────────────────────── */}
        <TouchableOpacity style={st.saveBtn} onPress={handleSaveAll} activeOpacity={0.88}>
          <LinearGradient colors={GRAD_BTN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.saveGrad}>
            <Ionicons name="checkmark-circle-outline" size={19} color={DS.colors.white} />
            <Text style={st.saveTxt}>Guardar configuración</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Acciones de cuenta ──────────────────────────────────────────── */}
        <View style={st.collapseCard}>
          <TouchableOpacity style={st.actionRow} onPress={() => navigation.navigate('Reports')} activeOpacity={0.75}>
            <View style={[st.actionIcon, { backgroundColor: DS.colors.infoBg }]}>
              <Ionicons name="stats-chart-outline" size={18} color={DS.colors.info} />
            </View>
            <Text style={st.actionTxt}>Ver Reportes</Text>
            <Ionicons name="chevron-forward" size={16} color={DS.colors.textMuted} />
          </TouchableOpacity>
          <View style={st.divider} />
          <TouchableOpacity style={st.actionRow} onPress={() => Alert.alert('Exportar datos', 'Se generará un archivo ZIP con todos los datos.')} activeOpacity={0.75}>
            <View style={[st.actionIcon, { backgroundColor: DS.colors.successBg }]}>
              <Ionicons name="cloud-download-outline" size={18} color={DS.colors.success} />
            </View>
            <Text style={st.actionTxt}>Exportar datos</Text>
            <Ionicons name="chevron-forward" size={16} color={DS.colors.textMuted} />
          </TouchableOpacity>
          <View style={st.divider} />
          <TouchableOpacity style={st.actionRow} onPress={handleLogout} activeOpacity={0.75}>
            <View style={[st.actionIcon, { backgroundColor: DS.colors.dangerBg }]}>
              <Ionicons name="log-out-outline" size={18} color={DS.colors.danger} />
            </View>
            <Text style={[st.actionTxt, { color: DS.colors.danger }]}>Cerrar Sesión</Text>
            <Ionicons name="chevron-forward" size={16} color={DS.colors.danger} />
          </TouchableOpacity>
        </View>

        <Text style={st.versionTxt}>DomPresta v2.0.0  •  Todos los derechos reservados</Text>
      </ScrollView>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <EditModal
        visible={editModal.visible}
        title={editModal.title}
        value={editModal.value}
        onSave={editModal.onSave}
        onClose={() => setEditModal(s => ({ ...s, visible: false }))}
        keyboardType={editModal.kb}
        multiline={editModal.multi}
      />
      <CurrencyModal
        visible={showCurrPicker}
        selected={currency.code}
        onSelect={setCurrency}
        onClose={() => setShowCurrPicker(false)}
      />
    </View>
  );
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.surface },

  menuBtn: {
    width: 34, height: 34, borderRadius: DS.radius.pill,
    backgroundColor: DS.colors.overlayLight,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero: {
    paddingTop: 56, paddingBottom: DS.space.xxl,
    alignItems: 'center', overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute', width: 260, height: 260,
    borderRadius: 130, backgroundColor: 'rgba(167,139,250,0.10)',
    top: -80, right: -50,
  },
  avatarWrap: { marginBottom: DS.space.md, position: 'relative' },
  avatar: {
    width: 82, height: 82, borderRadius: DS.radius.pill,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarTxt: { fontSize: DS.font.xl, fontWeight: DS.weight.black, color: DS.colors.white, letterSpacing: -0.5 },
  avatarEdit: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: DS.radius.pill,
    backgroundColor: DS.colors.grad3,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: DS.colors.white,
  },
  heroName:  { fontSize: DS.font.lg, fontWeight: DS.weight.black, color: DS.colors.white, letterSpacing: -0.3 },
  heroEmail: { fontSize: DS.font.sm, color: 'rgba(255,255,255,0.65)', marginTop: DS.space.xs, marginBottom: DS.space.md },
  badgeRow:  { flexDirection: 'row', gap: DS.space.sm },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: DS.space.xs,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: DS.space.md, paddingVertical: DS.space.xs,
    borderRadius: DS.radius.pill,
  },
  badgeTxt: { fontSize: DS.font.xs, fontWeight: DS.weight.bold, color: DS.colors.white },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { padding: DS.space.lg, gap: DS.space.md, paddingBottom: DS.space.xxl },

  // ── Collapse card ────────────────────────────────────────────────────────────
  collapseCard: {
    backgroundColor: DS.colors.white,
    borderRadius: DS.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  collapseHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: DS.space.lg, gap: DS.space.md,
  },
  collapseIconWrap: {
    width: 34, height: 34, borderRadius: DS.radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  collapseTitle: { flex: 1, fontSize: DS.font.md, fontWeight: DS.weight.bold, color: DS.colors.text },
  collapseBody: {
    paddingHorizontal: DS.space.lg, paddingBottom: DS.space.lg,
    borderTopWidth: 1, borderTopColor: DS.colors.border,
  },

  // ── Section sub-header ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: DS.space.sm,
    marginTop: DS.space.lg, marginBottom: DS.space.sm,
  },
  sectionIconWrap: {
    width: 24, height: 24, borderRadius: DS.radius.xs,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: DS.font.sm, fontWeight: DS.weight.bold, color: DS.colors.textSub, letterSpacing: 0.3 },

  // ── Field row ────────────────────────────────────────────────────────────────
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: DS.space.md,
    borderBottomWidth: 1, borderBottomColor: DS.colors.border,
  },
  fieldLabel: { flex: 1, fontSize: DS.font.sm, color: DS.colors.textSub, fontWeight: DS.weight.medium },
  fieldValueRow: { flexDirection: 'row', alignItems: 'center', gap: DS.space.xs, maxWidth: '60%' },
  fieldValue: { fontSize: DS.font.sm, color: DS.colors.text, fontWeight: DS.weight.semibold, textAlign: 'right' },
  fieldValueMono: { fontVariant: ['tabular-nums'] },
  fieldSuffix: { fontSize: DS.font.xs, color: DS.colors.textMuted },

  // ── Toggle row ───────────────────────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: DS.space.md,
    borderBottomWidth: 1, borderBottomColor: DS.colors.border,
  },
  toggleDesc: { fontSize: DS.font.xs, color: DS.colors.textMuted, marginTop: DS.space.xs },

  // ── Number control ───────────────────────────────────────────────────────────
  numberRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: DS.space.md,
    borderBottomWidth: 1, borderBottomColor: DS.colors.border,
  },
  numberCtrl: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border,
    overflow: 'hidden',
  },
  numberBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: DS.colors.accentSoft,
  },
  numberValWrap: {
    minWidth: 64, alignItems: 'center', paddingHorizontal: DS.space.sm,
    flexDirection: 'row', gap: DS.space.xs,
  },
  numberVal: { fontSize: DS.font.md, fontWeight: DS.weight.bold, color: DS.colors.text },
  numberSuffix: { fontSize: DS.font.xs, color: DS.colors.textMuted },

  // ── Chip select ──────────────────────────────────────────────────────────────
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.space.sm, marginVertical: DS.space.sm },
  chip: {
    paddingHorizontal: DS.space.md, paddingVertical: DS.space.sm,
    borderRadius: DS.radius.pill,
    borderWidth: 1.5, borderColor: DS.colors.border,
    backgroundColor: DS.colors.surface,
    overflow: 'hidden',
  },
  chipActive: { borderColor: 'transparent' },
  chipTxt: { fontSize: DS.font.sm, fontWeight: DS.weight.bold, color: DS.colors.textMuted },
  chipTxtActive: { color: DS.colors.white },

  // ── Currency selector ────────────────────────────────────────────────────────
  currencySelector: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: DS.colors.surface, borderRadius: DS.radius.md,
    borderWidth: 1.5, borderColor: DS.colors.border,
    padding: DS.space.md, gap: DS.space.md, marginTop: DS.space.sm,
  },
  currSymbolBig: {
    width: 44, height: 44, borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  currSymbolBigTxt: { fontSize: DS.font.lg, fontWeight: DS.weight.black, color: DS.colors.grad2 },
  currCode: { fontSize: DS.font.md, fontWeight: DS.weight.black, color: DS.colors.text },
  currName: { fontSize: DS.font.xs, color: DS.colors.textMuted, marginTop: 2 },

  // ── Row two columns ──────────────────────────────────────────────────────────
  rowTwo: { flexDirection: 'row', gap: DS.space.md, marginTop: DS.space.sm },
  halfField: { flex: 1 },
  halfLabel: { fontSize: DS.font.sm, fontWeight: DS.weight.medium, color: DS.colors.textSub, marginBottom: DS.space.xs },

  // ── Label above chips ────────────────────────────────────────────────────────
  labelAbove: { marginTop: DS.space.lg },

  // ── Inline button ────────────────────────────────────────────────────────────
  inlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: DS.space.sm,
    paddingVertical: DS.space.md, alignSelf: 'flex-start',
  },
  inlineBtnTxt: { fontSize: DS.font.sm, fontWeight: DS.weight.bold, color: DS.colors.grad3 },

  // ── Text area button ─────────────────────────────────────────────────────────
  textAreaBtn: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: DS.colors.surface, borderRadius: DS.radius.md,
    borderWidth: 1.5, borderColor: DS.colors.border,
    padding: DS.space.md, gap: DS.space.sm, marginTop: DS.space.sm,
  },
  textAreaValue: { flex: 1, fontSize: DS.font.sm, color: DS.colors.text, lineHeight: 20 },

  // ── Save button ───────────────────────────────────────────────────────────────
  saveBtn: {
    borderRadius: DS.radius.md, overflow: 'hidden',
    shadowColor: DS.colors.grad1, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
  saveGrad: {
    paddingVertical: 15, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: DS.space.sm,
  },
  saveTxt: { fontSize: DS.font.md, fontWeight: DS.weight.black, color: DS.colors.white, letterSpacing: 0.3 },

  // ── Action rows ───────────────────────────────────────────────────────────────
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: DS.space.lg, gap: DS.space.md },
  actionIcon: { width: 36, height: 36, borderRadius: DS.radius.sm, alignItems: 'center', justifyContent: 'center' },
  actionTxt: { flex: 1, fontSize: DS.font.md, fontWeight: DS.weight.semibold, color: DS.colors.text },
  divider: { height: 1, backgroundColor: DS.colors.border, marginHorizontal: DS.space.lg },

  // ── Separator ─────────────────────────────────────────────────────────────────
  separator: { height: 1, backgroundColor: DS.colors.border, marginVertical: DS.space.sm },

  // ── Version footer ────────────────────────────────────────────────────────────
  versionTxt: {
    textAlign: 'center', fontSize: DS.font.xs,
    color: DS.colors.textMuted, fontWeight: DS.weight.medium,
    letterSpacing: 0.3, paddingVertical: DS.space.sm,
  },

  // ── Edit Modal ────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: DS.colors.overlayDark,
    justifyContent: 'center', alignItems: 'center', padding: DS.space.xl,
  },
  modalCard: {
    width: '100%', backgroundColor: DS.colors.white,
    borderRadius: DS.radius.xl, padding: DS.space.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2, shadowRadius: 32, elevation: 20,
  },
  modalTitle: { fontSize: DS.font.lg, fontWeight: DS.weight.black, color: DS.colors.text, marginBottom: DS.space.lg },
  modalInput: {
    backgroundColor: DS.colors.surface, borderRadius: DS.radius.md,
    borderWidth: 1.5, borderColor: DS.colors.borderActive,
    paddingHorizontal: DS.space.lg, paddingVertical: DS.space.md,
    fontSize: DS.font.md, color: DS.colors.text, fontWeight: DS.weight.medium,
    marginBottom: DS.space.lg,
  },
  modalBtns: { flexDirection: 'row', gap: DS.space.sm },
  modalCancel: {
    flex: 1, paddingVertical: 13, borderRadius: DS.radius.md,
    borderWidth: 1.5, borderColor: DS.colors.border,
    alignItems: 'center',
  },
  modalCancelTxt: { fontSize: DS.font.md, fontWeight: DS.weight.bold, color: DS.colors.textSub },
  modalSave: { flex: 1, borderRadius: DS.radius.md, overflow: 'hidden' },
  modalSaveGrad: { paddingVertical: 13, alignItems: 'center' },
  modalSaveTxt: { fontSize: DS.font.md, fontWeight: DS.weight.black, color: DS.colors.white },

  // ── Currency Modal ────────────────────────────────────────────────────────────
  currencyItem: {
    flexDirection: 'row', alignItems: 'center', gap: DS.space.md,
    paddingHorizontal: DS.space.xl, paddingVertical: DS.space.md,
  },
  currencyItemActive: { backgroundColor: DS.colors.accentSoft },
  symbolBadge: {
    width: 40, height: 40, borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: DS.colors.border,
  },
  symbolBadgeActive: { backgroundColor: DS.colors.grad2, borderColor: 'transparent' },
  symbolBadgeTxt: { fontSize: DS.font.md, fontWeight: DS.weight.black, color: DS.colors.text },
  currencyCode: { fontSize: DS.font.md, fontWeight: DS.weight.bold, color: DS.colors.text },
  currencyName: { fontSize: DS.font.xs, color: DS.colors.textMuted },
  currencyClose: {
    margin: DS.space.lg, padding: DS.space.md,
    borderRadius: DS.radius.md, borderWidth: 1.5, borderColor: DS.colors.border,
    alignItems: 'center',
  },
  currencyCloseTxt: { fontSize: DS.font.md, fontWeight: DS.weight.bold, color: DS.colors.textSub },
});