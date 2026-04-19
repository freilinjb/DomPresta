import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  FlatList,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';

// ─── Design System ────────────────────────────────────────────────────────────
const DS = {
  colors: {
    grad0: '#3b0764',
    grad1: '#5b21b6',
    grad2: '#6d28d9',
    grad3: '#7c3aed',
    accent: '#a78bfa',
    accentSoft: '#ede9fe',
    surface: '#f5f3ff',
    white: '#ffffff',
    text: '#1e1b4b',
    textSub: '#4b5563',
    textMuted: '#94a3b8',
    border: 'rgba(0,0,0,0.07)',
    success: '#059669',   successBg: '#ecfdf5',
    danger:  '#dc2626',   dangerBg:  '#fef2f2',
    warning: '#d97706',   warningBg: '#fffbeb',
    info:    '#0284c7',   infoBg:    '#f0f9ff',
    orange:  '#ea580c',   orangeBg:  '#fff7ed',
    overlayDark: 'rgba(0,0,0,0.45)',
    overlayLight: 'rgba(255,255,255,0.13)',
  },
  font: { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, title: 26 },
  weight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
    black:    '800' as const,
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 },
  radius: { xs: 4, sm: 8, md: 12, lg: 18, xl: 24, pill: 999 },
};

const GRAD_HEADER = [DS.colors.grad0, DS.colors.grad2] as const;
const GRAD_BTN    = [DS.colors.grad3, DS.colors.grad1] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type SettingsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Settings'>,
  StackNavigationProp<RootStackParamList>
>;
interface SettingsScreenProps { navigation: SettingsNavProp; }

// ─── Data ─────────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'es', label: 'Español',            flag: '🇩🇴' },
  { code: 'en', label: 'English',            flag: '🇺🇸' },
  { code: 'fr', label: 'Français',           flag: '🇫🇷' },
  { code: 'pt', label: 'Português',          flag: '🇧🇷' },
];

const THEMES = ['Sistema', 'Claro', 'Oscuro'] as const;
type Theme = typeof THEMES[number];

// ─── Reusable pieces ──────────────────────────────────────────────────────────

