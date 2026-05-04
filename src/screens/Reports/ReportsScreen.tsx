// ReportsScreen.tsx - Adaptada al diseño unificado
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated as RNAnimated,
  RefreshControl,
  Share,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  FadeInDown,
  FadeInRight,
  SlideInRight,
  ZoomIn,
  Layout,
  FadeIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Loan } from "../../types";
import { RootStackParamList } from "../../navigation/types";
import { loanService } from "../../services/loanService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Design Tokens (Unificado con todas las pantallas) ─────────────────────────
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
  orange: '#ea580c',
  orangeBg: '#fff7ed',
  pink: '#db2777',
  pinkBg: '#fdf2f8',
  shadow: 'rgba(109,40,217,0.12)',
};

type ReportsScreenNavigationProp = StackNavigationProp<RootStackParamList, "Reports">;

interface ReportsScreenProps {
  navigation: ReportsScreenNavigationProp;
}

// ─── Tipos ─────────────────────────────────────────────────────────
interface ReportSummary {
  totalLoans: number;
  activeLoans: number;
  pendingLoans: number;
  overdueLoans: number;
  completedLoans: number;
  totalAmount: number;
  totalInterest: number;
  totalPayments: number;
  totalPaid: number;
  totalPending: number;
  averageInterestRate: number;
  defaultRate: number;
  collectionRate: number;
  monthlyCollections: { month: string; amount: number }[];
  loansByType: { type: string; count: number; amount: number }[];
  topBorrowers: { name: string; amount: number; status: string }[];
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  type: "general" | "financial" | "collection" | "risk" | "customer" | "custom";
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  { id: "general", name: "Reporte General", description: "Resumen completo de todos los préstamos", icon: "document-text", color: C.brandVibrant, bgColor: C.brandFaint, type: "general" },
  { id: "financial", name: "Reporte Financiero", description: "Análisis de ingresos y rentabilidad", icon: "cash", color: C.successMid, bgColor: C.successBg, type: "financial" },
  { id: "collection", name: "Reporte de Cobranzas", description: "Seguimiento de pagos pendientes", icon: "alert-circle", color: C.warningMid, bgColor: C.warningBg, type: "collection" },
  { id: "risk", name: "Análisis de Riesgo", description: "Evaluación de riesgo de cartera", icon: "shield-checkmark", color: C.dangerMid, bgColor: C.dangerBg, type: "risk" },
  { id: "customer", name: "Reporte por Cliente", description: "Historial por cliente", icon: "people", color: C.infoMid, bgColor: C.infoBg, type: "customer" },
  { id: "custom", name: "Reporte Personalizado", description: "Crea un reporte a tu medida", icon: "settings", color: C.pink, bgColor: C.pinkBg, type: "custom" },
];

// ─── Avatar (Estilo unificado) ────────────────────────────────────
const AVATAR_PALETTES: [string, string][] = [
  ['#7c3aed', '#4f46e5'], ['#8b5cf6', '#06b6d4'], ['#f87171', '#f59e0b'],
  ['#059669', '#0891b2'], ['#7c3aed', '#059669'], ['#a78bfa', '#f59e0b'],
];

