import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  Animated as RNAnimated,
  Pressable,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  SlideInRight,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Text as SvgText, G } from 'react-native-svg';
import { Loan } from '../../types';
import { LoanService } from '../../services/loanService';
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
};

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;
interface HomeScreenProps { navigation: HomeScreenNavigationProp; }

// ─── Mock loans ───────────────────────────────────────────────────
const MOCK_LOANS: Loan[] = [
  { id: '1', borrowerName: 'Juan Rodríguez', amount: 5000, status: 'active', createdAt: '2025-06-01' },
  { id: '2', borrowerName: 'María Pérez', amount: 2500, status: 'pending', createdAt: '2025-06-10' },
  { id: '3', borrowerName: 'Carlos García', amount: 8200, status: 'overdue', createdAt: '2025-04-15' },
  { id: '4', borrowerName: 'Ana López', amount: 3750, status: 'review', createdAt: '2025-06-15' },
  { id: '5', borrowerName: 'Roberto Marte', amount: 6000, status: 'active', createdAt: '2025-05-20' },
  { id: '6', borrowerName: 'Luisa Fernández', amount: 4200, status: 'active', createdAt: '2025-06-18' },
];

const MONTHLY = [
  { month: 'Ene', amt: 9, h: 38 },
  { month: 'Feb', amt: 11, h: 46 },
  { month: 'Mar', amt: 14, h: 58 },
  { month: 'Abr', amt: 12, h: 50 },
  { month: 'May', amt: 16, h: 66 },
  { month: 'Jun', amt: 18, h: 76, peak: true },
  { month: 'Jul', amt: 0, h: 30, forecast: true },
];

const DONUT_SEGS = [
  { pct: 0.70, color: '#7c3aed', label: 'Activos', count: 42 },
  { pct: 0.15, color: '#a78bfa', label: 'Pendientes', count: 11 },
  { pct: 0.08, color: '#f87171', label: 'Vencidos', count: 8 },
  { pct: 0.07, color: '#34d399', label: 'Completados', count: 66 },
];

const AVATAR_GRADIENTS: [string, string][] = [
  ['#7c3aed', '#4f46e5'],
  ['#8b5cf6', '#06b6d4'],
  ['#f87171', '#f59e0b'],
  ['#059669', '#0891b2'],
  ['#7c3aed', '#059669'],
  ['#a78bfa', '#f59e0b'],
];

const STATUS_CFG: Record<string, { label: string; fg: string; bg: string }> = {
  active: { label: 'Al día', fg: '#059669', bg: '#ecfdf5' },
  pending: { label: 'Pendiente', fg: '#d97706', bg: '#fffbeb' },
  overdue: { label: 'Vencido', fg: '#dc2626', bg: '#fef2f2' },
  review: { label: 'En revisión', fg: '#7c3aed', bg: '#f5f3ff' },
  completed: { label: 'Completado', fg: '#334155', bg: '#f1f5f9' },
};

