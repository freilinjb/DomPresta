import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  StatusBar,
  Animated as RNAnimated,
  ActivityIndicator,
  RefreshControl,
  Share,
  Linking,
  Dimensions,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeIn,
  ZoomIn,
  SlideInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@/navigation/types';
import { useClients } from '@/hooks/useClients';
import { Client } from '@/types/index';

const { width } = Dimensions.get('window');

// ─── Design Tokens ─────────────────────────────────────────────────
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

type ClientDetailsRouteProp = RouteProp<RootStackParamList, 'ClientDetails'>;
type ClientDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'ClientDetails'>;

interface ClientDetailsScreenProps {
  route: ClientDetailsRouteProp;
  navigation: ClientDetailsNavigationProp;
}

const AVATAR_PALETTES: [string, string][] = [
  ['#7c3aed', '#4f46e5'], ['#8b5cf6', '#06b6d4'], ['#f87171', '#f59e0b'],
  ['#059669', '#0891b2'], ['#7c3aed', '#059669'], ['#a78bfa', '#f59e0b'],
];

// ─── Componentes UI ─────────────────────────────────────────────────

const Avatar: React.FC<{ name: string; index: number; size?: number }> = ({ name, index, size = 60 }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const [c1, c2] = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
  const radius = size * 0.28;
  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', borderWidth: 3, borderColor: C.surface }}>
      <LinearGradient colors={[c1, c2]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: size * 0.32, fontWeight: '800' }}>{initials}</Text>
      </View>
    </View>
  );
};

const StatusBadge: React.FC<{ status: Client['status'] }> = ({ status }) => {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    active: { label: 'Activo', bg: C.successBg, color: C.successMid },
    inactive: { label: 'Inactivo', bg: C.warningBg, color: C.warningMid },
    blocked: { label: 'Bloqueado', bg: C.dangerBg, color: C.dangerMid },
  };
  const cfg = config[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const InfoRow: React.FC<{ icon: string; label: string; value: string; copyable?: boolean }> = ({ icon, label, value, copyable }) => {
  const handleCopy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copiado', `${label} copiado al portapapeles`);
  };

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon as any} size={18} color={C.brandVibrant} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <View style={styles.infoValueRow}>
          <Text style={styles.infoValue}>{value || 'No especificado'}</Text>
          {copyable && value && (
            <TouchableOpacity onPress={handleCopy}>
              <Ionicons name="copy-outline" size={16} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const SectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon as any} size={18} color={C.brandVibrant} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </Animated.View>
);

