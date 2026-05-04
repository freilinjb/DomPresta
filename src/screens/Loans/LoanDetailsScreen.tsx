// LoanDetailsScreen.tsx (Versión Mejorada con PDF y Recibos)
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Animated as RNAnimated,
  Dimensions,
  StatusBar,
  Modal,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeInRight,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Loan } from '../../types';
import { DatabaseService } from '../../services/databaseService';
import { RootStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────────────────
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
  review: '#7c3aed',
  reviewBg: '#f5f3ff',
  shadow: 'rgba(109,40,217,0.12)',
};

type LoanDetailsRouteProp = RouteProp<RootStackParamList, 'LoanDetails'>;
type LoanDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'LoanDetails'>;

interface LoanDetailsScreenProps {
  route: LoanDetailsRouteProp;
  navigation: LoanDetailsNavigationProp;
}

// ─── Tipos Mejorados ──────────────────────────────────────────────────────────
interface LoanDetailPayment {
  id: string;
  date: string;
  amount: number;
  principal: number;
  interest: number;
  lateFee?: number;
  status: 'paid' | 'pending' | 'late' | 'partial';
  paymentMethod: string;
  receipt?: string;
  notes?: string;
  period: number;
}

interface ExtendedLoan {
  id: string;
  borrowerName: string;
  amount: number;
  status: 'pending' | 'active' | 'paid' | 'overdue' | 'cancelled' | 'review';
  startDate: string;
  endDate: string;
  interestRate: number;
  term: number;
  clientId?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientDocument?: string;
  loanType: 'formal' | 'informal' | 'san';
  loanTypeName: string;
  calculationMethod: 'standard' | 'flat' | 'san';
  paymentFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorDocument?: string;
  collateralType?: string;
  collateralValue?: number;
  collateralDescription?: string;
  totalPaid: number;
  remainingBalance: number;
  nextPaymentDate?: string;
  nextPaymentAmount?: number;
  daysLate?: number;
  lateFees: number;
  payments: LoanDetailPayment[];
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────
const getCurrencySymbol = () => DatabaseService.getSetting('currency') || 'RD$';
const formatCurrency = (v: number) => `${getCurrencySymbol()}${v.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
const formatDate = (d?: string | Date) => d ? new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

const buildExtendedLoanFromDatabase = (loanData: any): ExtendedLoan => {
  const payments: LoanDetailPayment[] = (loanData.payments ?? []).map((payment: any, index: number) => ({
    id: payment.id,
    date: payment.date instanceof Date ? payment.date.toISOString().split('T')[0] : payment.date,
    amount: payment.amount,
    principal: payment.amount,
    interest: 0,
    lateFee: 0,
    status: payment.status === 'paid' ? 'paid' : payment.status === 'overdue' ? 'late' : payment.status === 'pending' ? 'pending' : 'partial',
    paymentMethod: payment.paymentMethod || 'Efectivo',
    notes: payment.notes || '',
    period: index + 1,
  }));

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = Math.max((loanData.remainingBalance ?? loanData.amount - totalPaid) as number, 0);
  const pendingPayments = payments
    .filter(p => p.status !== 'paid')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextPayment = pendingPayments[0];
  const nextPaymentDate = nextPayment?.date;
  const nextPaymentAmount = nextPayment?.amount ?? 0;
  const daysLate = Math.max(
    0,
    ...pendingPayments
      .filter(p => p.status === 'late')
      .map(p => Math.max(0, Math.ceil((Date.now() - new Date(p.date).getTime()) / (1000 * 60 * 60 * 24))))
  );

  return {
    id: loanData.id,
    borrowerName: loanData.borrowerName || 'Cliente',
    amount: loanData.amount ?? 0,
    status: loanData.status || 'pending',
    createdAt: loanData.createdAt instanceof Date ? loanData.createdAt.toISOString() : loanData.createdAt || new Date().toISOString(),
    startDate: loanData.startDate instanceof Date ? loanData.startDate.toISOString() : loanData.startDate || new Date().toISOString(),
    endDate: loanData.endDate instanceof Date ? loanData.endDate.toISOString() : loanData.endDate || new Date().toISOString(),
    interestRate: loanData.interestRate ?? 0,
    term: loanData.term ?? 0,
    clientId: loanData.clientId,
    clientEmail: loanData.clientEmail,
    clientPhone: loanData.clientPhone,
    clientAddress: loanData.clientAddress,
    clientDocument: loanData.clientDocument,
    loanType: loanData.loanType || 'formal',
    loanTypeName: loanData.loanTypeName || 'Personal',
    calculationMethod: loanData.calculationMethod || 'standard',
    paymentFrequency: loanData.paymentFrequency || 'monthly',
    guarantorName: loanData.guarantorName,
    guarantorPhone: loanData.guarantorPhone,
    guarantorDocument: loanData.guarantorDocument,
    collateralType: loanData.collateralType,
    collateralValue: loanData.collateralValue,
    collateralDescription: loanData.collateralDescription,
    totalPaid,
    remainingBalance,
    nextPaymentDate,
    nextPaymentAmount,
    daysLate,
    lateFees: loanData.lateFees ?? 0,
    payments,
    notes: loanData.notes,
    createdBy: loanData.createdBy,
    updatedAt: loanData.updatedAt || loanData.createdAt,
  };
};

// ─── PDF Generators (NUEVO) ─────────────────────────────────────────────────
const generateLoanPDFHtml = (loan: ExtendedLoan) => {
  const progress = loan.totalPaid / (loan.totalPaid + loan.remainingBalance) * 100;
  const statusColor = loan.status === 'active' ? '#059669' : loan.status === 'overdue' ? '#b91c1c' : '#0369a1';
  
  const paymentsRows = loan.payments.map(p => `
    <tr>
      <td>${p.period}</td>
      <td>${formatDate(p.date)}</td>
      <td>${formatCurrency(p.amount)}</td>
      <td>${formatCurrency(p.principal)}</td>
      <td>${formatCurrency(p.interest)}</td>
      <td>${p.status === 'paid' ? 'Pagado' : p.status === 'pending' ? 'Pendiente' : 'Atrasado'}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Reporte de Préstamo</title>
  <style>
    body { font-family: 'Helvetica', sans-serif; color: #333; padding: 20px; }
    .header { background: #1E0342; color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; background: ${statusColor}22; color: ${statusColor}; }
    .section { margin-bottom: 20px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; }
    .section-title { font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #1E0342; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .label { color: #666; } .value { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #f5f5f5; padding: 10px; text-align: left; font-size: 12px; }
    td { padding: 8px; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${loan.borrowerName}</h1>
    <p>Préstamo #${loan.id?.slice(-8)} | <span class="status">${loan.status.toUpperCase()}</span></p>
    <h2 style="margin: 10px 0 0 0;">${formatCurrency(loan.amount)}</h2>
  </div>

  <div class="section">
    <div class="section-title">Resumen</div>
    <div class="row"><span class="label">Total Pagado:</span><span class="value" style="color: green;">${formatCurrency(loan.totalPaid)}</span></div>
    <div class="row"><span class="label">Saldo Pendiente:</span><span class="value" style="color: #e67e22;">${formatCurrency(loan.remainingBalance)}</span></div>
    <div class="row"><span class="label">Progreso:</span><span class="value">${progress.toFixed(1)}%</span></div>
  </div>

  <div class="section">
    <div class="section-title">Cliente</div>
    <div class="row"><span class="label">Documento:</span><span class="value">${loan.clientDocument || 'N/A'}</span></div>
    <div class="row"><span class="label">Teléfono:</span><span class="value">${loan.clientPhone || 'N/A'}</span></div>
    <div class="row"><span class="label">Email:</span><span class="value">${loan.clientEmail || 'N/A'}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Detalles del Préstamo</div>
    <div class="row"><span class="label">Tipo:</span><span class="value">${loan.loanTypeName}</span></div>
    <div class="row"><span class="label">Tasa:</span><span class="value">${loan.interestRate}%</span></div>
    <div class="row"><span class="label">Plazo:</span><span class="value">${loan.term} meses</span></div>
    <div class="row"><span class="label">Inicio/Fin:</span><span class="value">${formatDate(loan.startDate)} - ${formatDate(loan.endDate)}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Historial de Pagos</div>
    <table>
      <thead><tr><th>#</th><th>Fecha</th><th>Monto</th><th>Capital</th><th>Interés</th><th>Estado</th></tr></thead>
      <tbody>${paymentsRows}</tbody>
    </table>
  </div>

  <div class="footer">
    Generado por DomPresta App - ${new Date().toLocaleDateString('es-DO')}
  </div>
</body>
</html>`;
};

const generatePaymentReceiptHtml = (loan: ExtendedLoan, payment: LoanDetailPayment) => {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'PAGADO';
      case 'pending': return 'PENDIENTE';
      case 'partial': return 'PARCIAL';
      default: return status.toUpperCase();
    }
  };
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Recibo de Pago</title>
  <style>
    body { font-family: 'Courier New', monospace; padding: 20px; background: #fff; }
    .receipt { border: 2px dashed #ccc; padding: 20px; max-width: 400px; margin: 0 auto; }
    .store-info { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .store-name { font-size: 24px; font-weight: bold; margin: 0; }
    .store-address { font-size: 12px; color: #666; }
    .title { text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; }
    .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
    .label { font-weight: bold; }
    .total { border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; font-size: 18px; font-weight: bold; }
    .status { background: #05966922; color: #059669; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
    .barcode { text-align: center; margin-top: 20px; font-family: 'Courier'; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="store-info">
      <h1 class="store-name">DOMPRESTA</h1>
      <p class="store-address">Sistema de Gestión de Préstamos</p>
    </div>
    
    <div class="title">RECIBO DE PAGO</div>
    
    <div class="row"><span class="label">Cliente:</span><span>${loan.borrowerName}</span></div>
    <div class="row"><span class="label">Préstamo:</span><span>#${loan.id?.slice(-8)}</span></div>
    <div class="row"><span class="label">Fecha:</span><span>${formatDate(payment.date)}</span></div>
    <div class="row"><span class="label">Cuota #:</span><span>${payment.period}</span></div>
    <hr style="border-style: dashed;" />
    <div class="row"><span class="label">Capital:</span><span>${formatCurrency(payment.principal)}</span></div>
    <div class="row"><span class="label">Interés:</span><span>${formatCurrency(payment.interest)}</span></div>
    ${payment.lateFee ? `<div class="row"><span class="label">Mora:</span><span>${formatCurrency(payment.lateFee)}</span></div>` : ''}
    <div class="row total"><span class="label">TOTAL:</span><span>${formatCurrency(payment.amount)}</span></div>
    <div class="row"><span class="label">Método:</span><span>${payment.paymentMethod || 'Efectivo'}</span></div>
    <div class="row"><span class="label">Estado:</span><span class="status">${getStatusLabel(payment.status)}</span></div>
    <hr style="border-style: dashed;" />
    <div class="row"><span class="label">Saldo Pendiente:</span><span>${formatCurrency(loan.remainingBalance)}</span></div>
    ${payment.notes ? `<p style="font-size: 12px; color: #666;">Nota: ${payment.notes}</p>` : ''}
    
    <div class="barcode">
      <p>*** ${payment.id.toUpperCase()} ***</p>
      <p style="font-size: 10px;">Gracias por su pago</p>
    </div>
    <p style="text-align: center; font-size: 10px; color: #999;">${new Date().toLocaleString('es-DO')}</p>
  </div>
</body>
</html>`;
};

// ─── Subcomponentes (Mantenidos del original) ─────────────────────────────────
const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' | 'lg' }> = ({ status, size = 'md' }) => {
  const config: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    active: { label: 'Activo', bg: C.successBg, color: C.successMid, dot: '#10b981' },
    pending: { label: 'Pendiente', bg: C.warningBg, color: C.warningMid, dot: '#f59e0b' },
    overdue: { label: 'Vencido', bg: C.dangerBg, color: C.dangerMid, dot: '#ef4444' },
    completed: { label: 'Completado', bg: C.infoBg, color: C.infoMid, dot: '#0284c7' },
  };
  const cfg = config[status] ?? { label: status, bg: C.bg, color: C.textMuted, dot: C.textMuted };
  const sizes = { sm: { py: 4, px: 8, fontSize: 10 }, md: { py: 6, px: 12, fontSize: 12 }, lg: { py: 8, px: 16, fontSize: 14 } };
  const s = sizes[size];
  
  return (
    <View style={[badgeS.pill, { backgroundColor: cfg.bg, paddingVertical: s.py, paddingHorizontal: s.px }]}>
      <View style={[badgeS.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[badgeS.text, { color: cfg.color, fontSize: s.fontSize }]}>{cfg.label}</Text>
    </View>
  );
};

const badgeS = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: C.border, gap: 5, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontWeight: '700', letterSpacing: 0.1 },
});