// ─── StatusPill ───────────────────────────────────────────────────
const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CFG[status] ?? { label: status, fg: '#94a3b8', bg: '#f1f5f9' };
  return (
    <View style={[plS.w, { backgroundColor: cfg.bg }]}>
      <View style={[plS.d, { backgroundColor: cfg.fg }]} />
      <Text style={[plS.t, { color: cfg.fg }]}>{cfg.label}</Text>
    </View>
  );
};
const plS = StyleSheet.create({
  w: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  d: { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
  t: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
});

// ─── MetricCard ───────────────────────────────────────────────────
const MetricCard: React.FC<{
  icon: string; label: string; value: string;
  trend: string; up?: boolean; neu?: boolean; delay?: number;
}> = ({ icon, label, value, trend, up, neu, delay = 0 }) => {
  const fg = neu ? '#7c3aed' : up ? '#059669' : '#dc2626';
  const bg = neu ? '#f5f3ff' : up ? '#ecfdf5' : '#fef2f2';
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={mS.card}>
      <Text style={{ fontSize: 22, marginBottom: 8 }}>{icon}</Text>
      <Text style={mS.val}>{value}</Text>
      <Text style={mS.lbl}>{label}</Text>
      <View style={[mS.tw, { backgroundColor: bg }]}>
        <Text style={[mS.tr, { color: fg }]}>{trend}</Text>
      </View>
    </Animated.View>
  );
};
const mS = StyleSheet.create({
  card: { flex: 1, backgroundColor: C.white, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: C.border },
  val: { fontSize: 16, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  lbl: { fontSize: 10, color: C.textMuted, fontWeight: '600', marginTop: 2 },
  tw: { marginTop: 7, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  tr: { fontSize: 9, fontWeight: '700' },
});

// ─── QuickAction ──────────────────────────────────────────────────
const QuickAction: React.FC<{
  icon: string; label: string; sub: string; iconBg: string;
  onPress: () => void; delay?: number;
}> = ({ icon, label, sub, iconBg, onPress, delay = 0 }) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()} style={{ flex: 1 }}>
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={({ pressed }) => [qS.btn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
    >
      <View style={[qS.ic, { backgroundColor: iconBg }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={qS.nm}>{label}</Text>
      <Text style={qS.sb}>{sub}</Text>
    </Pressable>
  </Animated.View>
);
const qS = StyleSheet.create({
  btn: { backgroundColor: C.white, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: C.border, flex: 1 },
  ic: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  nm: { fontSize: 11, fontWeight: '700', color: C.text },
  sb: { fontSize: 9, color: C.textMuted, marginTop: 2 },
});

// ─── PipeStep ─────────────────────────────────────────────────────
const PipeStep: React.FC<{ label: string; count: string; state: 'done' | 'active' | 'next' }> = ({ label, count, state }) => {
  const bgC = state === 'done' ? '#7c3aed' : state === 'active' ? '#fbbf24' : '#f3f4f6';
  const txtC = state === 'next' ? '#9ca3af' : 'white';
  const valC = state === 'done' ? '#7c3aed' : state === 'active' ? '#d97706' : '#9ca3af';
  return (
    <View style={ppS.step}>
      <View style={[ppS.circle, { backgroundColor: bgC }]}>
        <Text style={[ppS.icon, { color: txtC }]}>{state === 'done' ? '✓' : state === 'active' ? '!' : '○'}</Text>
      </View>
      <Text style={[ppS.count, { color: valC }]}>{count}</Text>
      <Text style={ppS.lbl}>{label}</Text>
    </View>
  );
};
const ppS = StyleSheet.create({
  step: { flex: 1, alignItems: 'center' },
  circle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4, zIndex: 1 },
  icon: { fontSize: 11, fontWeight: '800' },
  count: { fontSize: 12, fontWeight: '800' },
  lbl: { fontSize: 8, color: C.textSub, fontWeight: '600', textAlign: 'center', marginTop: 2 },
});

// ─── DonutChart ───────────────────────────────────────────────────
const DonutChart: React.FC = () => {
  const R = 34;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <Svg width={100} height={100} viewBox="0 0 100 100">
        <G rotation={-90} origin="50,50">
          {DONUT_SEGS.map((seg, i) => {
            const dash = seg.pct * CIRC;
            const cur = offset;
            offset += dash;
            return (
              <Circle
                key={i} cx={50} cy={50} r={R}
                fill="none" stroke={seg.color} strokeWidth={16}
                strokeDasharray={`${dash} ${CIRC - dash}`}
                strokeDashoffset={-cur}
              />
            );
          })}
        </G>
        <SvgText x={50} y={46} textAnchor="middle" fontSize={11} fontWeight="800" fill={C.text}>127</SvgText>
        <SvgText x={50} y={57} textAnchor="middle" fontSize={8} fill={C.textMuted}>total</SvgText>
      </Svg>
      <View style={{ flex: 1, gap: 8 }}>
        {DONUT_SEGS.map((seg, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: seg.color }} />
            <Text style={{ flex: 1, fontSize: 11, color: C.textSub, fontWeight: '500' }}>{seg.label}</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: C.text }}>{Math.round(seg.pct * 100)}% · {seg.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── LoanAvatar ───────────────────────────────────────────────────
const LoanAvatar: React.FC<{ name: string; idx: number }> = ({ name, idx }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const [c1, c2] = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
  return (
    <View style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient colors={[c1, c2]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <Text style={{ color: 'white', fontSize: 13, fontWeight: '800' }}>{initials}</Text>
    </View>
  );
};

// ─── HomeScreen ───────────────────────────────────────────────────
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [loans, setLoans] = useState<Loan[]>(MOCK_LOANS);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const data = await LoanService.getLoans();
      if (data?.length) setLoans(data);
    } catch { /* usa mock */ }
    finally { setRefreshing(false); }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchLoans();
  }, []);

  const fmt = (v: number) =>
    `$${v.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const go = (screen: keyof MainTabParamList) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate(screen);
  };

  const navOpacity = scrollY.interpolate({ inputRange: [0, 60], outputRange: [0, 1], extrapolate: 'clamp' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const activeLoans = loans.filter(l => l.status === 'active');
  const pendingLoans = loans.filter(l => l.status === 'pending');
  const overdueLoans = loans.filter(l => l.status === 'overdue');

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating nav on scroll */}
      <RNAnimated.View style={[s.floatNav, { opacity: navOpacity }]}>
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
        <Text style={s.floatTitle}>Dashboard</Text>
      </RNAnimated.View>

      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary2} />}
      >
        {/* ── HEADER ───────────────────────────────────── */}
        <LinearGradient
          colors={[C.primary, '#6d28d9']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.header}
        >
          <View style={s.topRow}>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.getParent?.()?.openDrawer()}>
              <Ionicons name="menu-outline" size={22} color="white" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399' }} />
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1 }}>EN VIVO</Text>
            </View>
            <TouchableOpacity style={s.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color="white" />
              <View style={s.notifDot} />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={{ paddingHorizontal: 20, marginBottom: 18 }}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>{greeting} 👋</Text>
            <Text style={{ fontSize: 24, color: 'white', fontWeight: '900', letterSpacing: -0.5, marginTop: 2 }}>Carlos Méndez</Text>
          </Animated.View>

          {/* Balance card */}
          <Animated.View entering={FadeInDown.delay(180).springify()} style={s.balCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>Cartera Total Activa</Text>
                <Text style={{ fontSize: 30, fontWeight: '900', color: 'white', letterSpacing: -1 }}>$284,750.00</Text>
              </View>
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="wallet-outline" size={20} color="rgba(255,255,255,0.8)" />
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 14 }} />
            <View style={{ flexDirection: 'row' }}>
              {[
                { num: activeLoans.length + 36, lbl: 'Activos' },
                { num: pendingLoans.length + 9, lbl: 'Pendientes' },
                { num: overdueLoans.length + 7, lbl: 'Vencidos' },
                { num: loans.length + 100, lbl: 'Total' },
              ].map((stat, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <View style={{ width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' }} />}
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: 'white' }}>{stat.num}</Text>
                    <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginTop: 2 }}>{stat.lbl}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </Animated.View>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            {['Resumen', 'Préstamos', 'Clientes', 'Reportes'].map((t, i) => (
              <TouchableOpacity key={t} style={[s.tab, i === 0 && s.tabActive]}>
                <Text style={[{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' }, i === 0 && { color: 'white' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        <View style={s.body}>

          {/* ── MÉTRICAS ─────────────────────────────── */}
          <View style={s.row}>
            <MetricCard icon="💰" label="Cobrado este mes" value="$18,420" trend="▲ 12% vs mes ant." up delay={280} />
            <View style={{ width: 10 }} />
            <MetricCard icon="⚠️" label="Por vencer (7 días)" value="$9,310" trend="▼ 8 préstamos" delay={320} />
          </View>
          <View style={{ height: 10 }} />
          <View style={s.row}>
            <MetricCard icon="📈" label="Tasa de cobro" value="94.2%" trend="▲ Excelente" up delay={360} />
            <View style={{ width: 10 }} />
            <MetricCard icon="🏦" label="Capital disponible" value="$32,000" trend="→ Listo para prestar" neu delay={400} />
          </View>

          {/* ── PIPELINE ─────────────────────────────── */}
          <Text style={s.sectionTitle}>Proceso de préstamos</Text>
          <Animated.View entering={FadeInDown.delay(440).springify()} style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <PipeStep label="Solicitud" count="34" state="done" />
              <View style={{ flex: 0.3, height: 2, backgroundColor: C.primary4, marginTop: -18 }} />
              <PipeStep label="Evaluación" count="28" state="done" />
              <View style={{ flex: 0.3, height: 2, backgroundColor: C.primary4, marginTop: -18 }} />
              <PipeStep label="Aprobación" count="11" state="active" />
              <View style={{ flex: 0.3, height: 2, backgroundColor: '#fde68a', marginTop: -18 }} />
              <PipeStep label="Desembolso" count="42" state="done" />
              <View style={{ flex: 0.3, height: 2, backgroundColor: C.primary4, marginTop: -18 }} />
              <PipeStep label="Al día" count="112" state="done" />
            </View>
          </Animated.View>

          {/* ── BAR CHART ────────────────────────────── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 6 }}>
            <Text style={s.sectionTitle}>Cobros mensuales</Text>
            <View style={{ backgroundColor: C.primary5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.primary2 }}>2025</Text>
            </View>
          </View>
          <Animated.View entering={FadeInDown.delay(490).springify()} style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 4 }}>
              {MONTHLY.map((d, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  {!d.forecast && <Text style={{ fontSize: 8, fontWeight: '700', color: d.peak ? C.primary2 : C.textMuted }}>${d.amt}k</Text>}
                  {d.forecast ? (
                    <View style={{ width: '100%', height: 30, borderRadius: 6, borderWidth: 1.5, borderColor: C.primary3, borderStyle: 'dashed' }} />
                  ) : (
                    <View style={{ width: '100%', height: d.h, borderRadius: 6, backgroundColor: d.peak ? C.primary2 : C.primary4 }} />
                  )}
                  <Text style={{ fontSize: 8, color: C.textMuted, fontWeight: '600' }}>{d.month}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── DONUT ────────────────────────────────── */}
          <Text style={s.sectionTitle}>Distribución de cartera</Text>
          <Animated.View entering={FadeInDown.delay(530).springify()} style={s.card}>
            <DonutChart />
          </Animated.View>

          {/* ── ACCIONES RÁPIDAS ─────────────────────── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Acciones rápidas</Text>
            <TouchableOpacity><Text style={{ fontSize: 11, color: C.primary2, fontWeight: '700' }}>Ver todo</Text></TouchableOpacity>
          </View>
          <View style={s.row}>
            <QuickAction icon="➕" label="Nuevo préstamo" sub="Registrar cliente" iconBg={C.primary5} onPress={() => go('Loans')} delay={590} />
            <View style={{ width: 10 }} />
            <QuickAction icon="📋" label="Cobros del día" sub="8 pendientes" iconBg="#fffbeb" onPress={() => go('Loans')} delay={620} />
          </View>
          <View style={{ height: 10 }} />
          <View style={s.row}>
            <QuickAction icon="💳" label="Registrar pago" sub="Marcar pagado" iconBg="#ecfdf5" onPress={() => go('Loans')} delay={650} />
            <View style={{ width: 10 }} />
            <QuickAction icon="🔔" label="Vencidos" sub="8 en mora" iconBg="#fef2f2" onPress={() => go('Loans')} delay={680} />
          </View>
          <View style={{ height: 10 }} />
          <View style={s.row}>
            <QuickAction icon="📊" label="Reportes" sub="Exportar PDF" iconBg="#f0fdf4" onPress={() => go('Settings')} delay={710} />
            <View style={{ width: 10 }} />
            <QuickAction icon="🔍" label="Evaluar solicitud" sub="11 en revisión" iconBg="#eff6ff" onPress={() => go('Loans')} delay={740} />
          </View>

          {/* ── PRÉSTAMOS RECIENTES ───────────────────── */}
          <View style={[s.sectionRow, { marginTop: 18 }]}>
            <Text style={s.sectionTitle}>Préstamos recientes</Text>
            <TouchableOpacity onPress={() => go('Loans')}>
              <Text style={{ fontSize: 11, color: C.primary2, fontWeight: '700' }}>Ver todos →</Text>
            </TouchableOpacity>
          </View>
          {loans.map((loan, i) => (
            <Animated.View
              key={loan.id}
              entering={SlideInRight.delay(780 + i * 60).springify()}
              layout={Layout.springify()}
            >
              <Pressable
                style={({ pressed }) => [s.loanRow, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <LoanAvatar name={loan.borrowerName} idx={i} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }} numberOfLines={1}>{loan.borrowerName}</Text>
                  <Text style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                    Cuota {i + 1}/12 · {new Date(loan.createdAt || Date.now()).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: C.text }}>{fmt(loan.amount)}</Text>
                  <StatusPill status={loan.status} />
                </View>
                <Ionicons name="chevron-forward" size={14} color={C.textMuted} style={{ marginLeft: 6 }} />
              </Pressable>
            </Animated.View>
          ))}

          <View style={{ height: 100 }} />
        </View>
      </RNAnimated.ScrollView>

      {/* ── BOTTOM NAV ───────────────────────────────── */}
      <View style={s.bottomNav}>
        {[
          { icon: 'grid-outline', label: 'Inicio', active: true },
          { icon: 'document-text-outline', label: 'Préstamos', active: false },
          { icon: 'add-circle', label: '', active: false, big: true },
          { icon: 'people-outline', label: 'Clientes', active: false },
          { icon: 'person-outline', label: 'Perfil', active: false },
        ].map((nav, i) => (
          <TouchableOpacity
            key={i}
            style={s.navItem}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons
              name={nav.icon as any}
              size={nav.big ? 34 : 22}
              color={nav.active || nav.big ? C.primary2 : C.textMuted}
            />
            {!nav.big && <Text style={[s.navLbl, nav.active && { color: C.primary2 }]}>{nav.label}</Text>}
            {nav.active && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary2, marginTop: 1 }} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  floatNav: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99,
    height: 88, paddingTop: 44,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  floatTitle: { fontSize: 15, fontWeight: '800', color: C.text },

  header: { paddingTop: 56, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 0 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: '#fbbf24', borderWidth: 1.5, borderColor: C.primary },

  balCard: { marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },

  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: 'white' },

  body: { padding: 16 },

  row: { flexDirection: 'row' },
  card: { backgroundColor: C.white, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 0.5, borderColor: C.border },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 10, marginTop: 6 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },

  loanRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 14, padding: 12,
    marginBottom: 8, borderWidth: 0.5, borderColor: C.border, gap: 10,
  },

  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.white,
    borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)',
    flexDirection: 'row', paddingBottom: 20, paddingTop: 8,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navLbl: { fontSize: 9, fontWeight: '600', color: C.textMuted },
});