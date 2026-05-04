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
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle,
  Text as SvgText,
  G,
  Polyline,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Path,
} from 'react-native-svg';
import { Loan } from '../../types';
import { DatabaseService } from '../../services/databaseService';
import { MainTabParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────
const C = {
  brand: '#1a0533',
  brandMid: '#3d0f7a',
  brandVibrant: '#6d28d9',
  brandLight: '#8b5cf6',
  brandPale: '#ede9fe',
  brandFaint: '#f5f3ff',

  bg: '#f0eef8',
  surface: '#ffffff',
  border: 'rgba(109,40,217,0.09)',
  borderStrong: 'rgba(109,40,217,0.18)',

  text: '#0f0a1e',
  textSec: '#4a4560',
  textMuted: '#9591a8',

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

  gold: '#f59e0b',
  shadow: 'rgba(109,40,217,0.10)',
};

const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;
interface HomeScreenProps { navigation: HomeScreenNavigationProp; }

// ─── Mock Data ────────────────────────────────────────────────────
const MOCK_LOANS: Loan[] = [
  { id: '1', borrowerName: 'Juan Rodríguez Méndez',    amount: 15750.50, status: 'active',  createdAt: '2026-01-15', nextPaymentDate: '2026-04-25' },
  { id: '2', borrowerName: 'María Pérez González',      amount: 8250.00,  status: 'pending', createdAt: '2026-03-20', nextPaymentDate: '2026-04-28' },
  { id: '3', borrowerName: 'Carlos García López',       amount: 22300.75, status: 'overdue', createdAt: '2025-11-10', nextPaymentDate: '2026-04-15' },
  { id: '4', borrowerName: 'Ana Martínez Ruiz',         amount: 12500.00, status: 'review',  createdAt: '2026-04-05', nextPaymentDate: '2026-05-10' },
  { id: '5', borrowerName: 'Roberto Fernández Marte',   amount: 18750.25, status: 'active',  createdAt: '2025-12-01', nextPaymentDate: '2026-04-22' },
  { id: '6', borrowerName: 'Luisa Hernández Díaz',      amount: 14300.00, status: 'active',  createdAt: '2026-02-28', nextPaymentDate: '2026-04-30' },
  { id: '7', borrowerName: 'Pedro Sánchez Vega',        amount: 9200.50,  status: 'pending', createdAt: '2026-04-12', nextPaymentDate: '2026-05-05' },
  { id: '8', borrowerName: 'Sofía Ramírez Castro',      amount: 31200.00, status: 'overdue', createdAt: '2025-10-15', nextPaymentDate: '2026-04-10' },
];

const MOCK_CLIENTS = [
  { id: '1', name: 'Elena Torres Vega',   email: 'elena.torres@email.com',   phone: '809-555-0123', loans: 3, totalAmount: 42500, status: 'active'  },
  { id: '2', name: 'Miguel Ángel Cruz',   email: 'miguel.cruz@email.com',    phone: '809-555-0124', loans: 1, totalAmount: 15000, status: 'pending' },
  { id: '3', name: 'Laura Jiménez Paz',   email: 'laura.jimenez@email.com',  phone: '809-555-0125', loans: 5, totalAmount: 78250, status: 'active'  },
  { id: '4', name: 'Ricardo Mora Silva',  email: 'ricardo.mora@email.com',   phone: '809-555-0126', loans: 2, totalAmount: 28900, status: 'overdue' },
];

const MOCK_REPORTS = [
  { id: '1', title: 'Reporte de Cobranzas – Abril 2026', date: '15 Abr 2026', type: 'collection', icon: 'cash-outline',         color: C.success  },
  { id: '2', title: 'Análisis de Riesgo – Q1 2026',      date: '10 Abr 2026', type: 'risk',       icon: 'shield-checkmark-outline', color: C.warningMid },
  { id: '3', title: 'Proyección de Crecimiento 2026',    date: '05 Abr 2026', type: 'growth',     icon: 'trending-up-outline',  color: C.brandVibrant },
  { id: '4', title: 'Estado de Cartera – Semana 16',     date: '01 Abr 2026', type: 'portfolio',  icon: 'pie-chart-outline',    color: C.infoMid  },
];

const MOCK_ACTIVITY = [
  { id: '1', type: 'payment',  name: 'Elena Torres Vega',  amount: 4500, time: 'hace 1 hora',  icon: 'checkmark-circle', color: C.successMid },
  { id: '2', type: 'new',      name: 'Pedro Sánchez Vega', amount: 9200, time: 'hace 3 horas', icon: 'add-circle',       color: C.brandVibrant },
  { id: '3', type: 'overdue',  name: 'Sofía Ramírez Castro', amount: 1200, time: 'hace 5 horas', icon: 'alert-circle',  color: C.dangerMid },
  { id: '4', type: 'payment',  name: 'Juan Rodríguez',     amount: 2800, time: 'ayer',          icon: 'checkmark-circle', color: C.successMid },
];

const MONTHLY = [
  { month: 'Ene', amt: 12.5, h: 40 },
  { month: 'Feb', amt: 14.2, h: 48 },
  { month: 'Mar', amt: 16.8, h: 56 },
  { month: 'Abr', amt: 15.3, h: 52 },
  { month: 'May', amt: 19.5, h: 65 },
  { month: 'Jun', amt: 22.4, h: 74, peak: true },
  { month: 'Jul', amt: 18.7, h: 62, forecast: true },
  { month: 'Ago', amt: 15.0, h: 44, forecast: true },
];

const DONUT_SEGS = [
  { pct: 0.62, color: C.brandVibrant, label: 'Activos',     count: 48 },
  { pct: 0.18, color: C.brandLight,   label: 'Pendientes',  count: 14 },
  { pct: 0.12, color: '#f87171',      label: 'Vencidos',    count: 9  },
  { pct: 0.08, color: C.successMid,   label: 'Completados', count: 72 },
];

const AVATAR_PALETTES: [string, string][] = [
  ['#7c3aed', '#4f46e5'], ['#8b5cf6', '#06b6d4'], ['#f87171', '#f59e0b'],
  ['#059669', '#0891b2'], ['#7c3aed', '#059669'], ['#a78bfa', '#f59e0b'],
];

// ─── Reusable UI Components ───────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    active:  { label: 'Al día',      bg: C.successBg,  color: C.successMid,  dot: '#10b981' },
    pending: { label: 'Pendiente',   bg: C.warningBg,  color: C.warningMid,  dot: '#f59e0b' },
    overdue: { label: 'Vencido',     bg: C.dangerBg,   color: C.dangerMid,   dot: '#ef4444' },
    review:  { label: 'En revisión', bg: C.infoBg,     color: C.infoMid,     dot: '#0ea5e9' },
  };
  const cfg = config[status] ?? { label: status, bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  return (
    <View style={[badgeS.pill, { backgroundColor: cfg.bg }]}>
      <View style={[badgeS.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[badgeS.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};
const badgeS = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 5 },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 0.1 },
});

