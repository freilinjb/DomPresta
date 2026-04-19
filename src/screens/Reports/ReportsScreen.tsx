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
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LineChart, PieChart, BarChart } from "react-native-chart-kit";
import { Loan } from "../../types";
import { RootStackParamList } from "../../navigation/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Theme ────────────────────────────────────────────────────────
const C = {
  primary: "#5b21b6",
  primary2: "#7c3aed",
  primary3: "#a78bfa",
  primary4: "#ddd6fe",
  primary5: "#f5f3ff",
  bg: "#f5f3ff",
  white: "#ffffff",
  text: "#1e1b4b",
  textSub: "#64748b",
  textMuted: "#94a3b8",
  border: "rgba(0,0,0,0.06)",
  success: "#059669",
  successBg: "#ecfdf5",
  warning: "#d97706",
  warningBg: "#fffbeb",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  info: "#0284c7",
  infoBg: "#f0f9ff",
  orange: "#f97316",
  orangeBg: "#fff7ed",
  pink: "#ec4899",
  pinkBg: "#fdf2f8",
  teal: "#14b8a6",
  tealBg: "#f0fdfa",
};

type ReportsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Reports"
>;

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

// ─── Datos Mock Mejorados ──────────────────────────────────────────
const MOCK_LOANS: Loan[] = [
  {
    id: "1",
    borrowerName: "Juan Rodríguez Méndez",
    amount: 15750.5,
    status: "active",
    createdAt: "2026-01-15",
    interestRate: 12,
    term: 6,
  },
  {
    id: "2",
    borrowerName: "María Pérez González",
    amount: 8250.0,
    status: "pending",
    createdAt: "2026-03-20",
    interestRate: 20,
    term: 30,
  },
  {
    id: "3",
    borrowerName: "Carlos García López",
    amount: 22300.75,
    status: "overdue",
    createdAt: "2025-11-10",
    interestRate: 15,
    term: 12,
  },
  {
    id: "4",
    borrowerName: "Ana Martínez Ruiz",
    amount: 12500.0,
    status: "review",
    createdAt: "2026-04-05",
    interestRate: 10,
    term: 8,
  },
  {
    id: "5",
    borrowerName: "Roberto Fernández Marte",
    amount: 18750.25,
    status: "active",
    createdAt: "2025-12-01",
    interestRate: 18,
    term: 10,
  },
  {
    id: "6",
    borrowerName: "Luisa Hernández Díaz",
    amount: 14300.0,
    status: "active",
    createdAt: "2026-02-28",
    interestRate: 14,
    term: 12,
  },
  {
    id: "7",
    borrowerName: "Pedro Sánchez Vega",
    amount: 9200.5,
    status: "pending",
    createdAt: "2026-04-12",
    interestRate: 22,
    term: 15,
  },
  {
    id: "8",
    borrowerName: "Sofía Ramírez Castro",
    amount: 31200.0,
    status: "overdue",
    createdAt: "2025-10-15",
    interestRate: 25,
    term: 20,
  },
  {
    id: "9",
    borrowerName: "Diego Morales Ruiz",
    amount: 6850.0,
    status: "completed",
    createdAt: "2025-08-01",
    interestRate: 15,
    term: 6,
  },
  {
    id: "10",
    borrowerName: "Carmen Vega Torres",
    amount: 9800.0,
    status: "active",
    createdAt: "2026-04-18",
    interestRate: 12,
    term: 4,
  },
  {
    id: "11",
    borrowerName: "Rafael Jiménez Paz",
    amount: 45000.0,
    status: "active",
    createdAt: "2026-01-05",
    interestRate: 10,
    term: 24,
  },
  {
    id: "12",
    borrowerName: "Elena Torres Vega",
    amount: 5600.0,
    status: "completed",
    createdAt: "2025-09-20",
    interestRate: 18,
    term: 3,
  },
];