const StatCard: React.FC<{ label: string; value: string | number; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon as any} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActionButton: React.FC<{ icon: string; label: string; onPress: () => void; color?: string }> = ({ icon, label, onPress, color = C.brandVibrant }) => (
  <TouchableOpacity style={[styles.actionButton, { backgroundColor: `${color}10` }]} onPress={onPress} activeOpacity={0.8}>
    <Ionicons name={icon as any} size={22} color={color} />
    <Text style={[styles.actionLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Main Component ─────────────────────────────────────────────────
export const ClientDetailsScreen: React.FC<ClientDetailsScreenProps> = ({ route, navigation }) => {
  const { clientId } = route.params;
  const { getClient, deleteClient, updateClient } = useClients();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const data = await getClient(clientId);
      
      if (data) {
        setClient(data);
      } else {
        Alert.alert('Error', 'No se encontró el cliente en SQLite');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading client:', error);
      Alert.alert('Error', 'No se pudo cargar el cliente');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClient();
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('ClientForm', { clientId });
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Warning);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setShowDeleteModal(false);
      await deleteClient(clientId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Eliminado', 'El cliente ha sido eliminado de SQLite', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo eliminar el cliente');
    }
  };

  const handleCall = () => {
    if (client?.phone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(`tel:${client.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (client?.phone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const phone = client.phone.replace(/\D/g, '');
      Linking.openURL(`https://wa.me/1${phone}`);
    }
  };

  const handleEmail = () => {
    if (client?.email) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(`mailto:${client.email}`);
    }
  };

  const handleShare = async () => {
    if (!client) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Cliente: ${client.firstName} ${client.lastName}\nTeléfono: ${client.phone}\nEmail: ${client.email}\nCiudad: ${client.city}`,
        title: `Cliente: ${client.firstName} ${client.lastName}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return `RD$${value.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCreditScoreColor = (score?: number) => {
    if (!score) return C.textMuted;
    if (score >= 700) return C.successMid;
    if (score >= 600) return C.warningMid;
    return C.dangerMid;
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (loading || !client) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={[C.brand, C.brandMid, C.brandVibrant]} style={styles.loadingGradient} />
        <Animated.View entering={ZoomIn.duration(350)} style={styles.loadingContent}>
          <View style={styles.loadingAvatar}>
            <Ionicons name="person" size={36} color={C.brandVibrant} />
          </View>
          <Text style={styles.loadingText}>Cargando cliente desde SQLite...</Text>
          <ActivityIndicator size="large" color={C.brandVibrant} />
        </Animated.View>
      </View>
    );
  }

  const fullName = `${client.firstName} ${client.lastName}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Header */}
      <RNAnimated.View style={[styles.floatingHeader, { opacity: headerOpacity }]}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={styles.floatingContent}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.floatingTitle} numberOfLines={1}>{fullName}</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={C.brandVibrant} />
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.brandVibrant} />
        }
      >
        {/* Header */}
        <LinearGradient colors={[C.brand, C.brandMid, C.brandVibrant]} style={styles.header}>
          <View style={styles.headerDecoration1} />
          <View style={styles.headerDecoration2} />
          
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detalles del Cliente</Text>
            <TouchableOpacity style={styles.menuButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.profileSection}>
            <Avatar name={fullName} index={0} size={90} />
            <Text style={styles.clientName}>{fullName}</Text>
            <StatusBadge status={client.status} />
            
            {client.creditScore ? (
              <View style={styles.creditScoreContainer}>
                <Ionicons name="ribbon-outline" size={16} color={getCreditScoreColor(client.creditScore)} />
                <Text style={[styles.creditScore, { color: getCreditScoreColor(client.creditScore) }]}>
                  Score: {client.creditScore}
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Quick Stats */}
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statsContainer}>
            <StatCard label="Préstamos" value={client.totalLoans} icon="document-text-outline" color={C.infoMid} />
            <StatCard label="Activos" value={client.activeLoans} icon="trending-up-outline" color={C.successMid} />
            <StatCard label="Total" value={formatCurrency(client.totalAmount)} icon="cash-outline" color={C.warningMid} />
          </Animated.View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.quickActions}>
            <ActionButton icon="call-outline" label="Llamar" onPress={handleCall} color={C.successMid} />
            <ActionButton icon="logo-whatsapp" label="WhatsApp" onPress={handleWhatsApp} color="#25D366" />
            <ActionButton icon="mail-outline" label="Email" onPress={handleEmail} color={C.infoMid} />
          </Animated.View>

          {/* Personal Information */}
          <SectionCard title="Información Personal" icon="person-outline">
            <InfoRow icon="mail-outline" label="Email" value={client.email} copyable />
            <InfoRow icon="call-outline" label="Teléfono" value={client.phone} copyable />
            <InfoRow icon="calendar-outline" label="Cliente desde" value={formatDate(client.createdAt)} />
            <InfoRow icon="time-outline" label="Último contacto" value={formatDate(client.lastContact)} />
          </SectionCard>

          {/* Identification */}
          <SectionCard title="Identificación" icon="card-outline">
            <InfoRow 
              icon="id-card-outline" 
              label="Tipo de documento" 
              value={client.documentType === 'cedula' ? 'Cédula' : client.documentType === 'passport' ? 'Pasaporte' : 'RNC'} 
            />
            <InfoRow icon="barcode-outline" label="Número" value={client.documentNumber} copyable />
          </SectionCard>

          {/* Financial Information */}
          <SectionCard title="Información Financiera" icon="cash-outline">
            <InfoRow icon="trending-up-outline" label="Ingreso mensual" value={formatCurrency(client.monthlyIncome)} />
            <InfoRow icon="briefcase-outline" label="Ocupación" value={client.occupation} />
          </SectionCard>

          {/* Location */}
          <SectionCard title="Ubicación" icon="location-outline">
            <InfoRow icon="home-outline" label="Dirección" value={client.address} />
            <InfoRow icon="business-outline" label="Ciudad" value={client.city} />
          </SectionCard>

          {/* Loan Summary */}
          <SectionCard title="Resumen de Préstamos" icon="wallet-outline">
            <View style={styles.loanSummary}>
              <View style={styles.loanRow}>
                <Text style={styles.loanLabel}>Total de préstamos</Text>
                <Text style={styles.loanValue}>{client.totalLoans}</Text>
              </View>
              <View style={styles.loanDivider} />
              <View style={styles.loanRow}>
                <Text style={styles.loanLabel}>Préstamos activos</Text>
                <Text style={styles.loanValue}>{client.activeLoans}</Text>
              </View>
              <View style={styles.loanDivider} />
              <View style={styles.loanRow}>
                <Text style={styles.loanLabel}>Monto total</Text>
                <Text style={[styles.loanValue, styles.loanAmount]}>{formatCurrency(client.totalAmount)}</Text>
              </View>
            </View>
          </SectionCard>

          {/* System Info */}
          <SectionCard title="Información del Sistema" icon="information-circle-outline">
            <InfoRow icon="key-outline" label="ID del cliente" value={client.id.slice(0, 16) + '...'} />
            <InfoRow icon="calendar-outline" label="Creado" value={formatDate(client.createdAt)} />
          </SectionCard>

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.bottomActions}>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <LinearGradient colors={[C.brandLight, C.brandVibrant]} style={styles.editGradient}>
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Editar Cliente</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={C.dangerMid} />
              <Text style={styles.deleteButtonText}>Eliminar Cliente</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </View>
      </RNAnimated.ScrollView>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <View style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn.duration(200)} style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="warning-outline" size={48} color={C.dangerMid} />
            </View>
            <Text style={styles.modalTitle}>¿Eliminar cliente?</Text>
            <Text style={styles.modalMessage}>
              Esta acción no se puede deshacer. ¿Estás seguro de eliminar a {fullName} de SQLite?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmDelete}>
                <Text style={styles.modalConfirmText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loadingGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingAvatar: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    marginBottom: 16,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 94,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  floatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  floatingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 56,
    paddingBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  headerDecoration1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -80,
    right: -50,
  },
  headerDecoration2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -20,
    left: -30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  clientName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  creditScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  creditScore: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 100,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  content: {
    padding: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    marginHorizontal: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.brandFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
  },
  sectionContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.brandFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 2,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  loanSummary: {
    backgroundColor: C.brandFaint,
    borderRadius: 14,
    padding: 16,
  },
  loanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loanLabel: {
    fontSize: 14,
    color: C.textSec,
  },
  loanValue: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  loanAmount: {
    fontSize: 18,
    color: C.brandVibrant,
  },
  loanDivider: {
    height: 1,
    backgroundColor: C.border,
  },
  bottomActions: {
    marginTop: 8,
    gap: 12,
  },
  editButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  editGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: C.dangerBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.dangerMid + '30',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.dangerMid,
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 24,
    width: width - 48,
    alignItems: 'center',
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: C.textSec,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.bg,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textSec,
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.dangerMid,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

export default ClientDetailsScreen;