const InfoRow: React.FC<{ icon: string; label: string; value: string | number; highlight?: boolean }> = ({ icon, label, value, highlight }) => (
  <View style={infoS.row}>
    <View style={infoS.labelContainer}>
      <View style={infoS.iconWrap}>
        <Ionicons name={icon as any} size={14} color={C.textMuted} />
      </View>
      <Text style={infoS.label}>{label}</Text>
    </View>
    <Text style={[infoS.value, highlight && infoS.valueHighlight]}>{value || 'No especificado'}</Text>
  </View>
);

const infoS = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  labelContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.brandFaint, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, color: C.textSec, fontWeight: '500' },
  value: { fontSize: 14, fontWeight: '600', color: C.text },
  valueHighlight: { fontSize: 16, fontWeight: '800', color: C.brandVibrant },
});

const PaymentStatusBadge: React.FC<{ status: LoanDetailPayment['status'] }> = ({ status }) => {
  const config: Record<LoanDetailPayment['status'], { label: string; bg: string; color: string }> = {
    paid: { label: 'Pagado', bg: C.successBg, color: C.successMid },
    pending: { label: 'Pendiente', bg: C.warningBg, color: C.warningMid },
    late: { label: 'Atrasado', bg: C.dangerBg, color: C.dangerMid },
    partial: { label: 'Parcial', bg: C.infoBg, color: C.infoMid },
  };
  const cfg = config[status];
  return (
    <View style={[payBadgeS.container, { backgroundColor: cfg.bg }]}>
      <Text style={[payBadgeS.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const payBadgeS = StyleSheet.create({
  container: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  text: { fontSize: 9, fontWeight: '700' },
});

const PaymentItem: React.FC<{ payment: LoanDetailPayment; index: number; isSan?: boolean; onViewReceipt: (payment: LoanDetailPayment) => void }> = ({ payment, index, isSan, onViewReceipt }) => {
  return (
    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
      <View style={payItemS.container}>
        <View style={payItemS.left}>
          <View style={[payItemS.periodBadge, payment.status === 'paid' && payItemS.periodBadgePaid]}>
            <Text style={[payItemS.periodText, payment.status === 'paid' && payItemS.periodTextPaid]}>
              {isSan ? `Día ${payment.period}` : `Cuota ${payment.period}`}
            </Text>
          </View>
          <View>
            <Text style={payItemS.date}>{new Date(payment.date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}</Text>
            {payment.notes && <Text style={payItemS.notes}>{payment.notes}</Text>}
          </View>
        </View>
        <View style={payItemS.right}>
          <Text style={payItemS.amount}>{formatCurrency(payment.amount)}</Text>
          <PaymentStatusBadge status={payment.status} />
          {/* Botón para ver recibo - NUEVO */}
          {payment.status === 'paid' && (
            <TouchableOpacity 
              style={payItemS.receiptButton} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onViewReceipt(payment);
              }}
            >
              <Ionicons name="receipt-outline" size={14} color={C.brandVibrant} />
              <Text style={payItemS.receiptText}>Ver Recibo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const payItemS = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  periodBadge: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.brandFaint, alignItems: 'center', justifyContent: 'center' },
  periodBadgePaid: { backgroundColor: C.successBg },
  periodText: { fontSize: 11, fontWeight: '700', color: C.brandVibrant },
  periodTextPaid: { color: C.successMid },
  date: { fontSize: 13, fontWeight: '600', color: C.text },
  notes: { fontSize: 10, color: C.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 14, fontWeight: '700', color: C.text },
  // NUEVO ESTILO
  receiptButton: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  receiptText: { fontSize: 10, fontWeight: '600', color: C.brandVibrant },
});

const ProgressCircle: React.FC<{ progress: number; size?: number }> = ({ progress, size = 120 }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={C.borderStrong} strokeWidth={10} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={C.brandVibrant} strokeWidth={10} fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <SvgText x={size / 2} y={size / 2 - 5} textAnchor="middle" fontSize={size * 0.18} fontWeight="800" fill={C.text}>{Math.round(progress * 100)}%</SvgText>
      <SvgText x={size / 2} y={size / 2 + 15} textAnchor="middle" fontSize={size * 0.08} fill={C.textMuted}>Pagado</SvgText>
    </Svg>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: string; color: string; bg: string }> = ({ label, value, icon, color, bg }) => (
  <View style={statS.card}>
    <View style={[statS.iconRing, { backgroundColor: bg }]}>
      <Ionicons name={icon as any} size={18} color={color} />
    </View>
    <Text style={statS.value}>{value}</Text>
    <Text style={statS.label}>{label}</Text>
  </View>
);

const statS = StyleSheet.create({
  card: { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  iconRing: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value: { fontSize: 17, fontWeight: '800', color: C.text },
  label: { fontSize: 10, color: C.textMuted, fontWeight: '600', marginTop: 2, textAlign: 'center' },
});

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
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.brandFaint, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '800', color: C.text },
  action: { fontSize: 12, fontWeight: '600', color: C.brandVibrant },
});

const Card: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <View style={[cardS.container, style]}>{children}</View>
);

const cardS = StyleSheet.create({
  container: { backgroundColor: C.surface, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
});

const ActionButton: React.FC<{ icon: string; label: string; onPress: () => void; color?: string; filled?: boolean }> = ({ icon, label, onPress, color = C.brandVibrant, filled }) => (
  <TouchableOpacity
    style={[actionS.btn, { backgroundColor: filled ? color : `${color}15`, borderColor: filled ? color : `${color}30` }]}
    onPress={onPress}
    activeOpacity={0.78}
  >
    <Ionicons name={icon as any} size={18} color={filled ? '#fff' : color} />
    <Text style={[actionS.text, { color: filled ? '#fff' : color }]}>{label}</Text>
  </TouchableOpacity>
);

const actionS = StyleSheet.create({
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  text: { fontSize: 14, fontWeight: '700' },
});

// ─── Datos Mock Mejorados (Se agregó paymentMethod a los pagos pagados) ──────────
// ─── Datos del préstamo consultados desde la tabla de la base de datos ─────────────────────────────────

// ─── Componente Principal (VERSIÓN MEJORADA) ─────────────────────────────────
export const LoanDetailsScreen: React.FC<LoanDetailsScreenProps> = ({ route, navigation }) => {
  const { loanId } = route.params;
  const [loan, setLoan] = useState<ExtendedLoan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  // NUEVO: Estado para el modal de recibo/desglose de pago
  const [selectedPayment, setSelectedPayment] = useState<LoanDetailPayment | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    loadLoanDetails();
    navigation.setOptions({ headerShown: false });
  }, [loanId]);

  const loadLoanDetails = async () => {
    try {
      const loanData = await DatabaseService.getLoanById(loanId);
      if (!loanData) {
        setLoan(null);
        Alert.alert('Error', 'No se encontraron los detalles del préstamo.');
        return;
      }

      const extendedLoan = buildExtendedLoanFromDatabase(loanData);
      setLoan(extendedLoan);
    } catch (error) {
      console.error('Error cargando préstamo:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles del préstamo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLoanDetails();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // NUEVO: Función para generar y compartir/imprimir PDF del préstamo
  const handleExportLoanPDF = async () => {
    if (!loan) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const html = generateLoanPDFHtml(loan);
      const { uri } = await Print.printToFileAsync({ html });
      
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Compartir o Imprimir Reporte de Préstamo',
            UTI: 'public.pdf'
          });
        } else {
          // Abre el diálogo de impresión nativo
          await Print.printAsync({ uri });
        }
      } else {
        await Print.printAsync({ uri });
      }
    } catch (error) {
      console.error('Error exporting loan PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF del préstamo.');
    }
  };

  // NUEVO: Función para ver el desglose del recibo de pago
  const handleViewReceipt = (payment: LoanDetailPayment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  // NUEVO: Función para compartir/imprimir el recibo de pago
  const handleSharePaymentReceipt = async () => {
    if (!loan || !selectedPayment) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const html = generatePaymentReceiptHtml(loan, selectedPayment);
      const { uri } = await Print.printToFileAsync({ html });
      
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Recibo Pago #${selectedPayment.period} - ${loan.borrowerName}`,
            UTI: 'public.pdf'
          });
        } else {
          await Print.printAsync({ uri });
        }
      } else {
        await Print.printAsync({ uri });
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'No se pudo compartir el recibo.');
    }
  };

  const handleRegisterPayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Error', 'Ingrese un monto válido');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('✅ Pago registrado', `Se ha registrado un pago de RD$${parseFloat(paymentAmount).toLocaleString()}`);
    setShowPaymentModal(false);
    setPaymentAmount('');
    setPaymentNotes('');
  };

  const progress = loan ? (loan.totalPaid / (loan.totalPaid + loan.remainingBalance)) : 0;
  const isSan = loan?.loanType === 'san';
  const isInformal = loan?.loanType === 'informal';

  const getHeaderColors = (): [string, string] => {
    if (!loan) return [C.brand, C.brandVibrant];
    if (loan.status === 'overdue') return ['#dc2626', '#b91c1c'];
    if (loan.loanType === 'san') return [C.successMid, C.success];
    if (loan.loanType === 'informal') return ['#ea580c', '#c2410c'];
    return [C.brand, C.brandVibrant];
  };

  const navOpacity = scrollY.interpolate({ inputRange: [0, 100], outputRange: [0, 1], extrapolate: 'clamp' });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <LinearGradient colors={[C.brand, C.brandMid, C.brandVibrant]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }} />
        <Animated.View entering={ZoomIn.duration(400)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 76, height: 76, borderRadius: 22, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="cash" size={36} color={C.brandVibrant} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 16 }}>Cargando detalles...</Text>
          <View style={{ width: 200, height: 4, backgroundColor: C.brandPale, borderRadius: 2, overflow: 'hidden' }}>
            <Animated.View style={{ width: '60%', height: '100%', backgroundColor: C.brandVibrant, borderRadius: 2 }} />
          </View>
        </Animated.View>
      </View>
    );
  }

  if (!loan) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <LinearGradient colors={[C.brand, C.brandMid, C.brandVibrant]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }} />
        <Animated.View entering={ZoomIn.duration(400)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 76, height: 76, borderRadius: 22, backgroundColor: C.dangerBg, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="alert-circle-outline" size={36} color={C.dangerMid} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 16 }}>Préstamo no encontrado</Text>
          <TouchableOpacity style={{ backgroundColor: C.brandVibrant, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }} onPress={() => navigation.goBack()}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Volver</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating header */}
      <RNAnimated.View style={[s.floatNav, { opacity: navOpacity }]} pointerEvents="box-none">
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={s.floatRow}>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.floatTitle} numberOfLines={1}>{loan.borrowerName}</Text>
          <TouchableOpacity style={s.navBtn} onPress={handleExportLoanPDF}>
            <Ionicons name="share-outline" size={20} color={C.text} />
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
        <LinearGradient colors={getHeaderColors()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
          <View style={s.decCircle1} />
          <View style={s.decCircle2} />

          <View style={s.headerTop}>
            <TouchableOpacity style={s.navBtnWhite} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>{isSan ? 'SAN' : isInformal ? 'INFORMAL' : 'FORMAL'}</Text>
            </View>
            <TouchableOpacity style={s.navBtnWhite} onPress={handleExportLoanPDF}>
              <Ionicons name="print-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.headerContent}>
            <Text style={s.clientName}>{loan.borrowerName}</Text>
            <View style={s.headerMeta}>
              <StatusBadge status={loan.status} size="lg" />
              <Text style={s.clientId}>#{loan.id?.slice(-8)}</Text>
            </View>
            <Text style={s.amount}>{formatCurrency(loan.amount)}</Text>
          </Animated.View>
        </LinearGradient>

        <View style={s.body}>
          {/* Progress Section */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Card style={s.progressCard}>
              <View style={s.progressRow}>
                <ProgressCircle progress={progress} size={100} />
                <View style={s.progressStats}>
                  <View style={s.progressStat}>
                    <Text style={s.progressStatLabel}>Pagado</Text>
                    <Text style={[s.progressStatValue, { color: C.successMid }]}>{formatCurrency(loan.totalPaid)}</Text>
                  </View>
                  <View style={s.divider} />
                  <View style={s.progressStat}>
                    <Text style={s.progressStatLabel}>Pendiente</Text>
                    <Text style={[s.progressStatValue, { color: loan.status === 'overdue' ? C.dangerMid : C.warningMid }]}>{formatCurrency(loan.remainingBalance)}</Text>
                  </View>
                  {loan.daysLate && loan.daysLate > 0 && (
                    <>
                      <View style={s.divider} />
                      <View style={s.progressStat}>
                        <Text style={s.progressStatLabel}>Atraso</Text>
                        <Text style={[s.progressStatValue, { color: C.dangerMid }]}>{loan.daysLate} días</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </Card>
          </Animated.View>

          {/* Next Payment */}
          {loan.nextPaymentDate && (
            <Animated.View entering={FadeInDown.delay(180).springify()}>
              <Card style={[s.nextPaymentCard, { backgroundColor: C.brandFaint, borderColor: C.brandPale }]}>
                <View style={s.nextPaymentHeader}>
                  <Ionicons name="calendar" size={18} color={C.brandVibrant} />
                  <Text style={s.nextPaymentTitle}>Próximo pago</Text>
                </View>
                <View style={s.nextPaymentContent}>
                  <View>
                    <Text style={s.nextPaymentDate}>{formatDate(loan.nextPaymentDate)}</Text>
                    <Text style={s.nextPaymentLabel}>{isSan ? 'Pago diario' : 'Cuota mensual'}</Text>
                  </View>
                  <Text style={s.nextPaymentAmount}>{formatCurrency(loan.nextPaymentAmount || 0)}</Text>
                </View>
                {loan.daysLate && loan.daysLate > 0 && (
                  <View style={s.lateFeeWarning}>
                    <Ionicons name="warning" size={14} color={C.dangerMid} />
                    <Text style={s.lateFeeText}>Mora acumulada: {formatCurrency(loan.lateFees)}</Text>
                  </View>
                )}
              </Card>
            </Animated.View>
          )}

          {/* Stats Row */}
          <Animated.View entering={FadeInDown.delay(210).springify()}>
            <View style={s.statsRow}>
              <StatCard label="Tasa" value={`${loan.interestRate}%`} icon="trending-up" color={C.brandVibrant} bg={C.brandFaint} />
              <View style={{ width: 8 }} />
              <StatCard label={isSan ? 'Plazo (días)' : 'Plazo'} value={(loan.term ?? 0).toString()} icon="calendar" color={C.infoMid} bg={C.infoBg} />
              <View style={{ width: 8 }} />
              <StatCard label="Frecuencia" value={loan.paymentFrequency === 'daily' ? 'Diario' : loan.paymentFrequency === 'weekly' ? 'Semanal' : 'Mensual'} icon="repeat" color={C.warningMid} bg={C.warningBg} />
            </View>
          </Animated.View>

          {/* Client Information */}
          <SectionHeader title="Información del Cliente" icon="person-outline" />
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <Card>
              <InfoRow icon="mail-outline" label="Email" value={loan.clientEmail || 'No especificado'} />
              <InfoRow icon="call-outline" label="Teléfono" value={loan.clientPhone || 'No especificado'} />
              <InfoRow icon="card-outline" label="Documento" value={loan.clientDocument || 'No especificado'} />
              <InfoRow icon="location-outline" label="Dirección" value={loan.clientAddress || 'No especificada'} />
            </Card>
          </Animated.View>

          {/* Loan Details */}
          <SectionHeader title="Detalles del Préstamo" icon="document-text-outline" />
          <Animated.View entering={FadeInDown.delay(270).springify()}>
            <Card>
              <InfoRow icon="cash-outline" label="Tipo" value={loan.loanTypeName} highlight />
              <InfoRow icon="calculator-outline" label="Cálculo" value={loan.calculationMethod === 'san' ? 'San (Interés sobre capital)' : loan.calculationMethod === 'flat' ? 'Interés plano' : 'Francés (Cuota fija)'} />
              <InfoRow icon="calendar-outline" label="Inicio" value={formatDate(loan.startDate)} />
              <InfoRow icon="calendar-outline" label="Fin" value={formatDate(loan.endDate)} />
              <InfoRow icon="person-outline" label="Creado por" value={loan.createdBy || 'Sistema'} />
              <InfoRow icon="time-outline" label="Creado" value={formatDate(loan.createdAt)} />
            </Card>
          </Animated.View>

          {/* Guarantor */}
          {loan.guarantorName && (
            <>
              <SectionHeader title="Codeudor" icon="people-outline" />
              <Animated.View entering={FadeInDown.delay(300).springify()}>
                <Card>
                  <InfoRow icon="person-outline" label="Nombre" value={loan.guarantorName} />
                  <InfoRow icon="call-outline" label="Teléfono" value={loan.guarantorPhone || 'No especificado'} />
                  <InfoRow icon="card-outline" label="Documento" value={loan.guarantorDocument || 'No especificado'} />
                </Card>
              </Animated.View>
            </>
          )}

          {/* Payment History */}
          <SectionHeader title={isSan ? "Plan de Pagos Diarios" : "Historial de Pagos"} icon="receipt-outline" />
          <Animated.View entering={FadeInDown.delay(330).springify()}>
            <Card>
              {loan.payments.slice(0, 5).map((payment, index) => (
                <PaymentItem 
                  key={payment.id} 
                  payment={payment} 
                  index={index} 
                  isSan={isSan} 
                  onViewReceipt={handleViewReceipt} // NUEVO: Callback para ver recibo
                />
              ))}
              {loan.payments.length > 5 && (
                <TouchableOpacity style={s.viewAllBtn}>
                  <Text style={s.viewAllText}>Ver todos los pagos ({loan.payments.length})</Text>
                  <Ionicons name="chevron-forward" size={14} color={C.brandVibrant} />
                </TouchableOpacity>
              )}
            </Card>
          </Animated.View>

          {/* Notes */}
          {loan.notes && (
            <>
              <SectionHeader title="Notas" icon="create-outline" />
              <Animated.View entering={FadeInDown.delay(360).springify()}>
                <Card>
                  <Text style={s.notes}>{loan.notes}</Text>
                </Card>
              </Animated.View>
            </>
          )}

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.delay(390).springify()} style={s.actionsContainer}>
            <ActionButton icon="create-outline" label="Editar" onPress={() => navigation.navigate('LoanForm' as any, { loanId })} color={C.brandVibrant} />
            <ActionButton icon="cash-outline" label="Registrar Pago" onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowPaymentModal(true);
              setPaymentAmount(loan.nextPaymentAmount?.toString() || '');
            }} color={C.successMid} filled />
          </Animated.View>

          {/* NUEVO: Botón de exportar PDF del préstamo (versión móvil) */}
          <Animated.View entering={FadeInDown.delay(420).springify()} style={{ marginTop: 12 }}>
            <ActionButton 
              icon="print-outline" 
              label="Exportar PDF del Préstamo" 
              onPress={handleExportLoanPDF}
              color={C.infoMid}
            />
          </Animated.View>

          <View style={{ height: 100 }} />
        </View>
      </RNAnimated.ScrollView>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="fade" onRequestClose={() => setShowPaymentModal(false)}>
        <BlurView intensity={100} tint="dark" style={modalS.overlay}>
          <Animated.View entering={ZoomIn.duration(200)} style={modalS.content}>
            <View style={modalS.header}>
              <Text style={modalS.title}>Registrar Pago</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>
            <View style={modalS.body}>
              <Text style={modalS.label}>Monto a pagar</Text>
              <View style={modalS.amountInput}>
                <Text style={modalS.currencySymbol}>RD$</Text>
                <TextInput
                  style={modalS.input}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={C.textPlaceholder}
                />
              </View>
              <Text style={[modalS.label, { marginTop: 16 }]}>Notas (opcional)</Text>
              <TextInput
                style={modalS.notesInput}
                value={paymentNotes}
                onChangeText={setPaymentNotes}
                placeholder="Ej: Pago de cuota #3"
                placeholderTextColor={C.textPlaceholder}
                multiline
                textAlignVertical="top"
              />
              {loan.nextPaymentAmount && (
                <View style={modalS.suggestion}>
                  <Ionicons name="information-circle" size={14} color={C.infoMid} />
                  <Text style={modalS.suggestionText}>Cuota sugerida: {formatCurrency(loan.nextPaymentAmount)}</Text>
                </View>
              )}
            </View>
            <View style={modalS.footer}>
              <TouchableOpacity style={modalS.cancelBtn} onPress={() => setShowPaymentModal(false)}>
                <Text style={modalS.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalS.confirmBtn} onPress={handleRegisterPayment}>
                <Text style={modalS.confirmText}>Confirmar Pago</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* NUEVO: Modal de Recibo / Desglose de Pago */}
      <Modal 
        visible={showReceiptModal} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setShowReceiptModal(false)}
      >
        <BlurView intensity={100} tint="dark" style={modalS.overlay}>
          {selectedPayment && loan && (
            <Animated.View entering={ZoomIn.duration(200)} style={modalS.content}>
              {/* Encabezado del Recibo */}
              <View style={modalS.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="receipt" size={22} color={C.brandVibrant} />
                  <View>
                    <Text style={modalS.title}>Desglose de Pago</Text>
                    <Text style={{ fontSize: 12, color: C.textMuted }}>Cuota #{selectedPayment.period}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                  <Ionicons name="close" size={22} color={C.text} />
                </TouchableOpacity>
              </View>

              {/* Detalles del Pago */}
              <View style={modalS.body}>
                <View style={receiptS.row}>
                  <Text style={receiptS.label}>Fecha de Pago</Text>
                  <Text style={receiptS.value}>{formatDate(selectedPayment.date)}</Text>
                </View>
                <View style={receiptS.row}>
                  <Text style={receiptS.label}>Método</Text>
                  <Text style={receiptS.value}>{selectedPayment.paymentMethod || 'Efectivo'}</Text>
                </View>
                
                <View style={receiptS.divider} />
                
                <View style={receiptS.row}>
                  <Text style={receiptS.label}>Capital</Text>
                  <Text style={receiptS.value}>{formatCurrency(selectedPayment.principal)}</Text>
                </View>
                <View style={receiptS.row}>
                  <Text style={receiptS.label}>Interés</Text>
                  <Text style={receiptS.value}>{formatCurrency(selectedPayment.interest)}</Text>
                </View>
                {selectedPayment.lateFee ? (
                  <View style={receiptS.row}>
                    <Text style={[receiptS.label, { color: C.dangerMid }]}>Mora</Text>
                    <Text style={[receiptS.value, { color: C.dangerMid }]}>{formatCurrency(selectedPayment.lateFee)}</Text>
                  </View>
                ) : null}
                
                <View style={[receiptS.row, { marginTop: 8, paddingTop: 12, borderTopWidth: 2, borderTopColor: C.borderStrong }]}>
                  <Text style={[receiptS.label, { fontSize: 16, fontWeight: '800' }]}>Total Pagado</Text>
                  <Text style={[receiptS.value, { fontSize: 18, fontWeight: '900', color: C.successMid }]}>{formatCurrency(selectedPayment.amount)}</Text>
                </View>
                
                <View style={[receiptS.row, { marginTop: 8 }]}>
                  <Text style={receiptS.label}>Estado</Text>
                  <View style={[payBadgeS.container, { backgroundColor: C.successBg, alignSelf: 'flex-end' }]}>
                    <Text style={[payBadgeS.text, { color: C.successMid }]}>PAGADO</Text>
                  </View>
                </View>
                
                {selectedPayment.notes ? (
                  <View style={[receiptS.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                    <Text style={receiptS.label}>Notas</Text>
                    <Text style={receiptS.value}>{selectedPayment.notes}</Text>
                  </View>
                ) : null}
                
                <View style={{ marginTop: 16, padding: 12, backgroundColor: C.brandFaint, borderRadius: 12 }}>
                  <View style={receiptS.row}>
                    <Text style={receiptS.label}>Saldo Pendiente del Préstamo</Text>
                    <Text style={[receiptS.value, { fontWeight: '700' }]}>{formatCurrency(loan.remainingBalance)}</Text>
                  </View>
                </View>
              </View>

              {/* Botones de Acción del Recibo */}
              <View style={modalS.footer}>
                <TouchableOpacity 
                  style={modalS.cancelBtn} 
                  onPress={() => setShowReceiptModal(false)}
                >
                  <Text style={modalS.cancelText}>Cerrar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[modalS.confirmBtn, { backgroundColor: C.brandVibrant, flex: 2 }]} 
                  onPress={handleSharePaymentReceipt}
                >
                  <Ionicons name="share-outline" size={18} color="white" />
                  <Text style={modalS.confirmText}>  Compartir / Imprimir Recibo</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </BlurView>
      </Modal>
    </View>
  );
};

// ─── Styles (Unificados) ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  floatNav: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99, height: 94, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  floatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  floatTitle: { fontSize: 15, fontWeight: '800', color: C.text, flex: 1, textAlign: 'center' },
  navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, overflow: 'hidden' },
  decCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40 },
  decCircle2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 10, left: -30 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  navBtnWhite: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  headerBadgeText: { fontSize: 11, fontWeight: '800', color: 'white', letterSpacing: 0.5 },
  headerContent: { alignItems: 'center' },
  clientName: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 8, textAlign: 'center' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  clientId: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  amount: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  body: { padding: 16 },
  progressCard: { marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  progressStats: { flex: 1, gap: 8 },
  progressStat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressStatLabel: { fontSize: 12, color: C.textMuted, fontWeight: '500' },
  progressStatValue: { fontSize: 16, fontWeight: '800' },
  divider: { height: 1, backgroundColor: C.border },
  nextPaymentCard: { marginBottom: 12 },
  nextPaymentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  nextPaymentTitle: { fontSize: 14, fontWeight: '700', color: C.brandVibrant },
  nextPaymentContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextPaymentDate: { fontSize: 17, fontWeight: '800', color: C.text },
  nextPaymentLabel: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  nextPaymentAmount: { fontSize: 20, fontWeight: '900', color: C.brandVibrant },
  lateFeeWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  lateFeeText: { fontSize: 12, fontWeight: '600', color: C.dangerMid },
  statsRow: { flexDirection: 'row', marginBottom: 8 },
  notes: { fontSize: 14, color: C.textSec, lineHeight: 20 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12, paddingTop: 8 },
  viewAllText: { fontSize: 12, fontWeight: '600', color: C.brandVibrant },
  actionsContainer: { flexDirection: 'row', gap: 12, marginTop: 16 },
});

const modalS = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { backgroundColor: C.surface, borderRadius: 24, padding: 20, width: '100%', maxWidth: 400 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800', color: C.text },
  body: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: C.textSec, marginBottom: 8 },
  amountInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.brandFaint, borderRadius: 14, paddingHorizontal: 16 },
  currencySymbol: { fontSize: 18, fontWeight: '700', color: C.text, marginRight: 8 },
  input: { flex: 1, fontSize: 22, fontWeight: '700', color: C.text, paddingVertical: 14 },
  notesInput: { backgroundColor: C.brandFaint, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: C.text, minHeight: 80 },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 12, backgroundColor: C.infoBg, borderRadius: 12 },
  suggestionText: { fontSize: 12, color: C.infoMid, fontWeight: '500' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  cancelText: { fontSize: 14, fontWeight: '600', color: C.textSec },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: C.successMid, flexDirection: 'row', justifyContent: 'center' },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// NUEVOS ESTILOS para el modal de recibo
const receiptS = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 13, color: C.textSec, fontWeight: '500' },
  value: { fontSize: 14, fontWeight: '600', color: C.text },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 8 },
});