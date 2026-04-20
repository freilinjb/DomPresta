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
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Text as SvgText, G, Line, Rect } from 'react-native-svg';
import { Loan } from '../../types';
import { LoanService } from '../../services/loanService';
import { MainTabParamList } from '../../navigation/types';

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

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;
interface HomeScreenProps { navigation: HomeScreenNavigationProp; }

// ─── Datos Mock (Conservados pero con estilo mejorado) ────────────
const MOCK_LOANS: Loan[] = [
  { id: '1', borrowerName: 'Juan Rodríguez Méndez', amount: 15750.50, status: 'active', createdAt: '2026-01-15' },
  { id: '2', borrowerName: 'María Pérez González', amount: 8250.00, status: 'pending', createdAt: '2026-03-20' },
  { id: '3', borrowerName: 'Carlos García López', amount: 22300.75, status: 'overdue', createdAt: '2025-11-10' },
  { id: '4', borrowerName: 'Ana Martínez Ruiz', amount: 12500.00, status: 'review', createdAt: '2026-04-05' },
  { id: '5', borrowerName: 'Roberto Fernández Marte', amount: 18750.25, status: 'active', createdAt: '2025-12-01' },
  { id: '6', borrowerName: 'Luisa Hernández Díaz', amount: 14300.00, status: 'active', createdAt: '2026-02-28' },
];

const MOCK_CLIENTS = [
  { id: '1', name: 'Elena Torres Vega', email: 'elena.torres@email.com', phone: '809-555-0123', loans: 3, totalAmount: 42500, status: 'active' },
  { id: '2', name: 'Miguel Ángel Cruz', email: 'miguel.cruz@email.com', phone: '809-555-0124', loans: 1, totalAmount: 15000, status: 'pending' },
  { id: '3', name: 'Laura Jiménez Paz', email: 'laura.jimenez@email.com', phone: '809-555-0125', loans: 5, totalAmount: 78250, status: 'active' },
  { id: '4', name: 'Ricardo Mora Silva', email: 'ricardo.mora@email.com', phone: '809-555-0126', loans: 2, totalAmount: 28900, status: 'overdue' },
];

const MOCK_REPORTS = [
  { id: '1', title: 'Reporte de Cobranzas - Abril 2026', date: '2026-04-15', type: 'collection', amount: 89500 },
  { id: '2', title: 'Análisis de Riesgo - Q1 2026', date: '2026-04-10', type: 'risk', score: 87 },
  { id: '3', title: 'Proyección de Crecimiento 2026', date: '2026-04-05', type: 'growth', growth: 23.5 },
];

const MONTHLY = [
  { month: 'Ene', amt: 12.5, h: 42 },
  { month: 'Feb', amt: 14.2, h: 48 },
  { month: 'Mar', amt: 16.8, h: 56 },
  { month: 'Abr', amt: 15.3, h: 52 },
  { month: 'May', amt: 19.5, h: 64 },
  { month: 'Jun', amt: 22.4, h: 72, peak: true },
  { month: 'Jul', amt: 18.7, h: 62, forecast: true },
  { month: 'Ago', amt: 0, h: 40, forecast: true },
];

const DONUT_SEGS = [
  { pct: 0.62, color: C.brandVibrant, label: 'Activos', count: 48 },
  { pct: 0.18, color: C.brandLight, label: 'Pendientes', count: 14 },
  { pct: 0.12, color: '#f87171', label: 'Vencidos', count: 9 },
  { pct: 0.08, color: C.successMid, label: 'Completados', count: 72 },
];

const AVATAR_PALETTES: [string, string][] = [
  ['#7c3aed', '#4f46e5'], ['#8b5cf6', '#06b6d4'], ['#f87171', '#f59e0b'],
  ['#059669', '#0891b2'], ['#7c3aed', '#059669'], ['#a78bfa', '#f59e0b'],
];

// ─── Componentes UI Reutilizables (Estilo LoanRequests) ───────────