const Avatar: React.FC<{ name: string; index: number; size?: number }> = ({ name, index, size = 42 }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const [c1, c2] = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, overflow: 'hidden' }}>
      <LinearGradient colors={[c1, c2]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: size * 0.32, fontWeight: '800' }}>{initials}</Text>
      </View>
    </View>
  );
};

// ─── SectionCard ─────────────────────────────────────────────────
const SectionCard: React.FC<{
  title: string;
  icon: string;
  children: React.ReactNode;
  delay?: number;
  badge?: string;
  action?: { label: string; onPress: () => void };
}> = ({ title, icon, children, delay = 0, badge, action }) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()} style={secS.card}>
    <View style={secS.header}>
      <View style={secS.iconWrap}>
        <Ionicons name={icon as any} size={16} color={C.brandVibrant} />
      </View>
      <Text style={secS.title} numberOfLines={1}>{title}</Text>
      {badge !== undefined && (
        <View style={secS.badge}>
          <Text style={secS.badgeText}>{badge}</Text>
        </View>
      )}
      {action && (
        <TouchableOpacity onPress={action.onPress} style={secS.actionBtn}>
          <Text style={secS.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
    <View style={secS.divider} />
    <View style={secS.body}>{children}</View>
  </Animated.View>
);
const secS = StyleSheet.create({
  card:      { backgroundColor: C.surface, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 },
  header:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg, paddingBottom: SPACE.md, gap: SPACE.sm },
  iconWrap:  { width: 32, height: 32, borderRadius: 9, backgroundColor: C.brandFaint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:     { fontSize: 13, fontWeight: '800', color: C.text, letterSpacing: -0.2, flex: 1 },
  badge:     { backgroundColor: C.brandFaint, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: '800', color: C.brandVibrant },
  actionBtn: { flexShrink: 0 },
  actionText:{ fontSize: 11, fontWeight: '700', color: C.brandVibrant },
  divider:   { height: 1, backgroundColor: C.border, marginHorizontal: SPACE.lg },
  body:      { padding: SPACE.lg },
});

// ─── MetricCard ───────────────────────────────────────────────────
const MetricCard: React.FC<{
  icon: string;
  label: string;
  value: string;
  trend: string;
  trendType?: 'up' | 'down' | 'neutral';
  delay?: number;
}> = ({ icon, label, value, trend, trendType = 'neutral', delay = 0 }) => {
  const trendColor = trendType === 'up' ? C.successMid : trendType === 'down' ? C.dangerMid : C.brandVibrant;
  const trendBg    = trendType === 'up' ? C.successBg  : trendType === 'down' ? C.dangerBg  : C.brandFaint;
  const trendIcon  = trendType === 'up' ? 'arrow-up'   : trendType === 'down' ? 'arrow-down' : 'remove';
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[secS.card, mS.card]}>
      <View style={mS.topRow}>
        <View style={[secS.iconWrap, { backgroundColor: C.brandFaint }]}>
          <Ionicons name={icon as any} size={16} color={C.brandVibrant} />
        </View>
        <View style={[mS.trendPill, { backgroundColor: trendBg }]}>
          <Ionicons name={trendIcon as any} size={9} color={trendColor} />
          <Text style={[mS.trendText, { color: trendColor }]}>{trend}</Text>
        </View>
      </View>
      <Text style={mS.value}>{value}</Text>
      <Text style={mS.label}>{label}</Text>
    </Animated.View>
  );
};
const mS = StyleSheet.create({
  card:      { flex: 1, padding: SPACE.md },
  topRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE.md },
  trendPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, gap: 3 },
  trendText: { fontSize: 9, fontWeight: '700' },
  value:     { fontSize: 20, fontWeight: '900', color: C.text, letterSpacing: -0.5, marginBottom: 2 },
  label:     { fontSize: 10, color: C.textMuted, fontWeight: '600' },
});