const MOCK_REPORT_SUMMARY: ReportSummary = {
  totalLoans: 12,
  activeLoans: 6,
  pendingLoans: 2,
  overdueLoans: 2,
  completedLoans: 2,
  totalAmount: 204501.0,
  totalInterest: 38950.25,
  totalPayments: 156,
  totalPaid: 98450.0,
  totalPending: 145001.25,
  averageInterestRate: 15.9,
  defaultRate: 16.7,
  collectionRate: 83.3,
  monthlyCollections: [
    { month: "Ene", amount: 18500 },
    { month: "Feb", amount: 22300 },
    { month: "Mar", amount: 19800 },
    { month: "Abr", amount: 25400 },
    { month: "May", amount: 0 },
    { month: "Jun", amount: 0 },
  ],
  loansByType: [
    { type: "Personal", count: 5, amount: 68500 },
    { type: "San", count: 4, amount: 45600 },
    { type: "Microcrédito", count: 2, amount: 12400 },
    { type: "Vehículo", count: 1, amount: 78000 },
  ],
  topBorrowers: [
    { name: "Rafael Jiménez Paz", amount: 45000, status: "active" },
    { name: "Sofía Ramírez Castro", amount: 31200, status: "overdue" },
    { name: "Carlos García López", amount: 22300, status: "overdue" },
    { name: "Roberto Fernández Marte", amount: 18750, status: "active" },
  ],
};

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "general",
    name: "Reporte General",
    description: "Resumen completo de todos los préstamos y estadísticas",
    icon: "document-text",
    color: C.primary2,
    bgColor: C.primary5,
    type: "general",
  },
  {
    id: "financial",
    name: "Reporte Financiero",
    description: "Análisis detallado de ingresos, gastos y rentabilidad",
    icon: "cash",
    color: C.success,
    bgColor: C.successBg,
    type: "financial",
  },
  {
    id: "collection",
    name: "Reporte de Cobranzas",
    description: "Seguimiento de pagos pendientes y vencidos",
    icon: "alert-circle",
    color: C.warning,
    bgColor: C.warningBg,
    type: "collection",
  },
  {
    id: "risk",
    name: "Análisis de Riesgo",
    description: "Evaluación de riesgo de la cartera de préstamos",
    icon: "shield-checkmark",
    color: C.danger,
    bgColor: C.dangerBg,
    type: "risk",
  },
  {
    id: "customer",
    name: "Reporte por Cliente",
    description: "Historial y comportamiento de pago por cliente",
    icon: "people",
    color: C.info,
    bgColor: C.infoBg,
    type: "customer",
  },
  {
    id: "custom",
    name: "Reporte Personalizado",
    description: "Crea un reporte con los parámetros que necesites",
    icon: "settings",
    color: C.pink,
    bgColor: C.pinkBg,
    type: "custom",
  },
];