// StatusBadge (Estilo exacto de la pantalla de Solicitudes)
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { label: string; bg: string; color: string; border: string; dot: string }> = {
    active:     { label: 'Al día',   bg: C.successBg,  color: C.successMid,  border: C.border,  dot: '#10b981' },
    pending:    { label: 'Pendiente', bg: C.warningBg,  color: C.warningMid,  border: C.border,  dot: '#f59e0b' },
    overdue:    { label: 'Vencido',  bg: C.dangerBg,   color: C.dangerMid,   border: C.border,  dot: '#ef4444' },
    review:     { label: 'En revisión', bg: C.infoBg,  color: C.infoMid,    border: C.border,  dot: '#0ea5e9' },
  };
  const cfg = config[status] || { label: status, bg: '#f1f5f9', color: '#475569', border: C.border, dot: '#94a3b8' };
  return (
    <View style={[badgeS.pill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
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

// Avatar (Estilo del formulario)
const Avatar: React.FC<{ name: string; index: number; size?: number }> = ({ name, index, size = 42 }) => {
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

// Tarjeta de Sección (Consistente con el diseño)
const SectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode; delay?: number }> = ({ title, icon, children, delay = 0 }) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()} style={secS.card}>
    <View style={secS.header}>
      <View style={secS.iconWrap}>
        <Ionicons name={icon as any} size={17} color={C.brandVibrant} />
      </View>
      <Text style={secS.title}>{title}</Text>
    </View>
    <View style={secS.divider} />
    {children}
  </Animated.View>
);
const secS = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.brandFaint, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16, marginBottom: 16 },
});

// ─── Gráficos SVG ─────────────────────────────────────────────────
const DonutChart: React.FC = () => {
  const R = 34;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 8 }}>
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
        <SvgText x={50} y={46} textAnchor="middle" fontSize={12} fontWeight="900" fill={C.text}>143</SvgText>
        <SvgText x={50} y={57} textAnchor="middle" fontSize={9} fill={C.textMuted} fontWeight="600">total</SvgText>
      </Svg>
      <View style={{ flex: 1, gap: 8 }}>
        {DONUT_SEGS.map((seg, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: seg.color }} />
            <Text style={{ flex: 1, fontSize: 11, color: C.textSec, fontWeight: '500' }}>{seg.label}</Text>
            <Text style={{ fontSize: 11, fontWeight: '800', color: C.text }}>{Math.round(seg.pct * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const BarChart: React.FC = () => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 4, paddingHorizontal: 4 }}>
    {MONTHLY.map((d, i) => (
      <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
        {!d.forecast && <Text style={{ fontSize: 9, fontWeight: '700', color: d.peak ? C.brandVibrant : C.textMuted }}>${d.amt}k</Text>}
        {d.forecast ? (
          <View style={{ width: '100%', height: d.h, borderRadius: 6, borderWidth: 1.5, borderColor: C.brandLight, borderStyle: 'dashed', backgroundColor: 'transparent' }} />
        ) : (
          <View style={{ width: '100%', height: d.h, borderRadius: 6, backgroundColor: d.peak ? C.brandVibrant : C.brandPale }} />
        )}
        <Text style={{ fontSize: 9, color: C.textMuted, fontWeight: '600' }}>{d.month}</Text>
      </View>
    ))}
  </View>
);

const LineChart: React.FC = () => {
  const data = [120, 145, 138, 162, 178, 195, 182];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  const height = 60;
  const widthChart = width - 100; 
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * widthChart;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <Svg width={widthChart} height={height} viewBox={`0 0 ${widthChart} ${height}`}>
      <Line points={points} stroke={C.brandVibrant} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * widthChart;
        const y = height - ((value - min) / range) * height;
        return <Circle key={index} cx={x} cy={y} r={4} fill={C.surface} stroke={C.brandVibrant} strokeWidth={2.5} />;
      })}
    </Svg>
  );
};