/** Card with optional collapse */
const SettingCard = ({
  id, openId, title, icon, color, children, onToggle,
}: {
  id: string; openId: string; title: string; icon: string;
  color: string; children: React.ReactNode;
  onToggle: (id: string) => void;
}) => {
  const open = openId === id;
  const rot  = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(rot, { toValue: open ? 1 : 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  }, [open]);

  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={sc.card}>
      <TouchableOpacity
        style={sc.cardHeader}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(open ? '' : id); }}
        activeOpacity={0.75}
      >
        <View style={[sc.cardIcon, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
        <Text style={sc.cardTitle}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={17} color={DS.colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>
      {open && <View style={sc.cardBody}>{children}</View>}
    </View>
  );
};

/** Toggle row */
const ToggleRow = ({
  icon, label, desc, value, onChange, color = DS.colors.grad3,
}: { icon?: string; label: string; desc?: string; value: boolean; onChange: (v: boolean) => void; color?: string }) => (
  <View style={sc.toggleRow}>
    {icon && (
      <View style={[sc.rowIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
    )}
    <View style={{ flex: 1, marginRight: DS.space.md }}>
      <Text style={sc.rowLabel}>{label}</Text>
      {desc && <Text style={sc.rowDesc}>{desc}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={v => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(v); }}
      trackColor={{ false: DS.colors.border, true: color + '55' }}
      thumbColor={value ? color : '#d1d5db'}
      ios_backgroundColor={DS.colors.border}
    />
  </View>
);

/** Navigation row */
const NavRow = ({
  icon, label, desc, value, onPress, color = DS.colors.grad3, danger = false,
}: { icon?: string; label: string; desc?: string; value?: string; onPress: () => void; color?: string; danger?: boolean }) => (
  <TouchableOpacity style={sc.navRow} onPress={onPress} activeOpacity={0.7}>
    {icon && (
      <View style={[sc.rowIcon, { backgroundColor: (danger ? DS.colors.danger : color) + '15' }]}>
        <Ionicons name={icon as any} size={15} color={danger ? DS.colors.danger : color} />
      </View>
    )}
    <View style={{ flex: 1 }}>
      <Text style={[sc.rowLabel, danger && { color: DS.colors.danger }]}>{label}</Text>
      {desc && <Text style={sc.rowDesc}>{desc}</Text>}
    </View>
    {value && <Text style={sc.rowValue}>{value}</Text>}
    <Ionicons name="chevron-forward" size={14} color={danger ? DS.colors.danger : DS.colors.textMuted} style={{ marginLeft: DS.space.xs }} />
  </TouchableOpacity>
);

const Divider = () => <View style={sc.divider} />;

// ─── Picker Modal ─────────────────────────────────────────────────────────────
function PickerModal<T extends { code: string; label: string; flag?: string }>({
  visible, title, items, selected, onSelect, onClose,
}: {
  visible: boolean; title: string;
  items: T[]; selected: string;
  onSelect: (item: T) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sc.overlay} onPress={onClose}>
        <Pressable style={[sc.sheet, { paddingHorizontal: 0, paddingBottom: 0 }]} onPress={() => {}}>
          <Text style={[sc.sheetTitle, { paddingHorizontal: DS.space.xl }]}>{title}</Text>
          <FlatList
            data={items}
            keyExtractor={i => i.code}
            style={{ maxHeight: 300 }}
            renderItem={({ item }) => {
              const active = item.code === selected;
              return (
                <TouchableOpacity
                  style={[sc.pickerItem, active && sc.pickerItemActive]}
                  onPress={() => { onSelect(item); onClose(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  activeOpacity={0.7}
                >
                  {item.flag && <Text style={sc.pickerFlag}>{item.flag}</Text>}
                  <Text style={[sc.pickerLabel, active && { color: DS.colors.grad2, fontWeight: DS.weight.bold }]}>{item.label}</Text>
                  {active && <Ionicons name="checkmark-circle" size={18} color={DS.colors.grad3} />}
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity style={sc.sheetClose} onPress={onClose}>
            <Text style={sc.sheetCloseTxt}>Cerrar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState('notif');

  // Notifications
  const [pushEnabled,   setPushEnabled]   = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [loanAlerts,    setLoanAlerts]    = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(true);
  const [smsAlerts,     setSmsAlerts]     = useState(false);
  const [emailAlerts,   setEmailAlerts]   = useState(true);
  const [soundEnabled,  setSoundEnabled]  = useState(true);
  const [vibration,     setVibration]     = useState(true);

  // Display
  const [theme,         setTheme]         = useState<Theme>('Sistema');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [lang,          setLang]          = useState(LANGUAGES[0]);
  const [compactMode,   setCompactMode]   = useState(false);
  const [animations,    setAnimations]    = useState(true);
  const [largeText,     setLargeText]     = useState(false);
  const [highContrast,  setHighContrast]  = useState(false);

  // Data & sync
  const [autoBackup,    setAutoBackup]    = useState(true);
  const [wifiOnly,      setWifiOnly]      = useState(true);
  const [syncFreq,      setSyncFreq]      = useState('Cada hora');
  const [cacheEnabled,  setCacheEnabled]  = useState(true);

  // Drawer hamburger
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => (navigation as any).getParent?.()?.openDrawer?.()} style={{ marginLeft: DS.space.md }}>
          <View style={sc.menuBtn}>
            <Ionicons name="menu" size={22} color={DS.colors.white} />
          </View>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleClearCache = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Limpiar caché', '¿Eliminar todos los datos en caché?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpiar', style: 'destructive', onPress: () => Alert.alert('✓ Caché limpiado') },
    ]);
  };

  const handleResetSettings = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Restablecer ajustes', 'Esto restaurará todos los ajustes a los valores predeterminados.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Restablecer', style: 'destructive', onPress: () => Alert.alert('✓ Ajustes restablecidos') },
    ]);
  };

  return (
    <View style={[sc.root, { paddingBottom: insets.bottom }]}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <LinearGradient colors={GRAD_HEADER} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={sc.hero}>
        <View style={sc.heroOrb} />
        <View style={sc.heroIconWrap}>
          <Ionicons name="settings" size={28} color={DS.colors.white} />
        </View>
        <Text style={sc.heroTitle}>Ajustes</Text>
        <Text style={sc.heroSub}>Personaliza la experiencia de DomPresta</Text>
      </LinearGradient>

      <ScrollView
        style={sc.scroll}
        contentContainerStyle={sc.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── 1. Notificaciones ─────────────────────────────────────────── */}
        <SettingCard id="notif" openId={open} title="Notificaciones" icon="notifications-outline" color={DS.colors.grad3} onToggle={setOpen}>
          <ToggleRow icon="notifications-outline" label="Notificaciones push"    desc="Activar o desactivar todas"              value={pushEnabled}   onChange={setPushEnabled}   color={DS.colors.grad3} />
          <Divider />
          <ToggleRow icon="cash-outline"          label="Alertas de pagos"       desc="Cuando un cliente realiza un pago"       value={paymentAlerts} onChange={setPaymentAlerts} color={DS.colors.success} />
          <ToggleRow icon="document-text-outline" label="Alertas de préstamos"   desc="Nuevas solicitudes y aprobaciones"       value={loanAlerts}    onChange={setLoanAlerts}    color={DS.colors.info} />
          <ToggleRow icon="warning-outline"       label="Alertas de morosidad"   desc="Cuotas vencidas sin pagar"               value={overdueAlerts} onChange={setOverdueAlerts} color={DS.colors.danger} />
          <Divider />
          <ToggleRow icon="chatbubble-outline"    label="Alertas por SMS"        desc="Requiere créditos de mensajería"         value={smsAlerts}     onChange={setSmsAlerts}     color={DS.colors.warning} />
          <ToggleRow icon="mail-outline"          label="Alertas por email"      desc="Resumen diario a tu correo"              value={emailAlerts}   onChange={setEmailAlerts}   color={DS.colors.info} />
          <Divider />
          <ToggleRow icon="volume-high-outline"   label="Sonido"                 desc="Reproducir sonido en notificaciones"     value={soundEnabled}  onChange={setSoundEnabled}  />
          <ToggleRow icon="phone-portrait-outline" label="Vibración"             desc="Vibrar al recibir notificaciones"        value={vibration}     onChange={setVibration}     />
        </SettingCard>

        {/* ── 2. Apariencia ─────────────────────────────────────────────── */}
        <SettingCard id="display" openId={open} title="Apariencia" icon="color-palette-outline" color="#0284c7" onToggle={setOpen}>

          {/* Theme chips */}
          <Text style={sc.subLabel}>Tema de la aplicación</Text>
          <View style={sc.themeRow}>
            {THEMES.map((t) => {
              const active = theme === t;
              const icons: Record<Theme, string> = { Sistema: 'phone-portrait-outline', Claro: 'sunny-outline', Oscuro: 'moon-outline' };
              return (
                <TouchableOpacity
                  key={t}
                  style={[sc.themeCard, active && sc.themeCardActive]}
                  onPress={() => { setTheme(t); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  activeOpacity={0.75}
                >
                  {active && (
                    <LinearGradient colors={GRAD_BTN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  )}
                  <Ionicons name={icons[t] as any} size={20} color={active ? DS.colors.white : DS.colors.textMuted} />
                  <Text style={[sc.themeTxt, active && { color: DS.colors.white }]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Divider />
          <NavRow icon="language-outline" label="Idioma" value={lang.flag + '  ' + lang.label} onPress={() => setShowLangPicker(true)} color="#0284c7" />
          <Divider />
          <ToggleRow icon="contract-outline"  label="Modo compacto"   desc="Reduce el espaciado entre elementos" value={compactMode}  onChange={setCompactMode}  color="#0284c7" />
          <ToggleRow icon="sparkles-outline"  label="Animaciones"     desc="Transiciones y micro-interacciones"  value={animations}   onChange={setAnimations}   color="#0284c7" />
          <ToggleRow icon="text-outline"      label="Texto grande"    desc="Aumentar tamaño de fuente"           value={largeText}    onChange={setLargeText}    color="#0284c7" />
          <ToggleRow icon="contrast-outline"  label="Alto contraste"  desc="Mayor legibilidad en pantalla"       value={highContrast} onChange={setHighContrast} color="#0284c7" />
        </SettingCard>

        {/* ── 3. Datos & Sincronización ─────────────────────────────────── */}
        <SettingCard id="sync" openId={open} title="Datos & Sincronización" icon="sync-outline" color={DS.colors.success} onToggle={setOpen}>
          <ToggleRow icon="cloud-upload-outline" label="Respaldo automático"  desc="Sincroniza con la nube diariamente" value={autoBackup}  onChange={setAutoBackup}  color={DS.colors.success} />
          <ToggleRow icon="wifi-outline"         label="Solo con Wi-Fi"       desc="No usar datos móviles para sync"   value={wifiOnly}    onChange={setWifiOnly}    color={DS.colors.success} />
          <ToggleRow icon="archive-outline"      label="Caché activa"         desc="Mejora la velocidad offline"       value={cacheEnabled} onChange={setCacheEnabled} color={DS.colors.success} />
          <Divider />
          <NavRow icon="time-outline"       label="Frecuencia de sync" value={syncFreq}    onPress={() => Alert.alert('Frecuencia', 'Próximamente: selector de frecuencia.')} color={DS.colors.success} />
          <NavRow icon="cloud-download-outline" label="Respaldar ahora"  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert('✓ Respaldo iniciado', 'Los datos se están sincronizando.'); }} color={DS.colors.success} />
          <NavRow icon="trash-outline"      label="Limpiar caché"      desc="Liberar espacio de almacenamiento" onPress={handleClearCache} color={DS.colors.warning} />
        </SettingCard>

        {/* ── 4. Soporte & Ayuda ────────────────────────────────────────── */}
        <SettingCard id="support" openId={open} title="Soporte & Ayuda" icon="help-circle-outline" color={DS.colors.info} onToggle={setOpen}>
          <NavRow icon="book-outline"         label="Guía de usuario"      desc="Manual completo de la aplicación"          onPress={() => Linking.openURL('https://dompresta.com/ayuda')} color={DS.colors.info} />
          <NavRow icon="chatbubbles-outline"  label="Chat de soporte"      desc="Habla con un agente en tiempo real"         onPress={() => Alert.alert('Soporte', 'Abriendo chat...')}    color={DS.colors.info} />
          <NavRow icon="mail-outline"         label="Contactar soporte"    desc="soporte@dompresta.com"                     onPress={() => Linking.openURL('mailto:soporte@dompresta.com')} color={DS.colors.info} />
          <NavRow icon="bug-outline"          label="Reportar un error"    desc="Ayúdanos a mejorar la app"                 onPress={() => Alert.alert('Reporte enviado', 'Gracias por tu colaboración.')} color={DS.colors.warning} />
          <Divider />
          <NavRow icon="star-outline"         label="Valorar la app"       desc="Deja tu reseña en la tienda"               onPress={() => Linking.openURL('https://play.google.com')} color={DS.colors.orange} />
          <NavRow icon="share-social-outline" label="Compartir app"        desc="Recomienda DomPresta a otros"              onPress={() => Alert.alert('Compartir', 'Función próximamente.')} color={DS.colors.orange} />
        </SettingCard>

        {/* ── 5. Acerca de ─────────────────────────────────────────────── */}
        <SettingCard id="about" openId={open} title="Acerca de" icon="information-circle-outline" color={DS.colors.textMuted} onToggle={setOpen}>
          <NavRow icon="phone-portrait-outline" label="Versión"          value="2.0.0 (build 142)"   onPress={() => {}}                                                        />
          <NavRow icon="code-slash-outline"     label="Novedades"        desc="Ver qué hay de nuevo" onPress={() => Alert.alert('v2.0.0', '• Nuevo diseño\n• Arqueo de caja\n• Soporte offline')} />
          <NavRow icon="document-outline"       label="Términos de uso"  onPress={() => Linking.openURL('https://dompresta.com/terminos')}  />
          <NavRow icon="shield-checkmark-outline" label="Privacidad"     onPress={() => Linking.openURL('https://dompresta.com/privacidad')} />
          <NavRow icon="globe-outline"          label="Sitio web"        value="dompresta.com"       onPress={() => Linking.openURL('https://dompresta.com')} />
          <Divider />
          <View style={sc.aboutFooter}>
            <LinearGradient colors={[DS.colors.accent, DS.colors.grad3]} style={sc.aboutLogo}>
              <Ionicons name="wallet" size={20} color={DS.colors.white} />
            </LinearGradient>
            <Text style={sc.aboutName}>DomPresta</Text>
            <Text style={sc.aboutCopy}>© 2024 DomPresta S.R.L. — Todos los derechos reservados.</Text>
          </View>
        </SettingCard>

        {/* ── Restablecer ──────────────────────────────────────────────── */}
        <TouchableOpacity style={sc.resetBtn} onPress={handleResetSettings} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={16} color={DS.colors.danger} />
          <Text style={sc.resetTxt}>Restablecer ajustes predeterminados</Text>
        </TouchableOpacity>

        <Text style={sc.versionFooter}>DomPresta v2.0.0  •  build 142</Text>
      </ScrollView>

      {/* Language picker */}
      <PickerModal
        visible={showLangPicker}
        title="Seleccionar idioma"
        items={LANGUAGES}
        selected={lang.code}
        onSelect={setLang}
        onClose={() => setShowLangPicker(false)}
      />
    </View>
  );
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.surface },

  menuBtn: {
    width: 34, height: 34, borderRadius: DS.radius.pill,
    backgroundColor: DS.colors.overlayLight,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    paddingTop: 52, paddingBottom: DS.space.xxl,
    alignItems: 'center', overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute', width: 240, height: 240,
    borderRadius: 120, backgroundColor: 'rgba(167,139,250,0.10)',
    top: -70, right: -40,
  },
  heroIconWrap: {
    width: 62, height: 62, borderRadius: DS.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: DS.space.md,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  heroTitle: { fontSize: DS.font.xl, fontWeight: DS.weight.black, color: DS.colors.white, letterSpacing: -0.4 },
  heroSub:   { fontSize: DS.font.sm, color: 'rgba(255,255,255,0.6)', marginTop: DS.space.xs },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll:        { flex: 1 },
  scrollContent: { padding: DS.space.lg, gap: DS.space.md, paddingBottom: DS.space.xxl },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: DS.colors.white, borderRadius: DS.radius.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: DS.colors.border,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: DS.space.lg, gap: DS.space.md,
  },
  cardIcon: {
    width: 34, height: 34, borderRadius: DS.radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { flex: 1, fontSize: DS.font.md, fontWeight: DS.weight.bold, color: DS.colors.text },
  cardBody:  {
    paddingHorizontal: DS.space.lg, paddingBottom: DS.space.lg,
    borderTopWidth: 1, borderTopColor: DS.colors.border,
    paddingTop: DS.space.sm,
  },

  // ── Rows ──────────────────────────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: DS.space.md,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: DS.space.md,
  },
  rowIcon: {
    width: 30, height: 30, borderRadius: DS.radius.sm,
    alignItems: 'center', justifyContent: 'center',
    marginRight: DS.space.md,
  },
  rowLabel:  { fontSize: DS.font.sm, fontWeight: DS.weight.semibold, color: DS.colors.text },
  rowDesc:   { fontSize: DS.font.xs, color: DS.colors.textMuted, marginTop: DS.space.xs },
  rowValue:  { fontSize: DS.font.sm, color: DS.colors.textMuted, fontWeight: DS.weight.medium, marginRight: DS.space.xs },

  divider: { height: 1, backgroundColor: DS.colors.border, marginVertical: DS.space.xs },

  // ── Sub label ─────────────────────────────────────────────────────────────
  subLabel: {
    fontSize: DS.font.xs, fontWeight: DS.weight.bold,
    color: DS.colors.textMuted, letterSpacing: 0.5,
    textTransform: 'uppercase', marginTop: DS.space.md, marginBottom: DS.space.sm,
  },

  // ── Theme chips ───────────────────────────────────────────────────────────
  themeRow: { flexDirection: 'row', gap: DS.space.sm },
  themeCard: {
    flex: 1, alignItems: 'center', paddingVertical: DS.space.md,
    borderRadius: DS.radius.md, borderWidth: 1.5, borderColor: DS.colors.border,
    gap: DS.space.sm, overflow: 'hidden', backgroundColor: DS.colors.surface,
  },
  themeCardActive: { borderColor: 'transparent' },
  themeTxt: { fontSize: DS.font.xs, fontWeight: DS.weight.bold, color: DS.colors.textMuted },

  // ── About footer ──────────────────────────────────────────────────────────
  aboutFooter: { alignItems: 'center', paddingVertical: DS.space.lg, gap: DS.space.sm },
  aboutLogo: {
    width: 46, height: 46, borderRadius: DS.radius.md,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: DS.colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  aboutName: { fontSize: DS.font.lg, fontWeight: DS.weight.black, color: DS.colors.text, letterSpacing: -0.3 },
  aboutCopy: { fontSize: DS.font.xs, color: DS.colors.textMuted, textAlign: 'center' },

  // ── Reset ─────────────────────────────────────────────────────────────────
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: DS.space.sm, paddingVertical: DS.space.md,
  },
  resetTxt: { fontSize: DS.font.sm, fontWeight: DS.weight.bold, color: DS.colors.danger },

  versionFooter: {
    textAlign: 'center', fontSize: DS.font.xs,
    color: DS.colors.textMuted, fontWeight: DS.weight.medium,
    letterSpacing: 0.3, paddingBottom: DS.space.sm,
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  overlay: {
    flex: 1, backgroundColor: DS.colors.overlayDark,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: DS.colors.white, borderTopLeftRadius: DS.radius.xl,
    borderTopRightRadius: DS.radius.xl, padding: DS.space.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 20,
  },
  sheetTitle: {
    fontSize: DS.font.lg, fontWeight: DS.weight.black,
    color: DS.colors.text, marginBottom: DS.space.lg,
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: DS.space.md,
    paddingHorizontal: DS.space.xl, paddingVertical: DS.space.md,
  },
  pickerItemActive: { backgroundColor: DS.colors.accentSoft },
  pickerFlag:  { fontSize: 22 },
  pickerLabel: { flex: 1, fontSize: DS.font.md, color: DS.colors.text, fontWeight: DS.weight.medium },
  sheetClose: {
    margin: DS.space.lg, padding: DS.space.md,
    borderRadius: DS.radius.md, borderWidth: 1.5, borderColor: DS.colors.border,
    alignItems: 'center',
  },
  sheetCloseTxt: { fontSize: DS.font.md, fontWeight: DS.weight.bold, color: DS.colors.textSub },
});