// ─── StatBox ──────────────────────────────────────────────────────
const StatBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <View style={[secS.card, stS.box]}>
    <Text style={[stS.value, { color }]}>{value}</Text>
    <Text style={stS.label}>{label}</Text>
  </View>
);
const stS = StyleSheet.create({
  box:   { flex: 1, alignItems: 'center', paddingVertical: SPACE.lg },
  value: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  label: { fontSize: 10, color: C.textMuted, fontWeight: '600', textAlign: 'center' },
});

// ─── PipeStep ─────────────────────────────────────────────────────
const PipeStep: React.FC<{
  label: string;
  count: string;
  state: 'done' | 'active' | 'next';
  isLast?: boolean;
}> = ({ label, count, state, isLast }) => {
  const circleBg  = state === 'done' ? C.brandVibrant : state === 'active' ? C.gold        : '#e5e7eb';
  const circleText= state === 'done' ? 'white'        : state === 'active' ? C.brand       : '#9ca3af';
  const countColor= state === 'done' ? C.brandVibrant : state === 'active' ? C.warningMid  : '#9ca3af';
  return (
    <View style={pS.step}>
      <View style={pS.lineRow}>
        <View style={[pS.circle, { backgroundColor: circleBg }]}>
          <Text style={[pS.circleInner, { color: circleText }]}>
            {state === 'done' ? '✓' : state === 'active' ? '!' : '–'}
          </Text>
        </View>
        {!isLast && <View style={[pS.connector, { backgroundColor: state === 'done' ? C.brandPale : '#e5e7eb' }]} />}
      </View>
      <Text style={[pS.count, { color: countColor }]}>{count}</Text>
      <Text style={pS.label}>{label}</Text>
    </View>
  );
};
const pS = StyleSheet.create({
  step:       { flex: 1, alignItems: 'center' },
  lineRow:    { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: SPACE.xs },
  circle:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 },
  circleInner:{ fontSize: 11, fontWeight: '900' },
  connector:  { flex: 1, height: 2, marginLeft: -2 },
  count:      { fontSize: 14, fontWeight: '900', marginBottom: 2 },
  label:      { fontSize: 8, color: C.textSec, fontWeight: '700', textAlign: 'center', letterSpacing: 0.2, textTransform: 'uppercase' },
});