// ─── HomeScreen ───────────────────────────────────────────────────
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'Resumen' | 'Préstamos' | 'Clientes' | 'Reportes'>('Resumen');
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
    `RD$${v.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtShort = (v: number): string => {
    if (v >= 1_000_000) return `RD$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `RD$${(v / 1_000).toFixed(1)}K`;
    return `RD$${v.toFixed(0)}`;
  };

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
  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Resumen': return renderResumen();
      case 'Préstamos': return renderPrestamos();
      case 'Clientes': return renderClientes();
      case 'Reportes': return renderReportes();
    }
  };

  const renderResumen = () => (
    <>
      {/* Métricas Rápidas */}
      <View style={s.row}>
        <MetricCard icon="trending-up" label="Cobrado este mes" value="$22,450" trend="+15.2%" up delay={280} />
        <View style={{ width: 10 }} />
        <MetricCard icon="alert-circle" label="Por vencer" value="$11,280" trend="12 préstamos" neu delay={320} />
      </View>
      <View style={{ height: 10 }} />
      <View style={s.row}>
        <MetricCard icon="pie-chart" label="Tasa de cobro" value="96.8%" trend="Excelente" up delay={360} />
        <View style={{ width: 10 }} />
        <MetricCard icon="wallet" label="Disponible" value="$38.5K" trend="Listo" neu delay={400} />
      </View>

      {/* Pipeline */}
      <SectionCard title="Proceso de préstamos" icon="git-network-outline" delay={440}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
          <PipeStep label="Solicitud" count="42" state="done" />
          <PipeStep label="Evaluación" count="35" state="done" />
          <PipeStep label="Aprobación" count="18" state="active" />
          <PipeStep label="Desembolso" count="56" state="done" />
          <PipeStep label="Al día" count="143" state="done" />
        </View>
      </SectionCard>

      {/* Gráficos */}
      <SectionCard title="Tendencia de cobros" icon="bar-chart-outline" delay={470}>
        <LineChart />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 8 }}>
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <Text key={d} style={{ fontSize: 10, color: C.textMuted, fontWeight: '600' }}>{d}</Text>)}
        </View>
      </SectionCard>

      <SectionCard title="Cobros mensuales (2026)" icon="calendar-outline" delay={490}>
        <BarChart />
      </SectionCard>
    </>
  );

  const renderPrestamos = () => (
    <Animated.View entering={FadeIn.delay(200)}>
      <View style={s.row}>
        <StatBox label="Total préstamos" value={loans.length.toString()} color={C.text} />
        <StatBox label="Monto total" value={fmtShort(totalAmount)} color={C.successMid} />
      </View>
      <View style={s.row}>
        <StatBox label="Pendientes" value={pendingLoans.length.toString()} color={C.warningMid} />
        <StatBox label="Vencidos" value={overdueLoans.length.toString()} color={C.dangerMid} />
      </View>
      
      <Text style={[s.sectionTitle, { marginTop: 16 }]}>Todos los préstamos</Text>
      {loans.map((loan, i) => (
        <Animated.View key={loan.id} entering={SlideInRight.delay(300 + i * 60).springify()} layout={Layout.springify()}>
          <Pressable style={({ pressed }) => [s.loanRow, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]} onPress={() => go('Loans')}>
            <Avatar name={loan.borrowerName} index={i} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }} numberOfLines={1}>{loan.borrowerName}</Text>
              <Text style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                ID: #{loan.id} · {new Date(loan.createdAt || Date.now()).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: C.text }}>{fmt(loan.amount)}</Text>
              <StatusBadge status={loan.status} />
            </View>
          </Pressable>
        </Animated.View>
      ))}
    </Animated.View>
  );

  const renderClientes = () => (
    <Animated.View entering={FadeIn.delay(200)}>
      <SectionCard title="Clientes destacados" icon="people-outline" delay={300}>
        {MOCK_CLIENTS.map((client, i) => (
          <Pressable key={client.id} style={({ pressed }) => [s.listItem, pressed && { opacity: 0.7 }]}>
            <Avatar name={client.name} index={i} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{client.name}</Text>
              <Text style={{ fontSize: 10, color: C.textMuted }}>{client.email}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: C.brandVibrant }}>{client.loans} prést.</Text>
            </View>
          </Pressable>
        ))}
      </SectionCard>
    </Animated.View>
  );

  const renderReportes = () => (
    <Animated.View entering={FadeIn.delay(200)}>
      <SectionCard title="Reportes generados" icon="document-text-outline" delay={300}>
        {MOCK_REPORTS.map((report, i) => (
          <Pressable key={report.id} style={({ pressed }) => [s.listItem, pressed && { opacity: 0.7 }]}>
            <View style={[secS.iconWrap, { width: 40, height: 40 }]}>
              <Ionicons name="document-text" size={18} color={C.brandVibrant} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{report.title}</Text>
              <Text style={{ fontSize: 10, color: C.textMuted }}>{report.date}</Text>
            </View>
          </Pressable>
        ))}
      </SectionCard>
    </Animated.View>
  );

  // Componentes internos (MetricCard, StatBox, PipeStep)
  const MetricCard: React.FC<{ icon: string; label: string; value: string; trend: string; up?: boolean; neu?: boolean; delay?: number }> = 
    ({ icon, label, value, trend, up, neu, delay = 0 }) => {
    const fg = neu ? C.brandVibrant : up ? C.successMid : C.dangerMid;
    const bg = neu ? C.brandFaint : up ? C.successBg : C.dangerBg;
    return (
      <Animated.View entering={FadeInDown.delay(delay).springify()} style={[secS.card, { flex: 1, padding: 14 }]}>
        <Ionicons name={icon as any} size={20} color={C.brandVibrant} style={{ marginBottom: 12 }} />
        <Text style={{ fontSize: 18, fontWeight: '900', color: C.text, letterSpacing: -0.5 }}>{value}</Text>
        <Text style={{ fontSize: 11, color: C.textMuted, fontWeight: '600', marginTop: 2 }}>{label}</Text>
        <View style={{ marginTop: 8, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: bg, borderRadius: 8, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: fg }}>{trend}</Text>
        </View>
      </Animated.View>
    );
  };

  const StatBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <View style={[secS.card, { flex: 1, alignItems: 'center', paddingVertical: 16, marginHorizontal: 5 }]}>
      <Text style={{ fontSize: 22, fontWeight: '900', color: color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: C.textMuted, fontWeight: '600', marginTop: 4 }}>{label}</Text>
    </View>
  );

  const PipeStep: React.FC<{ label: string; count: string; state: 'done' | 'active' | 'next' }> = ({ label, count, state }) => {
    const bgC = state === 'done' ? C.brandVibrant : state === 'active' ? C.gold : '#f3f4f6';
    const txtC = state === 'next' ? '#9ca3af' : 'white';
    const valC = state === 'done' ? C.brandVibrant : state === 'active' ? C.warningMid : '#9ca3af';
    return (
      <View style={{ flex: 1, alignItems: 'center' }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: bgC, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: txtC }}>{state === 'done' ? '✓' : state === 'active' ? '!' : '○'}</Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: '800', color: valC }}>{count}</Text>
        <Text style={{ fontSize: 8, color: C.textSec, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <RNAnimated.View style={[s.floatNav, { opacity: navOpacity }]} pointerEvents="box-none">
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={s.floatRow}>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.getParent?.()?.openDrawer()}>
            <Ionicons name="menu-outline" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.floatTitle}>Dashboard</Text>
          <TouchableOpacity style={s.navBtn} onPress={() => go('LoanRequestForm' as any)}>
            <Ionicons name="add" size={20} color={C.brandVibrant} />
          </TouchableOpacity>
        </View>
      </RNAnimated.View>

      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brandVibrant} colors={[C.brandVibrant]} />}
      >
        <LinearGradient colors={[C.brand, C.brandMid, C.brandVibrant]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
          <View style={s.decCircle1} /><View style={s.decCircle2} />
          
          <View style={s.headerTop}>
            <TouchableOpacity style={s.navBtnWhite} onPress={() => navigation.getParent?.()?.openDrawer()}>
              <Ionicons name="menu-outline" size={20} color="white" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.headerLabel}>{greeting} 👋</Text>
              <Text style={s.headerTitle}>Carlos Méndez</Text>
            </View>
            <TouchableOpacity style={s.navBtnWhite} onPress={() => go('LoanRequestForm' as any)}>
              <Ionicons name="notifications-outline" size={20} color="white" />
              <View style={s.notifDot} />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.balCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 4 }}>Cartera Total Activa</Text>
                <Text style={{ fontSize: 30, fontWeight: '900', color: 'white', letterSpacing: -1 }}>{fmtShort(totalAmount)}</Text>
              </View>
              <Ionicons name="wallet-outline" size={24} color="rgba(255,255,255,0.8)" />
            </View>
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 14 }} />
            <View style={{ flexDirection: 'row' }}>
              {[
                { num: activeLoans.length, lbl: 'Activos' },
                { num: pendingLoans.length, lbl: 'Pendientes' },
                { num: overdueLoans.length, lbl: 'Vencidos' },
                { num: loans.length, lbl: 'Total' },
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
          <View style={{ flexDirection: 'row', marginTop: 16, paddingHorizontal: 8 }}>
            {(['Resumen', 'Préstamos', 'Clientes', 'Reportes'] as const).map((tab) => (
              <TouchableOpacity 
                key={tab} 
                style={[s.tab, activeTab === tab && s.tabActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab);
                }}
              >
                <Text style={[{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' }, activeTab === tab && { color: 'white' }]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        <View style={s.body}>
          {renderTabContent()}

          {/* Donut Chart (Siempre visible al final del Resumen) */}
          {activeTab === 'Resumen' && (
            <SectionCard title="Distribución de cartera" icon="pie-chart-outline" delay={530}>
              <DonutChart />
            </SectionCard>
          )}

          {/* Acciones Rápidas (Solo en Resumen) */}
          {activeTab === 'Resumen' && (
            <>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Acciones rápidas</Text>
              </View>
              <View style={s.row}>
                <QuickAction icon="add-circle" label="Nuevo préstamo" sub="Registrar" bg={C.brandFaint} onPress={() => go('LoanRequestForm' as any)} delay={590} />
                <View style={{ width: 10 }} />
                <QuickAction icon="cash" label="Registrar pago" sub="Marcar pagado" bg={C.successBg} onPress={() => go('Loans')} delay={620} />
              </View>
              <View style={{ height: 10 }} />
              <View style={s.row}>
                <QuickAction icon="alert-circle" label="Vencidos" sub="9 en mora" bg={C.dangerBg} onPress={() => setActiveTab('Préstamos')} delay={650} />
                <View style={{ width: 10 }} />
                <QuickAction icon="document-text" label="Reportes" sub="Exportar" bg={C.infoBg} onPress={() => go('Settings')} delay={680} />
              </View>
            </>
          )}

          <View style={{ height: 80 }} />
        </View>
      </RNAnimated.ScrollView>
    </View>
  );
};

// Componente QuickAction (Refinado)
const QuickAction: React.FC<{ icon: string; label: string; sub: string; bg: string; onPress: () => void; delay?: number }> = 
  ({ icon, label, sub, bg, onPress, delay = 0 }) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()} style={{ flex: 1 }}>
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={({ pressed }) => [qS.btn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
    >
      <View style={[qS.ic, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={20} color={C.brandVibrant} />
      </View>
      <Text style={qS.nm}>{label}</Text>
      <Text style={qS.sb}>{sub}</Text>
    </Pressable>
  </Animated.View>
);
const qS = StyleSheet.create({
  btn: { backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, flex: 1 },
  ic: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  nm: { fontSize: 12, fontWeight: '700', color: C.text },
  sb: { fontSize: 10, color: C.textMuted, marginTop: 2, fontWeight: '500' },
});

// ─── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  floatNav: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99, height: 94, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  floatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  floatTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  header: { paddingTop: 56, paddingBottom: 20, overflow: 'hidden' },
  decCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40 },
  decCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 20, left: -20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 18 },
  navBtnWhite: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: '#fbbf24', borderWidth: 1.5, borderColor: C.brand },
  headerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  
  balCard: { marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: 'white' },

  body: { padding: 12 },
  row: { flexDirection: 'row', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 10, letterSpacing: -0.2 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 6 },
  
  loanRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 14, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: C.border, gap: 10,
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
});