const Avatar: React.FC<{ name: string; index: number; size?: number }> = ({ name, index, size = 40 }) => {
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
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

// ─── Status Badge (Estilo unificado) ───────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    active: { label: 'Activo', bg: C.successBg, color: C.successMid, dot: '#10b981' },
    pending: { label: 'Pendiente', bg: C.warningBg, color: C.warningMid, dot: '#f59e0b' },
    overdue: { label: 'Vencido', bg: C.dangerBg, color: C.dangerMid, dot: '#ef4444' },
    paid: { label: 'Completado', bg: C.infoBg, color: C.infoMid, dot: '#0284c7' },
    completed: { label: 'Completado', bg: C.infoBg, color: C.infoMid, dot: '#0284c7' },
    cancelled: { label: 'Cancelado', bg: C.bg, color: C.textMuted, dot: C.textMuted },
  };
  const cfg = config[status] ?? { label: status, bg: C.bg, color: C.textMuted, dot: C.textMuted };
  return (
    <View style={[badgeS.pill, { backgroundColor: cfg.bg }]}>
      <View style={[badgeS.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[badgeS.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const badgeS = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 0.1 },
});

// ─── Stat Card (Estilo unificado) ─────────────────────────────────
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
  trend?: { value: number; isUp: boolean };
  onPress?: () => void;
}> = ({ title, value, icon, color, bgColor, trend, onPress }) => (
  <Animated.View entering={FadeInDown.delay(100).springify()}>
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
      style={[statS.card, { backgroundColor: bgColor, borderColor: C.border }]}
    >
      <View style={statS.header}>
        <View style={[statS.iconRing, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        {trend && (
          <View style={[statS.trend, { backgroundColor: trend.isUp ? C.successBg : C.dangerBg }]}>
            <Ionicons name={trend.isUp ? "trending-up" : "trending-down"} size={12} color={trend.isUp ? C.successMid : C.dangerMid} />
            <Text style={[statS.trendText, { color: trend.isUp ? C.successMid : C.dangerMid }]}>{trend.value}%</Text>
          </View>
        )}
      </View>
      <Text style={statS.value}>{value}</Text>
      <Text style={statS.title}>{title}</Text>
    </TouchableOpacity>
  </Animated.View>
);

const statS = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  iconRing: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  trend: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 3 },
  trendText: { fontSize: 10, fontWeight: "700" },
  value: { fontSize: 22, fontWeight: "800", color: C.text, letterSpacing: -0.5, marginBottom: 2 },
  title: { fontSize: 11, color: C.textMuted, fontWeight: "500" },
});

// ─── Report Template Card (Estilo unificado) ───────────────────────
const ReportTemplateCard: React.FC<{ template: ReportTemplate; onPress: () => void; index: number }> = ({ template, onPress, index }) => (
  <Animated.View entering={SlideInRight.delay(200 + index * 50).springify()}>
    <TouchableOpacity style={[templateS.card, { borderColor: C.border }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}>
      <View style={[templateS.iconWrap, { backgroundColor: template.bgColor }]}>
        <Ionicons name={template.icon as any} size={24} color={template.color} />
      </View>
      <View style={templateS.info}>
        <Text style={templateS.name}>{template.name}</Text>
        <Text style={templateS.description} numberOfLines={2}>{template.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
    </TouchableOpacity>
  </Animated.View>
);

const templateS = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1 },
  iconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 14 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 3 },
  description: { fontSize: 11, color: C.textMuted, lineHeight: 15 },
});