// ─── QuickAction ─────────────────────────────────────────────────
const QuickAction: React.FC<{
  icon: string;
  label: string;
  sub: string;
  bg: string;
  iconColor?: string;
  onPress: () => void;
  delay?: number;
}> = ({ icon, label, sub, bg, iconColor = C.brandVibrant, onPress, delay = 0 }) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()} style={{ flex: 1 }}>
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={({ pressed }) => [qS.btn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
    >
      <View style={[qS.iconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <Text style={qS.label}>{label}</Text>
      <Text style={qS.sub}>{sub}</Text>
    </Pressable>
  </Animated.View>
);
const qS = StyleSheet.create({
  btn:      { backgroundColor: C.surface, borderRadius: 16, padding: SPACE.md, borderWidth: 1, borderColor: C.border, flex: 1 },
  iconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.sm },
  label:    { fontSize: 12, fontWeight: '800', color: C.text, marginBottom: 2 },
  sub:      { fontSize: 10, color: C.textMuted, fontWeight: '500' },
});

// ─── SVG Charts ──────────────────────────────────────────────────

const DonutChart: React.FC = () => {
  const R    = 34;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE.lg }}>
      <Svg width={100} height={100} viewBox="0 0 100 100">
        <G rotation={-90} origin="50,50">
          {DONUT_SEGS.map((seg, i) => {
            const dash = seg.pct * CIRC;
            const cur  = offset;
            offset    += dash;
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
        <SvgText x={50} y={46} textAnchor="middle" fontSize={13} fontWeight="900" fill={C.text}>143</SvgText>
        <SvgText x={50} y={58} textAnchor="middle" fontSize={8}  fill={C.textMuted} fontWeight="600">préstamos</SvgText>
      </Svg>
      <View style={{ flex: 1, gap: SPACE.sm }}>
        {DONUT_SEGS.map((seg, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE.sm }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: seg.color, flexShrink: 0 }} />
            <Text style={{ flex: 1, fontSize: 11, color: C.textSec, fontWeight: '600' }}>{seg.label}</Text>
            <Text style={{ fontSize: 11, fontWeight: '800', color: C.text, minWidth: 28, textAlign: 'right' }}>{Math.round(seg.pct * 100)}%</Text>
            <Text style={{ fontSize: 10, color: C.textMuted, minWidth: 22, textAlign: 'right' }}>{seg.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const BarChart: React.FC = () => (
  <View style={{ gap: SPACE.xs }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 88, gap: 5, paddingBottom: 0 }}>
      {MONTHLY.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 88 }}>
          {d.forecast ? (
            <View style={{ width: '100%', height: d.h, borderRadius: 6, borderWidth: 1.5, borderColor: C.brandLight, borderStyle: 'dashed' }} />
          ) : (
            <LinearGradient
              colors={d.peak ? [C.brandLight, C.brandVibrant] : [C.brandPale, '#ddd6fe']}
              style={{ width: '100%', height: d.h, borderRadius: 6 }}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            />
          )}
        </View>
      ))}
    </View>
    {/* Labels row separated */}
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {MONTHLY.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: d.peak ? C.brandVibrant : C.textMuted, fontWeight: '700' }}>
            {d.month}
          </Text>
        </View>
      ))}
    </View>
    {/* Amounts row */}
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {MONTHLY.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
          {!d.forecast && (
            <Text style={{ fontSize: 7, color: d.peak ? C.brandVibrant : C.textMuted, fontWeight: '600' }}>
              ${d.amt}k
            </Text>
          )}
          {d.forecast && (
            <Text style={{ fontSize: 7, color: C.brandLight, fontWeight: '600' }}>~</Text>
          )}
        </View>
      ))}
    </View>
    {/* Legend */}
    <View style={{ flexDirection: 'row', gap: SPACE.lg, marginTop: SPACE.sm, justifyContent: 'flex-end' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: C.brandVibrant }} />
        <Text style={{ fontSize: 9, color: C.textMuted, fontWeight: '600' }}>Real</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={{ width: 10, height: 10, borderRadius: 3, borderWidth: 1.5, borderColor: C.brandLight, borderStyle: 'dashed' }} />
        <Text style={{ fontSize: 9, color: C.textMuted, fontWeight: '600' }}>Proyectado</Text>
      </View>
    </View>
  </View>
);

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 80;
  const H = 30;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 4)}`)
    .join(' ');
  return (
    <Svg width={W} height={H}>
      <Polyline points={points} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

// ─── Alert Banner ─────────────────────────────────────────────────
const AlertBanner: React.FC<{ count: number; onPress: () => void }> = ({ count, onPress }) => (
  <Animated.View entering={FadeInDown.delay(200).springify()}>
    <Pressable onPress={onPress} style={alS.banner}>
      <View style={alS.iconWrap}>
        <Ionicons name="warning" size={16} color={C.warningMid} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={alS.title}>{count} préstamo{count !== 1 ? 's' : ''} vencido{count !== 1 ? 's' : ''}</Text>
        <Text style={alS.sub}>Requieren atención inmediata</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.warningMid} />
    </Pressable>
  </Animated.View>
);
const alS = StyleSheet.create({
  banner:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.warningBg, borderRadius: 14, padding: SPACE.md, borderWidth: 1, borderColor: 'rgba(180,83,9,0.15)', marginBottom: SPACE.md, gap: SPACE.sm },
  iconWrap:{ width: 32, height: 32, borderRadius: 9, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:   { fontSize: 12, fontWeight: '800', color: C.warning },
  sub:     { fontSize: 10, color: C.warningMid, fontWeight: '500', marginTop: 1 },
});

// ─── HomeScreen ───────────────────────────────────────────────────
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'Resumen' | 'Préstamos' | 'Clientes' | 'Reportes'>('Resumen');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('RD$');
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const savedCurrency = DatabaseService.getSetting('currency');
    if (savedCurrency) setCurrencySymbol(savedCurrency);
    navigation.setOptions({ headerShown: false });
    fetchLoans();
  }, []);

  const normalizeLoan = (loan: any): Loan => {
    const pendingPayments = (loan.payments ?? [])
      .filter((p: any) => p.status !== 'paid')
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const nextPayment = pendingPayments[0];
    const nextPaymentDate = nextPayment
      ? (nextPayment.date instanceof Date ? nextPayment.date.toISOString().split('T')[0] : nextPayment.date)
      : undefined;

    return {
      ...loan,
      nextPaymentDate,
      createdAt: loan.createdAt instanceof Date ? loan.createdAt.toISOString() : loan.createdAt,
    };
  };

  const fetchLoans = async () => {
    try {
      const data = await DatabaseService.getLoans();
      if (data?.length) setLoans(data.map(normalizeLoan));
    } catch (error) {
      console.error('Error cargando préstamos:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchLoans();
  }, []);

  const fmt      = (v: number) => `${currencySymbol}${v.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtShort = (v: number) => {
    if (v >= 1_000_000) return `${currencySymbol}${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `${currencySymbol}${(v / 1_000).toFixed(1)}K`;
    return `${currencySymbol}${v.toFixed(0)}`;
  };

  const go = (screen: keyof MainTabParamList) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate(screen);
  };

  const openDrawer = () => {
    const parent = navigation.getParent?.();
    if (parent && typeof (parent as any).openDrawer === 'function') {
      (parent as any).openDrawer();
    }
  };

  const navOpacity = scrollY.interpolate({ inputRange: [0, 60], outputRange: [0, 1], extrapolate: 'clamp' });

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const activeLoans  = loans.filter(l => l.status === 'active');
  const pendingLoans = loans.filter(l => l.status === 'pending');
  const overdueLoans = loans.filter(l => l.status === 'overdue');
  const totalAmount  = loans.reduce((sum, l) => sum + l.amount, 0);

  const monthlyGoal   = 250000;
  const goalProgress  = Math.min((totalAmount / monthlyGoal) * 100, 100);

  const upcomingPayments = [...loans]
    .filter(l => l.nextPaymentDate)
    .sort((a, b) => new Date(a.nextPaymentDate!).getTime() - new Date(b.nextPaymentDate!).getTime())
    .slice(0, 3);

  // ── Tab content ──────────────────────────────────────────────
  const renderResumen = () => (
    <>
      {/* Alert banner for overdue */}
      {overdueLoans.length > 0 && (
        <AlertBanner count={overdueLoans.length} onPress={() => setActiveTab('Préstamos')} />
      )}

      {/* Monthly goal */}
      <Animated.View entering={FadeInDown.delay(230).springify()} style={s.goalCard}>
        <View style={s.goalHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, flex: 1 }}>
            <Ionicons name="flag" size={13} color={C.brandVibrant} />
            <Text style={s.goalTitle}>Meta de colocación – Abril</Text>
          </View>
          <Text style={s.goalValue}>{goalProgress.toFixed(0)}%</Text>
        </View>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${goalProgress}%` }]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACE.xs }}>
          <Text style={s.goalSub}>{fmtShort(totalAmount)} alcanzados</Text>
          <Text style={s.goalSub}>Meta: {fmtShort(monthlyGoal)}</Text>
        </View>
      </Animated.View>

      {/* Metric cards 2×2 */}
      <View style={s.row}>
        <MetricCard icon="trending-up"  label="Cobrado este mes"  value="$22,450" trend="+15.2%"       trendType="up"      delay={270} />
        <View style={{ width: 10 }} />
        <MetricCard icon="alert-circle" label="Por vencer (7d)"   value="$11,280" trend="12 préstamos" trendType="neutral" delay={300} />
      </View>
      <View style={{ height: 10 }} />
      <View style={s.row}>
        <MetricCard icon="pie-chart"    label="Tasa de cobro"    value="96.8%"   trend="+1.3%"   trendType="up"   delay={330} />
        <View style={{ width: 10 }} />
        <MetricCard icon="wallet"       label="Disponible"       value="$38.5K"  trend="Estable" trendType="neutral" delay={360} />
      </View>

      {/* Upcoming payments */}
      <SectionCard
        title="Próximos vencimientos"
        icon="calendar-outline"
        delay={390}
        badge={upcomingPayments.length.toString()}
        action={{ label: 'Ver todos', onPress: () => go('Loans') }}
      >
        {upcomingPayments.map((loan, i) => {
          const daysLeft = Math.ceil(
            (new Date(loan.nextPaymentDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          const urgent = daysLeft <= 3;
          return (
            <Pressable
              key={loan.id}
              style={({ pressed }) => [s.listItem, pressed && { opacity: 0.7 }, i === 0 && { paddingTop: 0 }]}
              onPress={() => go('Loans')}
            >
              <Avatar name={loan.borrowerName} index={i} size={40} />
              <View style={{ flex: 1, marginLeft: SPACE.md, minWidth: 0 }}>
                <Text style={s.listName} numberOfLines={1}>{loan.borrowerName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Ionicons name="time-outline" size={10} color={urgent ? C.dangerMid : C.textMuted} />
                  <Text style={[s.listSub, urgent && { color: C.dangerMid, fontWeight: '700' }]}>
                    Vence en {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={s.listAmt}>{fmtShort(loan.amount)}</Text>
                <StatusBadge status={loan.status} />
              </View>
            </Pressable>
          );
        })}
      </SectionCard>

      {/* Loan pipeline */}
      <SectionCard title="Pipeline de préstamos" icon="git-network-outline" delay={430}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <PipeStep label="Solicitud"   count="42"  state="done"   />
          <PipeStep label="Evaluación"  count="35"  state="done"   />
          <PipeStep label="Aprobación"  count="18"  state="active" />
          <PipeStep label="Desembolso"  count="56"  state="done"   />
          <PipeStep label="Al día"      count="143" state="done"   isLast />
        </View>
      </SectionCard>

      {/* Activity feed */}
      <SectionCard title="Actividad reciente" icon="pulse-outline" delay={460}>
        {MOCK_ACTIVITY.map((item, i) => (
          <View
            key={item.id}
            style={[s.listItem, i === 0 && { paddingTop: 0 }, i === MOCK_ACTIVITY.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}
          >
            <View style={[s.actIcon, { backgroundColor: item.color + '18' }]}>
              <Ionicons name={item.icon as any} size={18} color={item.color} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACE.md, minWidth: 0 }}>
              <Text style={s.listName} numberOfLines={1}>{item.name}</Text>
              <Text style={s.listSub}>{item.time}</Text>
            </View>
            <Text style={[s.listAmt, {
              color: item.type === 'payment' ? C.successMid : item.type === 'overdue' ? C.dangerMid : C.brandVibrant
            }]}>
              {item.type === 'payment' ? '+' : item.type === 'new' ? '+' : '!'} {fmtShort(item.amount)}
            </Text>
          </View>
        ))}
      </SectionCard>

      {/* Bar chart */}
      <SectionCard title="Colocación mensual 2026" icon="bar-chart-outline" delay={490}>
        <BarChart />
      </SectionCard>

      {/* Donut chart */}
      <SectionCard title="Distribución de cartera" icon="pie-chart-outline" delay={520}>
        <DonutChart />
      </SectionCard>

      {/* Quick actions */}
      <Animated.View entering={FadeInDown.delay(550).springify()}>
        <Text style={[s.sectionTitle, { marginBottom: SPACE.sm }]}>Acciones rápidas</Text>
      </Animated.View>
      <View style={s.row}>
        <QuickAction icon="add-circle"    label="Nuevo préstamo"   sub="Registrar solicitud" bg={C.brandFaint}  iconColor={C.brandVibrant} onPress={() => go('LoanRequestForm' as any)} delay={570} />
        <View style={{ width: 10 }} />
        <QuickAction icon="cash"          label="Registrar pago"   sub="Marcar como pagado"  bg={C.successBg}   iconColor={C.successMid}   onPress={() => go('Loans')}                  delay={590} />
      </View>
      <View style={{ height: 10 }} />
      <View style={s.row}>
        <QuickAction icon="alert-circle"  label="Ver vencidos"     sub={`${overdueLoans.length} en mora`}  bg={C.dangerBg}   iconColor={C.dangerMid}    onPress={() => setActiveTab('Préstamos')} delay={610} />
        <View style={{ width: 10 }} />
        <QuickAction icon="document-text" label="Reportes"         sub="Exportar & analizar" bg={C.infoBg}   iconColor={C.infoMid}      onPress={() => setActiveTab('Reportes')}  delay={630} />
      </View>
    </>
  );

  const renderPrestamos = () => (
    <Animated.View entering={FadeIn.delay(150)}>
      {/* Stats row */}
      <View style={s.row}>
        <StatBox label="Total préstamos"  value={loans.length.toString()}     color={C.text}        />
        <View style={{ width: 10 }} />
        <StatBox label="Monto total"      value={fmtShort(totalAmount)}        color={C.successMid}  />
      </View>
      <View style={{ height: 10 }} />
      <View style={s.row}>
        <StatBox label="Pendientes"       value={pendingLoans.length.toString()} color={C.warningMid} />
        <View style={{ width: 10 }} />
        <StatBox label="Vencidos"         value={overdueLoans.length.toString()} color={C.dangerMid}  />
      </View>

      {/* Filter chips */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={{ flexDirection: 'row', gap: SPACE.xs, marginVertical: SPACE.md }}>
        {['Todos', 'Activos', 'Pendientes', 'Vencidos'].map((f) => (
          <View key={f} style={[fS.chip, f === 'Todos' && fS.chipActive]}>
            <Text style={[fS.chipText, f === 'Todos' && fS.chipTextActive]}>{f}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Loan list */}
      {loans.map((loan, i) => (
        <Animated.View
          key={loan.id}
          entering={SlideInRight.delay(250 + i * 55).springify()}
          layout={Layout.springify()}
        >
          <Pressable
            style={({ pressed }) => [s.loanRow, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }]}
            onPress={() => go('Loans')}
          >
            <Avatar name={loan.borrowerName} index={i} size={44} />
            <View style={{ flex: 1, minWidth: 0, marginLeft: SPACE.md }}>
              <Text style={s.listName} numberOfLines={1}>{loan.borrowerName}</Text>
              <Text style={s.listSub}>
                #{loan.id} · {new Date(loan.createdAt || Date.now()).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: '2-digit' })}
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
    <Animated.View entering={FadeIn.delay(150)}>
      {/* Client stats */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={s.clientStatsRow}>
        {[
          { label: 'Total', value: '156', color: C.brandVibrant, bg: C.brandFaint },
          { label: 'Activos',  value: '142', color: C.successMid,  bg: C.successBg  },
          { label: 'Nuevos',   value: '14',  color: C.warningMid,  bg: C.warningBg  },
          { label: 'En mora',  value: '8',   color: C.dangerMid,   bg: C.dangerBg   },
        ].map((stat) => (
          <View key={stat.label} style={[s.clientStat, { backgroundColor: stat.bg }]}>
            <Text style={[s.clientStatValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={s.clientStatLabel}>{stat.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Client list */}
      <SectionCard title="Clientes destacados" icon="people-outline" delay={260} badge={MOCK_CLIENTS.length.toString()}>
        {MOCK_CLIENTS.map((client, i) => (
          <Pressable
            key={client.id}
            style={({ pressed }) => [
              s.listItem,
              pressed && { opacity: 0.7 },
              i === 0 && { paddingTop: 0 },
              i === MOCK_CLIENTS.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 },
            ]}
          >
            <Avatar name={client.name} index={i} size={42} />
            <View style={{ flex: 1, marginLeft: SPACE.md, minWidth: 0 }}>
              <Text style={s.listName} numberOfLines={1}>{client.name}</Text>
              <Text style={s.listSub} numberOfLines={1}>{client.email}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 3 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: C.brandVibrant }}>
                {client.loans} prést.
              </Text>
              <Text style={{ fontSize: 10, color: C.textMuted, fontWeight: '600' }}>
                {fmtShort(client.totalAmount)}
              </Text>
            </View>
          </Pressable>
        ))}
      </SectionCard>

      {/* Top borrowers sparkline */}
      <SectionCard title="Historial de pagos – Top clientes" icon="trending-up-outline" delay={320}>
        {[
          { name: 'Elena Torres', data: [4, 5, 3, 6, 5, 7, 8], color: C.brandVibrant },
          { name: 'Laura Jiménez', data: [6, 5, 7, 6, 8, 7, 9], color: C.successMid },
          { name: 'Ricardo Mora', data: [3, 4, 2, 3, 2, 4, 3], color: C.warningMid },
        ].map((row, i) => (
          <View
            key={row.name}
            style={[
              { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
              i < 2 && { marginBottom: SPACE.md },
            ]}
          >
            <Avatar name={row.name} index={i} size={36} />
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: C.text }}>{row.name}</Text>
            <Sparkline data={row.data} color={row.color} />
          </View>
        ))}
      </SectionCard>
    </Animated.View>
  );

  const renderReportes = () => (
    <Animated.View entering={FadeIn.delay(150)}>
      {/* KPIs */}
      <SectionCard title="KPIs principales" icon="speedometer-outline" delay={200}>
        <View style={{ gap: SPACE.md }}>
          {[
            { label: 'ROI de Cartera',        value: '18.5%', pct: 85, color: C.successMid  },
            { label: 'Índice de morosidad',   value: '4.2%',  pct: 28, color: C.warningMid  },
            { label: 'Crecimiento mensual',   value: '12.3%', pct: 72, color: C.brandVibrant },
            { label: 'Eficiencia de cobro',   value: '96.8%', pct: 97, color: C.infoMid      },
          ].map((kpi) => (
            <View key={kpi.label}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE.xs }}>
                <Text style={{ fontSize: 12, color: C.textSec, fontWeight: '600' }}>{kpi.label}</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: kpi.color }}>{kpi.value}</Text>
              </View>
              <View style={s.kpiBarBg}>
                <View style={[s.kpiBarFill, { width: `${kpi.pct}%`, backgroundColor: kpi.color }]} />
              </View>
            </View>
          ))}
        </View>
      </SectionCard>

      {/* Reports list */}
      <SectionCard title="Reportes generados" icon="document-text-outline" delay={280} badge={MOCK_REPORTS.length.toString()}>
        {MOCK_REPORTS.map((report, i) => (
          <Pressable
            key={report.id}
            style={({ pressed }) => [
              s.listItem,
              pressed && { opacity: 0.7 },
              i === 0 && { paddingTop: 0 },
              i === MOCK_REPORTS.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 },
            ]}
          >
            <View style={[s.actIcon, { backgroundColor: report.color + '18' }]}>
              <Ionicons name={report.icon as any} size={18} color={report.color} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACE.md, minWidth: 0 }}>
              <Text style={s.listName} numberOfLines={1}>{report.title}</Text>
              <Text style={s.listSub}>{report.date}</Text>
            </View>
            <Ionicons name="download-outline" size={18} color={C.textMuted} />
          </Pressable>
        ))}
      </SectionCard>

      {/* Summary table */}
      <SectionCard title="Resumen financiero – Q1 2026" icon="receipt-outline" delay={360}>
        {[
          { label: 'Total desembolsado',    value: 'RD$1.2M',   up: true  },
          { label: 'Total cobrado',         value: 'RD$987K',   up: true  },
          { label: 'Cartera vencida',       value: 'RD$53.5K',  up: false },
          { label: 'Intereses generados',   value: 'RD$142K',   up: true  },
          { label: 'Clientes nuevos',       value: '42',        up: true  },
        ].map((row, i, arr) => (
          <View
            key={row.label}
            style={[
              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACE.sm },
              i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border },
            ]}
          >
            <Text style={{ fontSize: 12, color: C.textSec, fontWeight: '600' }}>{row.label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name={row.up ? 'arrow-up' : 'arrow-down'} size={11} color={row.up ? C.successMid : C.dangerMid} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: C.text }}>{row.value}</Text>
            </View>
          </View>
        ))}
      </SectionCard>
    </Animated.View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating nav (on scroll) */}
      <RNAnimated.View style={[s.floatNav, { opacity: navOpacity }]} pointerEvents="box-none">
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={s.floatRow}>
          <TouchableOpacity style={s.navBtn} onPress={openDrawer}>
            <Ionicons name="menu-outline" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.floatTitle}>Dashboard</Text>
          <TouchableOpacity style={s.navBtn} onPress={() => go('LoanRequestForm' as any)}>
            <Ionicons name="add" size={22} color={C.brandVibrant} />
          </TouchableOpacity>
        </View>
      </RNAnimated.View>

      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brandVibrant} colors={[C.brandVibrant]} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[C.brand, C.brandMid, C.brandVibrant]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.header}
        >
          <View style={s.decCircle1} />
          <View style={s.decCircle2} />

          {/* Top row */}
          <View style={s.headerTop}>
            <TouchableOpacity style={s.navBtnWhite} onPress={openDrawer}>
              <Ionicons name="menu-outline" size={20} color="white" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.headerGreeting}>{greeting} 👋</Text>
              <Text style={s.headerName}>Carlos Méndez</Text>
            </View>
            <TouchableOpacity style={s.navBtnWhite} onPress={() => go('LoanRequests' as any)}>
              <Ionicons name="notifications-outline" size={20} color="white" />
              <View style={s.notifDot} />
            </TouchableOpacity>
          </View>

          {/* Balance card */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.balCard}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACE.md }}>
              <View style={{ flex: 1 }}>
                <Text style={s.balLabel}>Cartera Total Activa</Text>
                <Text style={s.balValue}>{fmtShort(totalAmount)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACE.xs }}>
                  <Ionicons name="arrow-up-circle" size={12} color="#34d399" />
                  <Text style={{ fontSize: 11, color: '#34d399', fontWeight: '700' }}>+8.4% vs mes anterior</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: SPACE.xs }}>
                <View style={s.balIcon}>
                  <Ionicons name="wallet-outline" size={20} color="rgba(255,255,255,0.8)" />
                </View>
                <Sparkline data={[120, 135, 128, 145, 155, 148, 162]} color="#34d399" />
              </View>
            </View>

            <View style={s.balDivider} />

            {/* Stats strip */}
            <View style={{ flexDirection: 'row' }}>
              {[
                { num: activeLoans.length,  lbl: 'Activos'    },
                { num: pendingLoans.length, lbl: 'Pendientes' },
                { num: overdueLoans.length, lbl: 'Vencidos'   },
                { num: loans.length,        lbl: 'Total'      },
              ].map((stat, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <View style={s.balSepLine} />}
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={s.balStatNum}>{stat.num}</Text>
                    <Text style={s.balStatLbl}>{stat.lbl}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </Animated.View>

          {/* Tab bar */}
          <View style={s.tabBar}>
            {(['Resumen', 'Préstamos', 'Clientes', 'Reportes'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[s.tab, activeTab === tab && s.tabActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab); }}
              >
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {/* Body */}
        <View style={s.body}>
          {activeTab === 'Resumen'    && renderResumen()}
          {activeTab === 'Préstamos' && renderPrestamos()}
          {activeTab === 'Clientes'  && renderClientes()}
          {activeTab === 'Reportes'  && renderReportes()}
          <View style={{ height: 100 }} />
        </View>
      </RNAnimated.ScrollView>

      {/* FAB */}
      <Animated.View entering={ZoomIn.delay(900).springify()} style={s.fab}>
        <TouchableOpacity onPress={() => go('LoanRequestForm' as any)} activeOpacity={0.88} style={s.fabTouch}>
          <LinearGradient
            colors={[C.brandLight, C.brandVibrant, C.brandMid]}
            style={s.fabGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Filter chip styles ───────────────────────────────────────────
const fS = StyleSheet.create({
  chip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  chipActive:   { backgroundColor: C.brandVibrant, borderColor: C.brandVibrant },
  chipText:     { fontSize: 11, fontWeight: '700', color: C.textSec },
  chipTextActive: { color: 'white' },
});

// ─── Main Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Floating nav
  floatNav:    { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99, height: 94, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  floatRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE.lg },
  floatTitle:  { fontSize: 15, fontWeight: '800', color: C.text },
  navBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  // Header
  header:      { paddingTop: 54, paddingBottom: 0, overflow: 'hidden' },
  decCircle1:  { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40 },
  decCircle2:  { position: 'absolute', width: 120, height: 120, borderRadius: 60,  backgroundColor: 'rgba(255,255,255,0.04)', bottom: 30, left: -20 },
  headerTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACE.xl, marginBottom: SPACE.lg },
  navBtnWhite: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  notifDot:    { position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: '#fbbf24', borderWidth: 1.5, borderColor: C.brand },
  headerGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500', marginBottom: 2 },
  headerName:  { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },

  // Balance card
  balCard:     { marginHorizontal: SPACE.lg, backgroundColor: 'rgba(255,255,255,0.11)', borderRadius: 20, padding: SPACE.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', marginBottom: SPACE.lg },
  balLabel:    { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginBottom: 4 },
  balValue:    { fontSize: 30, fontWeight: '900', color: 'white', letterSpacing: -1 },
  balIcon:     { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  balDivider:  { height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginBottom: SPACE.md },
  balSepLine:  { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.14)' },
  balStatNum:  { fontSize: 18, fontWeight: '900', color: 'white' },
  balStatLbl:  { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: 2 },

  // Tabs
  tabBar:      { flexDirection: 'row', paddingHorizontal: SPACE.sm, borderTopWidth: 0 },
  tab:         { flex: 1, paddingVertical: SPACE.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:   { borderBottomColor: 'white' },
  tabText:     { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  tabTextActive:{ color: 'white', fontWeight: '700' },

  // Body
  body:        { padding: SPACE.md },
  row:         { flexDirection: 'row' },
  sectionTitle:{ fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: -0.2 },

  // Goal card
  goalCard:    { backgroundColor: C.surface, borderRadius: 16, padding: SPACE.lg, marginBottom: SPACE.md, borderWidth: 1, borderColor: C.border },
  goalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE.sm },
  goalTitle:   { fontSize: 12, fontWeight: '700', color: C.text },
  goalValue:   { fontSize: 13, fontWeight: '900', color: C.brandVibrant },
  goalSub:     { fontSize: 10, color: C.textMuted, fontWeight: '500' },
  progressBg:  { height: 8, backgroundColor: C.brandFaint, borderRadius: 4, overflow: 'hidden' },
  progressFill:{ height: '100%', backgroundColor: C.brandVibrant, borderRadius: 4 },

  // List items
  listItem:    { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE.md, borderBottomWidth: 1, borderBottomColor: C.border },
  listName:    { fontSize: 13, fontWeight: '700', color: C.text },
  listSub:     { fontSize: 10, color: C.textMuted, fontWeight: '500', marginTop: 2 },
  listAmt:     { fontSize: 13, fontWeight: '800', color: C.brandVibrant },
  actIcon:     { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Loan row
  loanRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, padding: SPACE.md, marginBottom: SPACE.sm, borderWidth: 1, borderColor: C.border },

  // KPI bar
  kpiBarBg:    { height: 6, backgroundColor: C.brandFaint, borderRadius: 3, overflow: 'hidden' },
  kpiBarFill:  { height: '100%', borderRadius: 3 },

  // Client stats
  clientStatsRow: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.md },
  clientStat:     { flex: 1, alignItems: 'center', paddingVertical: SPACE.md, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  clientStatValue:{ fontSize: 20, fontWeight: '900' },
  clientStatLabel:{ fontSize: 9, color: C.textSec, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },

  // FAB
  fab:         { position: 'absolute', bottom: 28, right: 20, zIndex: 100, shadowColor: C.brandVibrant, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 10 },
  fabTouch:    { width: 58, height: 58, borderRadius: 29, overflow: 'hidden' },
  fabGrad:     { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
});