// ─── Componentes ───────────────────────────────────────────────────

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
      style={[statS.card, { backgroundColor: bgColor }]}
    >
      <View style={statS.header}>
        <View style={[statS.iconBg, { backgroundColor: color + "20" }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        {trend && (
          <View
            style={[
              statS.trend,
              { backgroundColor: trend.isUp ? C.successBg : C.dangerBg },
            ]}
          >
            <Ionicons
              name={trend.isUp ? "trending-up" : "trending-down"}
              size={12}
              color={trend.isUp ? C.success : C.danger}
            />
            <Text
              style={[
                statS.trendText,
                { color: trend.isUp ? C.success : C.danger },
              ]}
            >
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text style={statS.value}>{value}</Text>
      <Text style={statS.title}>{title}</Text>
    </TouchableOpacity>
  </Animated.View>
);

const statS = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  trend: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: { fontSize: 11, fontWeight: "700" },
  value: {
    fontSize: 24,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  title: { fontSize: 12, color: C.textSub, fontWeight: "500" },
});

const ReportTemplateCard: React.FC<{
  template: ReportTemplate;
  onPress: () => void;
  index: number;
}> = ({ template, onPress, index }) => (
  <Animated.View entering={SlideInRight.delay(200 + index * 50).springify()}>
    <TouchableOpacity
      style={[templateS.card]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={[templateS.iconBg, { backgroundColor: template.bgColor }]}>
        <Ionicons
          name={template.icon as any}
          size={28}
          color={template.color}
        />
      </View>
      <View style={templateS.info}>
        <Text style={templateS.name}>{template.name}</Text>
        <Text style={templateS.description} numberOfLines={2}>
          {template.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
    </TouchableOpacity>
  </Animated.View>
);

const templateS = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 4 },
  description: { fontSize: 12, color: C.textMuted, lineHeight: 16 },
});

const LoanReportItem: React.FC<{
  loan: Loan;
  onGenerateReport: () => void;
  onGeneratePaymentHistory: () => void;
  index: number;
}> = ({ loan, onGenerateReport, onGeneratePaymentHistory, index }) => {
  const statusColors: Record<string, { bg: string; color: string }> = {
    active: { bg: C.successBg, color: C.success },
    pending: { bg: C.warningBg, color: C.warning },
    overdue: { bg: C.dangerBg, color: C.danger },
    review: { bg: C.primary5, color: C.primary2 },
    completed: { bg: "#f1f5f9", color: "#334155" },
  };
  const statusStyle = statusColors[loan.status] || statusColors.pending;

  return (
    <Animated.View entering={FadeInRight.delay(300 + index * 50).springify()}>
      <View style={loanItemS.container}>
        <View style={loanItemS.header}>
          <View style={loanItemS.borrowerInfo}>
            <View style={loanItemS.avatar}>
              <Text style={loanItemS.avatarText}>
                {loan.borrowerName
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </Text>
            </View>
            <View>
              <Text style={loanItemS.name}>{loan.borrowerName}</Text>
              <Text style={loanItemS.date}>
                Creado: {new Date(loan.createdAt).toLocaleDateString("es-DO")}
              </Text>
            </View>
          </View>
          <View
            style={[loanItemS.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[loanItemS.statusText, { color: statusStyle.color }]}>
              {loan.status === "active"
                ? "Activo"
                : loan.status === "pending"
                  ? "Pendiente"
                  : loan.status === "overdue"
                    ? "Vencido"
                    : loan.status}
            </Text>
          </View>
        </View>

        <View style={loanItemS.amountRow}>
          <Text style={loanItemS.amountLabel}>Monto:</Text>
          <Text style={loanItemS.amount}>
            RD$
            {loan.amount.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={loanItemS.actions}>
          <TouchableOpacity
            style={[loanItemS.actionBtn, { backgroundColor: C.primary5 }]}
            onPress={onGenerateReport}
          >
            <Ionicons name="document-text" size={16} color={C.primary2} />
            <Text style={[loanItemS.actionText, { color: C.primary2 }]}>
              Reporte
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[loanItemS.actionBtn, { backgroundColor: C.successBg }]}
            onPress={onGeneratePaymentHistory}
          >
            <Ionicons name="receipt" size={16} color={C.success} />
            <Text style={[loanItemS.actionText, { color: C.success }]}>
              Pagos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[loanItemS.actionBtn, { backgroundColor: C.infoBg }]}
            onPress={() => {}}
          >
            <Ionicons name="share-social" size={16} color={C.info} />
            <Text style={[loanItemS.actionText, { color: C.info }]}>
              Compartir
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const loanItemS = StyleSheet.create({
  container: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  borrowerInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.primary4,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "800", color: C.primary2 },
  name: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 2 },
  date: { fontSize: 11, color: C.textMuted },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "700" },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  amountLabel: { fontSize: 13, color: C.textSub },
  amount: { fontSize: 18, fontWeight: "800", color: C.text },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: { fontSize: 12, fontWeight: "600" },
});

const SectionHeader: React.FC<{
  title: string;
  icon: string;
  action?: { label: string; onPress: () => void };
}> = ({ title, icon, action }) => (
  <View style={sectionS.container}>
    <View style={sectionS.left}>
      <View style={sectionS.iconBg}>
        <Ionicons name={icon as any} size={16} color={C.primary2} />
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
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 6,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBg: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: C.primary5,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 15, fontWeight: "800", color: C.text },
  action: { fontSize: 12, fontWeight: "600", color: C.primary2 },
});