// ─── Loan Report Item (Estilo unificado) ───────────────────────────
const LoanReportItem: React.FC<{ loan: Loan; onGenerate: () => void; index: number }> = ({ loan, onGenerate, index }) => {
  const formatCurrency = (v: number) => `RD$${v.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  const statusColors: Record<string, string> = {
    active: C.successMid, pending: C.warningMid, overdue: C.dangerMid, completed: C.infoMid,
  };

  return (
    <Animated.View entering={FadeInRight.delay(300 + index * 50).springify()}>
      <View style={[loanItemS.container, { borderColor: C.border }]}>
        <View style={loanItemS.header}>
          <View style={loanItemS.borrowerInfo}>
            <Avatar name={loan.borrowerName} index={index} size={42} />
            <View>
              <Text style={loanItemS.name}>{loan.borrowerName}</Text>
              <Text style={loanItemS.date}>{new Date(loan.createdAt).toLocaleDateString('es-DO')}</Text>
            </View>
          </View>
          <StatusBadge status={loan.status} />
        </View>
        <View style={loanItemS.amountRow}>
          <Text style={loanItemS.amountLabel}>Monto</Text>
          <Text style={loanItemS.amount}>{formatCurrency(loan.amount)}</Text>
        </View>
        <TouchableOpacity style={[loanItemS.actionBtn, { backgroundColor: C.brandFaint }]} onPress={onGenerate}>
          <Ionicons name="document-text" size={16} color={C.brandVibrant} />
          <Text style={[loanItemS.actionText, { color: C.brandVibrant }]}>Generar Reporte</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const loanItemS = StyleSheet.create({
  container: { backgroundColor: C.surface, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  borrowerInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 2 },
  date: { fontSize: 10, color: C.textMuted },
  amountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  amountLabel: { fontSize: 12, color: C.textMuted },
  amount: { fontSize: 16, fontWeight: "800", color: C.text },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  actionText: { fontSize: 12, fontWeight: "600" },
});

// ─── Section Header (Estilo unificado) ─────────────────────────────
const SectionHeader: React.FC<{ title: string; icon: string; action?: { label: string; onPress: () => void } }> = ({ title, icon, action }) => (
  <View style={sectionS.container}>
    <View style={sectionS.left}>
      <View style={sectionS.iconWrap}>
        <Ionicons name={icon as any} size={16} color={C.brandVibrant} />
      </View>
      <Text style={sectionS.title}>{title}</Text>
    </View>
    {action && (
      <TouchableOpacity onPress={action.onPress}>
        <Text style={sectionS.action}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const sectionS = StyleSheet.create({
  container: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 6 },
  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.brandFaint, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "800", color: C.text },
  action: { fontSize: 12, fontWeight: "600", color: C.brandVibrant },
});

// ─── Main Component ─────────────────────────────────────────────────
export const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  useEffect(() => {
    loadLoans();
    navigation.setOptions({ headerShown: false });
  }, []);

  const calculateSummary = (loans: Loan[]): ReportSummary => {
    const totalLoans = loans.length;
    const activeLoans = loans.filter(l => l.status === 'active').length;
    const pendingLoans = loans.filter(l => l.status === 'pending').length;
    const overdueLoans = loans.filter(l => l.status === 'overdue').length;
    const completedLoans = loans.filter(l => l.status === 'paid').length;
    const totalAmount = loans.reduce((sum, l) => sum + l.amount, 0);
    const totalInterest = loans.reduce((sum, l) => sum + (l.totalInterest || 0), 0);
    const totalPaid = loans.reduce((sum, l) => sum + (l.totalAmount - (l.remainingBalance || 0)), 0);
    const totalPending = totalAmount - totalPaid;
    const averageInterestRate = totalLoans > 0 ? loans.reduce((sum, l) => sum + l.interestRate, 0) / totalLoans : 0;
    const defaultRate = totalLoans > 0 ? (overdueLoans / totalLoans) * 100 : 0;
    const collectionRate = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

    // Monthly collections (simplified: group by month of createdAt)
    const monthlyMap = new Map<string, number>();
    loans.forEach(loan => {
      const month = new Date(loan.createdAt).toLocaleDateString('es-DO', { month: 'short' });
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + loan.amount);
    });
    const monthlyCollections = Array.from(monthlyMap.entries()).map(([month, amount]) => ({ month, amount }));

    // Loans by type
    const typeMap = new Map<string, { count: number; amount: number }>();
    loans.forEach(loan => {
      const type = loan.loanTypeName || 'Otro';
      const existing = typeMap.get(type) || { count: 0, amount: 0 };
      typeMap.set(type, { count: existing.count + 1, amount: existing.amount + loan.amount });
    });
    const loansByType = Array.from(typeMap.entries()).map(([type, data]) => ({ type, ...data }));

    // Top borrowers
    const borrowerMap = new Map<string, { amount: number; status: string }>();
    loans.forEach(loan => {
      const name = loan.borrowerName || 'Desconocido';
      const existing = borrowerMap.get(name);
      if (!existing || loan.amount > existing.amount) {
        borrowerMap.set(name, { amount: loan.amount, status: loan.status });
      }
    });
    const topBorrowers = Array.from(borrowerMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    return {
      totalLoans,
      activeLoans,
      pendingLoans,
      overdueLoans,
      completedLoans,
      totalAmount,
      totalInterest,
      totalPayments: 0, // Placeholder
      totalPaid,
      totalPending,
      averageInterestRate,
      defaultRate,
      collectionRate,
      monthlyCollections,
      loansByType,
      topBorrowers,
    };
  };

  const loadLoans = async () => {
    try {
      const fetchedLoans = await loanService.getAll();
      setLoans(fetchedLoans);
      const calculatedSummary = calculateSummary(fetchedLoans);
      setSummary(calculatedSummary);
    } catch (error) {
      console.error('Error loading loans:', error);
      Alert.alert("Error", "No se pudieron cargar los préstamos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => { setRefreshing(true); loadLoans(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  const formatCurrency = (v: number) => `RD$${v.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

  const handleGenerateReport = async (reportId: string, reportName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGeneratingReport(reportId);
    try {
      await new Promise(r => setTimeout(r, 1500));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ Reporte Generado", `"${reportName}" generado exitosamente.`);
    } catch { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); Alert.alert("Error", "No se pudo generar el reporte"); }
    finally { setGeneratingReport(null); }
  };

  const chartData = useMemo(() => ({
    labels: summary?.monthlyCollections.map(m => m.month) || [],
    datasets: [{ data: summary?.monthlyCollections.map(m => m.amount) || [], color: (opacity = 1) => `rgba(109, 40, 217, ${opacity})`, strokeWidth: 2 }],
  }), [summary]);

  const pieData = useMemo(() => summary?.loansByType.map((item, i) => ({
    name: item.type, amount: item.amount,
    color: [C.brandVibrant, C.successMid, C.warningMid, C.infoMid, C.orange][i % 5],
    legendFontColor: C.textMuted, legendFontSize: 10,
  })) || [], [summary]);

  const navOpacity = scrollY.interpolate({ inputRange: [0, 80], outputRange: [0, 1], extrapolate: "clamp" });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <LinearGradient colors={[C.brand, C.brandMid, C.brandVibrant]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }} />
        <Animated.View entering={ZoomIn.duration(400)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 76, height: 76, borderRadius: 22, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="stats-chart" size={36} color={C.brandVibrant} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 16 }}>Cargando reportes…</Text>
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

      {/* Floating Header */}
      <RNAnimated.View style={[s.floatNav, { opacity: navOpacity }]} pointerEvents="box-none">
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={s.floatRow}>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.floatTitle}>Reportes</Text>
          <TouchableOpacity style={[s.navBtn, { backgroundColor: C.brandFaint }]} onPress={() => setShowCustomModal(true)}>
            <Ionicons name="options-outline" size={20} color={C.brandVibrant} />
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
          <View style={s.decCircle1} /><View style={s.decCircle2} />
          <View style={s.headerTop}>
            <TouchableOpacity style={s.navBtnWhite} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.headerLabel}>ANÁLISIS</Text>
              <Text style={s.headerTitle}>Reportes</Text>
            </View>
            <TouchableOpacity style={s.navBtnWhite} onPress={() => setShowCustomModal(true)}>
              <Ionicons name="options-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.headerSummary}>
            <Text style={s.headerSummaryText}>{summary ? `${summary.totalLoans} préstamos • ${formatCurrency(summary.totalAmount)} en cartera` : 'Cargando...'}</Text>
          </Animated.View>
        </LinearGradient>

        <View style={s.body}>
          {/* Stats Grid */}
          <View style={s.statsGrid}>
            <StatCard title="Total Préstamos" value={summary?.totalLoans || 0} icon="document-text" color={C.brandVibrant} bgColor={C.surface} trend={{ value: 8, isUp: true }} />
            <View style={{ width: 10 }} />
            <StatCard title="Tasa de Cobro" value={`${summary?.collectionRate.toFixed(1) || 0}%`} icon="checkmark-circle" color={C.successMid} bgColor={C.surface} trend={{ value: 3, isUp: true }} />
          </View>
          <View style={s.statsGrid}>
            <StatCard title="Monto Total" value={formatCurrency(summary?.totalAmount || 0)} icon="cash" color={C.warningMid} bgColor={C.surface} />
            <View style={{ width: 10 }} />
            <StatCard title="Pendiente" value={formatCurrency(summary?.totalPending || 0)} icon="time" color={C.dangerMid} bgColor={C.surface} />
          </View>

          {/* Chart: Monthly Collections */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <View style={[s.chartCard, { borderColor: C.border }]}>
              <View style={s.chartHeader}>
                <Text style={s.chartTitle}>Cobranzas Mensuales</Text>
                <View style={s.chartBadge}><Text style={s.chartBadgeText}>2026</Text></View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ width: Math.max(SCREEN_WIDTH - 64, (chartData?.labels?.length || 0) * 50), height: 180, backgroundColor: C.surface, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: C.textMuted, fontSize: 14 }}>Gráfico de cobranzas mensuales</Text>
                  <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 8 }}>Próximamente disponible</Text>
                </View>
              </ScrollView>
            </View>
          </Animated.View>

          {/* Pie Chart: Distribution */}
          <Animated.View entering={FadeInDown.delay(180).springify()}>
            <View style={[s.chartCard, { borderColor: C.border }]}>
              <Text style={s.chartTitle}>Distribución por Tipo</Text>
              <View style={{ width: SCREEN_WIDTH - 64, height: 180, backgroundColor: C.surface, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: C.textMuted, fontSize: 14 }}>Gráfico de distribución por tipo</Text>
                <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 8 }}>Próximamente disponible</Text>
              </View>
            </View>
          </Animated.View>

          {/* Report Templates */}
          <SectionHeader title="Plantillas de Reportes" icon="document-text" />
          {REPORT_TEMPLATES.map((template, i) => (
            <ReportTemplateCard key={template.id} template={template} index={i} onPress={() => handleGenerateReport(template.id, template.name)} />
          ))}

          {/* Top Borrowers */}
          <SectionHeader title="Top Prestatarios" icon="trophy" />
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <View style={[s.topCard, { borderColor: C.border }]}>
              {(summary?.topBorrowers || []).map((borrower, i) => (
                <View key={i} style={[s.topRow, i < (summary?.topBorrowers.length || 0) - 1 && s.topBorder]}>
                  <View style={s.topRank}><Text style={[s.topRankText, i < 3 && { color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32' }]}>#{i + 1}</Text></View>
                  <View style={s.topInfo}>
                    <Text style={s.topName}>{borrower.name}</Text>
                    <View style={[s.statusDot, { backgroundColor: borrower.status === 'active' ? C.successMid : C.dangerMid }]} />
                  </View>
                  <Text style={s.topAmount}>{formatCurrency(borrower.amount)}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Loan Reports */}
          <SectionHeader title="Reportes por Préstamo" icon="list" />
          {loans.slice(0, 5).map((loan, i) => (
            <LoanReportItem key={loan.id} loan={loan} index={i} onGenerate={() => handleGenerateReport(loan.id, `Préstamo ${loan.borrowerName}`)} />
          ))}
          {loans.length > 5 && (
            <TouchableOpacity style={s.viewMore}><Text style={s.viewMoreText}>Ver más préstamos</Text><Ionicons name="chevron-down" size={14} color={C.brandVibrant} /></TouchableOpacity>
          )}

          {/* Info Card */}
          <Animated.View entering={FadeInDown.delay(350).springify()}>
            <View style={[s.infoCard, { backgroundColor: C.infoBg, borderColor: C.infoMid + '30' }]}>
              <View style={s.infoHeader}><Ionicons name="information-circle" size={18} color={C.infoMid} /><Text style={s.infoTitle}>Información</Text></View>
              <Text style={s.infoText}>Los reportes se generan en formato PDF con información detallada de préstamos, pagos y estadísticas financieras.</Text>
            </View>
          </Animated.View>

          <View style={{ height: 100 }} />
        </View>
      </RNAnimated.ScrollView>

      {/* Custom Report Modal */}
      <Modal visible={showCustomModal} transparent animationType="fade" onRequestClose={() => setShowCustomModal(false)}>
        <BlurView intensity={100} tint="dark" style={modalS.overlay}>
          <Animated.View entering={ZoomIn.duration(200)} style={modalS.content}>
            <View style={modalS.header}>
              <Text style={modalS.title}>Reporte Personalizado</Text>
              <TouchableOpacity onPress={() => setShowCustomModal(false)}><Ionicons name="close" size={22} color={C.text} /></TouchableOpacity>
            </View>
            <View style={modalS.body}>
              <Text style={modalS.label}>Rango de fechas</Text>
              <View style={modalS.dateRow}>
                <TextInput style={modalS.dateInput} placeholder="Fecha inicio" placeholderTextColor={C.textPlaceholder} />
                <Text style={modalS.dateSep}>-</Text>
                <TextInput style={modalS.dateInput} placeholder="Fecha fin" placeholderTextColor={C.textPlaceholder} />
              </View>
            </View>
            <View style={modalS.footer}>
              <TouchableOpacity style={modalS.cancelBtn} onPress={() => setShowCustomModal(false)}><Text style={modalS.cancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={modalS.generateBtn} onPress={() => { setShowCustomModal(false); handleGenerateReport("custom", "Reporte Personalizado"); }}><Text style={modalS.generateText}>Generar</Text></TouchableOpacity>
            </View>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* Loading Overlay */}
      {generatingReport && (
        <View style={loadS.overlay}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Animated.View entering={ZoomIn.duration(200)} style={loadS.content}>
            <ActivityIndicator size="large" color={C.brandVibrant} />
            <Text style={loadS.text}>Generando reporte...</Text>
            <Text style={loadS.subtext}>Esto puede tomar unos segundos</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

// ─── Styles (Unificados) ───────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  floatNav: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99, height: 94, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  floatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  floatTitle: { fontSize: 15, fontWeight: '800', color: C.text, flex: 1, textAlign: 'center' },
  navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20, overflow: 'hidden' },
  decCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40 },
  decCircle2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 10, left: -30 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  navBtnWhite: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 2, marginBottom: 2, textAlign: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.4, textAlign: 'center' },
  headerSummary: { alignItems: 'center' },
  headerSummaryText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  body: { padding: 16 },
  statsGrid: { flexDirection: 'row', marginBottom: 10 },
  chartCard: { backgroundColor: C.surface, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  chartBadge: { backgroundColor: C.brandFaint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  chartBadgeText: { fontSize: 10, fontWeight: '600', color: C.brandVibrant },
  chart: { borderRadius: 16 },
  topCard: { backgroundColor: C.surface, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  topBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  topRank: { width: 38 },
  topRankText: { fontSize: 13, fontWeight: '700', color: C.textMuted },
  topInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  topName: { fontSize: 13, fontWeight: '600', color: C.text },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  topAmount: { fontSize: 13, fontWeight: '700', color: C.text },
  viewMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12 },
  viewMoreText: { fontSize: 12, fontWeight: '600', color: C.brandVibrant },
  infoCard: { borderRadius: 18, padding: 16, marginTop: 8, borderWidth: 1 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: C.infoMid },
  infoText: { fontSize: 12, color: C.textSec, lineHeight: 18 },
});

const modalS = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { backgroundColor: C.surface, borderRadius: 24, padding: 20, width: '100%', maxWidth: 400 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800', color: C.text },
  body: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: C.textSec, marginBottom: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateInput: { flex: 1, backgroundColor: C.brandFaint, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text },
  dateSep: { fontSize: 14, color: C.textMuted },
  footer: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  cancelText: { fontSize: 14, fontWeight: '600', color: C.textSec },
  generateBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: C.brandVibrant },
  generateText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

const loadS = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  content: { backgroundColor: C.surface, borderRadius: 24, padding: 32, alignItems: 'center' },
  text: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 16 },
  subtext: { fontSize: 12, color: C.textMuted, marginTop: 4 },
});