// ─── Componente Principal ──────────────────────────────────────────
export const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [showCustomReportModal, setShowCustomReportModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  const summary = MOCK_REPORT_SUMMARY;

  useEffect(() => {
    loadLoans();
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const loadLoans = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLoans(MOCK_LOANS);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los préstamos");
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLoans();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatCurrency = (v: number) =>
    `RD$${v.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

  const handleGenerateReport = async (reportId: string, reportName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGeneratingReport(reportId);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "✅ Reporte Generado",
        `El reporte "${reportName}" se ha generado exitosamente.`,
        [
          { text: "Compartir", onPress: () => handleShareReport(reportName) },
          { text: "Cerrar", style: "cancel" },
        ],
      );
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "No se pudo generar el reporte");
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleShareReport = async (reportName: string) => {
    try {
      await Share.share({
        message: `Reporte: ${reportName}\nGenerado el ${new Date().toLocaleDateString("es-DO")}\n\nResumen:\n• Total préstamos: ${summary.totalLoans}\n• Monto total: ${formatCurrency(summary.totalAmount)}\n• Tasa de cobro: ${summary.collectionRate}%`,
        title: `Reporte - ${reportName}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleGenerateLoanReport = async (loan: Loan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGeneratingReport(loan.id);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "✅ Reporte Generado",
        `Reporte para ${loan.borrowerName} generado exitosamente.`,
        [
          { text: "Compartir", onPress: () => {} },
          { text: "Ver", onPress: () => {} },
          { text: "Cerrar", style: "cancel" },
        ],
      );
    } catch (error) {
      Alert.alert("Error", "No se pudo generar el reporte");
    } finally {
      setGeneratingReport(null);
    }
  };

  const chartData = useMemo(
    () => ({
      labels: summary.monthlyCollections.map((m) => m.month),
      datasets: [
        {
          data: summary.monthlyCollections.map((m) => m.amount),
          color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    }),
    [summary],
  );

  const pieData = useMemo(
    () =>
      summary.loansByType.map((item, index) => ({
        name: item.type,
        amount: item.amount,
        color: [C.primary2, C.success, C.warning, C.info, C.orange][index % 5],
        legendFontColor: C.textSub,
        legendFontSize: 11,
      })),
    [summary],
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Floating Header */}
      <RNAnimated.View style={[styles.floatNav, { opacity: headerOpacity }]}>
        <BlurView
          intensity={50}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.floatContent}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.floatTitle}>Reportes</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowCustomReportModal(true)}
          >
            <Ionicons name="options-outline" size={22} color={C.text} />
          </TouchableOpacity>
        </View>
      </RNAnimated.View>

      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
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
          colors={[C.primary, "#6d28d9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reportes</Text>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowCustomReportModal(true)}
            >
              <Ionicons name="options-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>

          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.headerSummary}
          >
            <Text style={styles.headerSummaryText}>
              {summary.totalLoans} préstamos activos •{" "}
              {formatCurrency(summary.totalAmount)} en cartera
            </Text>
          </Animated.View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ── ESTADÍSTICAS PRINCIPALES ────────────────── */}
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Préstamos"
              value={summary.totalLoans}
              icon="document-text"
              color={C.primary2}
              bgColor={C.white}
              trend={{ value: 8, isUp: true }}
            />
            <View style={{ width: 10 }} />
            <StatCard
              title="Tasa de Cobro"
              value={`${summary.collectionRate}%`}
              icon="checkmark-circle"
              color={C.success}
              bgColor={C.white}
              trend={{ value: 3, isUp: true }}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              title="Monto Total"
              value={formatCurrency(summary.totalAmount)}
              icon="cash"
              color={C.warning}
              bgColor={C.white}
            />
            <View style={{ width: 10 }} />
            <StatCard
              title="Pendiente"
              value={formatCurrency(summary.totalPending)}
              icon="time"
              color={C.danger}
              bgColor={C.white}
            />
          </View>

          {/* ── GRÁFICO DE COBRANZAS ────────────────────── */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Cobranzas Mensuales</Text>
                <View style={styles.chartBadge}>
                  <Text style={styles.chartBadgeText}>2026</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={chartData}
                  width={Math.max(
                    SCREEN_WIDTH - 64,
                    chartData.labels.length * 50,
                  )}
                  height={180}
                  chartConfig={{
                    backgroundColor: C.white,
                    backgroundGradientFrom: C.white,
                    backgroundGradientTo: C.white,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      `rgba(100, 116, 139, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: "5",
                      strokeWidth: "2",
                      stroke: C.primary2,
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              </ScrollView>
            </View>
          </Animated.View>

          {/* ── DISTRIBUCIÓN POR TIPO ───────────────────── */}
          <Animated.View entering={FadeInDown.delay(180).springify()}>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>
                Distribución por Tipo de Préstamo
              </Text>
              <PieChart
                data={pieData}
                width={SCREEN_WIDTH - 64}
                height={180}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </Animated.View>

          {/* ── PLANTILLAS DE REPORTES ──────────────────── */}
          <SectionHeader title="Plantillas de Reportes" icon="document-text" />
          {REPORT_TEMPLATES.map((template, index) => (
            <ReportTemplateCard
              key={template.id}
              template={template}
              index={index}
              onPress={() => handleGenerateReport(template.id, template.name)}
            />
          ))}

          {/* ── TOP PRESTATARIOS ────────────────────────── */}
          <SectionHeader
            title="Top Prestatarios"
            icon="trophy"
            action={{ label: "Ver todos", onPress: () => {} }}
          />
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <View style={styles.topBorrowersCard}>
              {summary.topBorrowers.map((borrower, index) => (
                <View
                  key={index}
                  style={[
                    styles.topBorrowerRow,
                    index < summary.topBorrowers.length - 1 &&
                      styles.topBorrowerBorder,
                  ]}
                >
                  <View style={styles.topBorrowerRank}>
                    <Text
                      style={[
                        styles.topBorrowerRankText,
                        index < 3 && {
                          color:
                            index === 0
                              ? "#FFD700"
                              : index === 1
                                ? "#C0C0C0"
                                : "#CD7F32",
                        },
                      ]}
                    >
                      #{index + 1}
                    </Text>
                  </View>
                  <View style={styles.topBorrowerInfo}>
                    <Text style={styles.topBorrowerName}>{borrower.name}</Text>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            borrower.status === "active" ? C.success : C.danger,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.topBorrowerAmount}>
                    {formatCurrency(borrower.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── REPORTES POR PRÉSTAMO ───────────────────── */}
          <SectionHeader title="Reportes por Préstamo" icon="list" />
          {loans.length > 0 ? (
            loans
              .slice(0, 5)
              .map((loan, index) => (
                <LoanReportItem
                  key={loan.id}
                  loan={loan}
                  index={index}
                  onGenerateReport={() => handleGenerateLoanReport(loan)}
                  onGeneratePaymentHistory={() =>
                    Alert.alert(
                      "Historial de Pagos",
                      `Generando historial para ${loan.borrowerName}`,
                    )
                  }
                />
              ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={C.textMuted} />
              <Text style={styles.emptyStateText}>
                No hay préstamos registrados
              </Text>
            </View>
          )}

          {loans.length > 5 && (
            <TouchableOpacity style={styles.viewMoreBtn}>
              <Text style={styles.viewMoreText}>
                Ver {loans.length - 5} préstamos más
              </Text>
              <Ionicons name="chevron-down" size={16} color={C.primary2} />
            </TouchableOpacity>
          )}

          {/* ── INFORMACIÓN ─────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(350).springify()}>
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle" size={20} color={C.info} />
                <Text style={styles.infoTitle}>Información de Reportes</Text>
              </View>
              <Text style={styles.infoText}>
                Los reportes se generan en formato PDF e incluyen información
                detallada de préstamos, pagos y estadísticas financieras.
              </Text>
              <Text style={styles.infoText}>
                Puedes compartir los reportes directamente desde la aplicación o
                guardarlos para consultarlos después.
              </Text>
            </View>
          </Animated.View>

          <View style={{ height: 40 }} />
        </View>
      </RNAnimated.ScrollView>

      {/* ─── MODAL DE REPORTE PERSONALIZADO ────────────── */}
      <Modal
        visible={showCustomReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomReportModal(false)}
      >
        <BlurView intensity={100} tint="dark" style={modalS.overlay}>
          <Animated.View entering={ZoomIn.duration(200)} style={modalS.content}>
            <View style={modalS.header}>
              <Text style={modalS.title}>Reporte Personalizado</Text>
              <TouchableOpacity onPress={() => setShowCustomReportModal(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            <View style={modalS.body}>
              <Text style={modalS.label}>Rango de fechas</Text>
              <View style={modalS.dateRow}>
                <TextInput
                  style={modalS.dateInput}
                  placeholder="Fecha inicio"
                  value={dateRange.start}
                  onChangeText={(text) =>
                    setDateRange((prev) => ({ ...prev, start: text }))
                  }
                  placeholderTextColor={C.textMuted}
                />
                <Text style={modalS.dateSeparator}>-</Text>
                <TextInput
                  style={modalS.dateInput}
                  placeholder="Fecha fin"
                  value={dateRange.end}
                  onChangeText={(text) =>
                    setDateRange((prev) => ({ ...prev, end: text }))
                  }
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <Text style={[modalS.label, { marginTop: 16 }]}>
                Tipo de información
              </Text>
              {[
                "Resumen financiero",
                "Historial de pagos",
                "Análisis de riesgo",
                "Listado de préstamos",
              ].map((item, i) => (
                <TouchableOpacity key={i} style={modalS.checkboxRow}>
                  <Ionicons
                    name="square-outline"
                    size={22}
                    color={C.textMuted}
                  />
                  <Text style={modalS.checkboxLabel}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={modalS.footer}>
              <TouchableOpacity
                style={modalS.cancelBtn}
                onPress={() => setShowCustomReportModal(false)}
              >
                <Text style={modalS.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalS.generateBtn}
                onPress={() => {
                  setShowCustomReportModal(false);
                  handleGenerateReport("custom", "Reporte Personalizado");
                }}
              >
                <Text style={modalS.generateText}>Generar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* ─── OVERLAY DE CARGA ──────────────────────────── */}
      {generatingReport && (
        <View style={loadingS.overlay}>
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <Animated.View
            entering={ZoomIn.duration(200)}
            style={loadingS.content}
          >
            <ActivityIndicator size="large" color={C.primary2} />
            <Text style={loadingS.text}>Generando reporte...</Text>
            <Text style={loadingS.subtext}>Esto puede tomar unos segundos</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  floatNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    height: 100,
    paddingTop: 50,
    overflow: "hidden",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  floatContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  floatTitle: { fontSize: 17, fontWeight: "800", color: C.text },

  header: {
    paddingTop: 56,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
    letterSpacing: -0.5,
  },
  headerSummary: { paddingHorizontal: 20 },
  headerSummaryText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },

  body: { padding: 16 },

  statsGrid: { flexDirection: "row", marginBottom: 10 },

  chartCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  chartTitle: { fontSize: 15, fontWeight: "700", color: C.text },
  chartBadge: {
    backgroundColor: C.primary5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chartBadgeText: { fontSize: 11, fontWeight: "600", color: C.primary2 },
  chart: { borderRadius: 16 },

  topBorrowersCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  topBorrowerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  topBorrowerBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  topBorrowerRank: { width: 40 },
  topBorrowerRankText: { fontSize: 14, fontWeight: "700", color: C.textSub },
  topBorrowerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topBorrowerName: { fontSize: 14, fontWeight: "600", color: C.text },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  topBorrowerAmount: { fontSize: 14, fontWeight: "700", color: C.text },

  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyStateText: { fontSize: 14, color: C.textMuted, marginTop: 8 },

  viewMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
  },
  viewMoreText: { fontSize: 13, fontWeight: "600", color: C.primary2 },

  infoCard: {
    backgroundColor: C.infoBg,
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: C.info + "30",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: { fontSize: 15, fontWeight: "700", color: C.info },
  infoText: { fontSize: 13, color: C.textSub, lineHeight: 20, marginBottom: 8 },
});

const modalS = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: "800", color: C.text },
  body: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: C.textSub, marginBottom: 8 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateInput: {
    flex: 1,
    backgroundColor: C.primary5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
  },
  dateSeparator: { fontSize: 16, color: C.textMuted },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  checkboxLabel: { fontSize: 14, color: C.text },
  footer: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: C.border,
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: C.textSub },
  generateBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: C.primary2,
  },
  generateText: { fontSize: 15, fontWeight: "700", color: "white" },
});

const loadingS = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  content: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
  },
  text: { fontSize: 16, fontWeight: "700", color: C.text, marginTop: 16 },
  subtext: { fontSize: 13, color: C.textMuted, marginTop: 4 },
});
