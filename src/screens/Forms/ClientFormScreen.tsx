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
  Modal,
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
  SlideInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { RootStackParamList } from '../../navigation/types';
import { useClients } from '../../hooks/useClients';
import { Client } from '../../types';

const { width: SW } = Dimensions.get('window');

// ─── Design Tokens (Unificado con LoanRequestFormScreen) ──────────
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

type ClientFormRouteProp = RouteProp<RootStackParamList, 'ClientForm'>;
type ClientFormNavigationProp = StackNavigationProp<RootStackParamList, 'ClientForm'>;

interface ClientFormScreenProps {
  route: ClientFormRouteProp;
  navigation: ClientFormNavigationProp;
}

// ─── Tipos ─────────────────────────────────────────────────────────
interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  documentType: 'cedula' | 'passport' | 'rnc';
  documentNumber: string;
  monthlyIncome: string;
  occupation: string;
  employer: string;
  yearsEmployed: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  reference1Name: string;
  reference1Phone: string;
  reference1Relationship: string;
  reference2Name: string;
  reference2Phone: string;
  reference2Relationship: string;
  preferredContact: 'phone' | 'email' | 'whatsapp';
  receiveNotifications: boolean;
  receivePromotions: boolean;
  notes: string;
}

const AVATAR_PALETTES: [string, string][] = [
  ['#7c3aed', '#4f46e5'], ['#8b5cf6', '#06b6d4'], ['#f87171', '#f59e0b'],
  ['#059669', '#0891b2'], ['#7c3aed', '#059669'], ['#a78bfa', '#f59e0b'],
];

const DOCUMENT_TYPES = [
  { id: 'cedula', name: 'Cédula', icon: 'card-outline' },
  { id: 'passport', name: 'Pasaporte', icon: 'airplane-outline' },
  { id: 'rnc', name: 'RNC', icon: 'business-outline' },
];

const CONTACT_METHODS = [
  { id: 'phone', name: 'Teléfono', icon: 'call-outline' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp' },
  { id: 'email', name: 'Email', icon: 'mail-outline' },
];

// ─── FieldInput (Estilo exacto de LoanRequestFormScreen) ──────────
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

// ─── PickerField (Estilo exacto de LoanRequestFormScreen) ─────────
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

// ─── SectionCard (Estilo exacto de LoanRequestFormScreen) ─────────
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

// ─── ToggleRow (Estilo exacto de LoanRequestFormScreen) ───────────
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

// ─── Avatar (Estilo unificado) ────────────────────────────────────
const Avatar: React.FC<{ name: string; index: number; size?: number }> = ({ name, index, size = 70 }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
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

// ─── ProgressBar (Estilo exacto de LoanRequestFormScreen) ─────────
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

// ─── Main Component ─────────────────────────────────────────────────
export const ClientFormScreen: React.FC<ClientFormScreenProps> = ({ route, navigation }) => {
  const { clientId } = (route.params || {}) as any;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const [existingClient, setExistingClient] = useState<Client | null>(null);

  const { createClient, updateClient, getClient } = useClients(); // Usar el hook de SQLite

  const [sections, setSections] = useState({
    personal: true, identification: false, financial: false, address: false,
    references: false, preferences: false, notes: false,
  });

  const [form, setForm] = useState<ClientFormData>({
    firstName: 'Freilin Jose', lastName: 'Jerez Brito', email: 'freilinjb@gmail.com', phone: '8295261234', secondaryPhone: '',
    documentType: 'cedula', documentNumber: '03105697175', monthlyIncome: '', occupation: '',
    employer: '', yearsEmployed: '', address: '', city: '', province: '', postalCode: '',
    reference1Name: '', reference1Phone: '', reference1Relationship: '',
    reference2Name: '', reference2Phone: '', reference2Relationship: '',
    preferredContact: 'whatsapp', receiveNotifications: true, receivePromotions: false, notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});

  const MOCK_CLIENT_DATA: ClientFormData = {
    firstName: 'Juan', lastName: 'Pérez González', email: 'juan.perez@email.com',
    phone: '809-555-1234', secondaryPhone: '829-555-5678', documentType: 'cedula',
    documentNumber: '402-1234567-8', monthlyIncome: '45000', occupation: 'Ingeniero de Software',
    employer: 'Tech Solutions SRL', yearsEmployed: '5', address: 'Calle Principal #123',
    city: 'Santo Domingo', province: 'Distrito Nacional', postalCode: '10101',
    reference1Name: 'María Rodríguez', reference1Phone: '809-555-8765', reference1Relationship: 'Hermana',
    reference2Name: 'Carlos Méndez', reference2Phone: '809-555-4321', reference2Relationship: 'Amigo',
    preferredContact: 'whatsapp', receiveNotifications: true, receivePromotions: true,
    notes: 'Cliente preferencial, buen historial de pagos.',
  };

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    if (clientId) loadClient();
  }, []);

  // ✅ Función loadClient actualizada para usar SQLite
  const loadClient = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando cliente con ID:', clientId);

      const client = await getClient(clientId.toString());

      if (client) {
        console.log('✅ Cliente encontrado:', client.firstName, client.lastName);
        setExistingClient(client);

        // Mapear datos del cliente de SQLite al formulario
        setForm({
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          email: client.email || '',
          phone: client.phone || '',
          secondaryPhone: '',
          documentType: client.documentType || 'cedula',
          documentNumber: client.documentNumber || '',
          monthlyIncome: client.monthlyIncome?.toString() || '',
          occupation: client.occupation || '',
          employer: '',
          yearsEmployed: '',
          address: client.address || '',
          city: client.city || '',
          province: '',
          postalCode: '',
          reference1Name: '',
          reference1Phone: '',
          reference1Relationship: '',
          reference2Name: '',
          reference2Phone: '',
          reference2Relationship: '',
          preferredContact: 'whatsapp',
          receiveNotifications: true,
          receivePromotions: false,
          notes: '',
        });
      } else {
        console.log('❌ Cliente no encontrado');
        Alert.alert(
          'Error',
          'No se encontró el cliente en la base de datos.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('❌ Error al cargar cliente:', error);
      Alert.alert(
        'Error',
        'No se pudo cargar el cliente. Verifica tu conexión a la base de datos.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const set = <K extends keyof ClientFormData>(key: K, value: ClientFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const toggle = (section: keyof typeof sections) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof ClientFormData, string>> = {};
    if (!form.firstName.trim()) e.firstName = 'Nombre requerido';
    if (!form.lastName.trim()) e.lastName = 'Apellido requerido';
    if (!form.email.trim()) e.email = 'Email requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (!form.phone.trim()) e.phone = 'Teléfono requerido';
    if (!form.documentNumber.trim()) e.documentNumber = 'Número de documento requerido';
    if (form.reference1Name && !form.reference1Phone) e.reference1Phone = 'Teléfono requerido';
    if (form.reference2Name && !form.reference2Phone) e.reference2Phone = 'Teléfono requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ✅ Función handleSubmit actualizada para guardar en SQLite
  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const hasPersonalErr = errors.firstName || errors.lastName || errors.email || errors.phone;
      const hasIdErr = errors.documentNumber;
      const hasRefErr = errors.reference1Phone || errors.reference2Phone;
      setSections(prev => ({
        ...prev,
        personal: hasPersonalErr ? true : prev.personal,
        identification: hasIdErr ? true : prev.identification,
        references: hasRefErr ? true : prev.references,
      }));
      Alert.alert('Campos incompletos', 'Revisa los campos marcados en rojo.');
      return;
    }

    setSaving(true);

    try {
      // Preparar datos para SQLite
      const validDocumentType = (form.documentType === 'cedula' || 
                               form.documentType === 'passport' || 
                               form.documentType === 'rnc') 
      ? form.documentType 
      : 'cedula'; // Valor por defecto

      const clientData = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        documentType: validDocumentType,
        documentNumber: form.documentNumber.trim(),
        monthlyIncome: parseFloat(form.monthlyIncome) || 0,
        occupation: form.occupation.trim() || 'No especificada',
        address: form.address.trim() || 'No especificada',
        city: form.city.trim() || 'No especificada',
        status: existingClient?.status || 'active' as const,
        totalLoans: existingClient?.totalLoans || 0,
        activeLoans: existingClient?.activeLoans || 0,
        totalAmount: existingClient?.totalAmount || 0,
        lastContact: new Date().toISOString().split('T')[0],
        creditScore: existingClient?.creditScore,
      };

      let savedClient: Client;

      if (clientId) {
        // Actualizar cliente existente
        console.log('📝 Actualizando cliente:', clientId);
        savedClient = await updateClient(clientId, clientData);

        if (!savedClient) {
          throw new Error('No se pudo actualizar el cliente');
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '✅ Cliente Actualizado',
          'Los datos del cliente se han actualizado correctamente en SQLite.',
          [{
            text: 'OK', onPress: () => {
              // if (onSubmit) onSubmit(savedClient);
              navigation.goBack();
            }
          }]
        );
      } else {
        // Crear nuevo cliente
        console.log('✨ Creando nuevo cliente');
        const newClientData = {
          ...clientData,
          createdAt: new Date().toISOString(),
        };

        savedClient = await createClient(newClientData);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        //LOAD CLIENTS
        loadClient();

        Alert.alert(
          '✅ Cliente Creado',
          `El cliente ${savedClient.firstName} ${savedClient.lastName} se ha registrado correctamente en SQLite.`,
          [{
            text: 'OK', onPress: () => {
              // if (onSubmit) onSubmit(savedClient);
              navigation.goBack();
            }
          }]
        );
      }

      console.log('💾 Cliente guardado en SQLite:', savedClient.id);

    } catch (error) {
      console.error('❌ Error al guardar cliente:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        'No se pudo guardar el cliente en la base de datos SQLite. Verifica los datos e intenta nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const openSections = Object.values(sections).filter(Boolean).length;
  const navOpacity = scrollY.interpolate({ inputRange: [0, 70], outputRange: [0, 1], extrapolate: 'clamp' });
  const fullName = `${form.firstName} ${form.lastName}`.trim() || 'Nuevo Cliente';
  const getDocLabel = () => DOCUMENT_TYPES.find(d => d.id === form.documentType)?.name || '';
  const getContactLabel = () => CONTACT_METHODS.find(c => c.id === form.preferredContact)?.name || '';

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <LinearGradient colors={[C.brand, C.brandMid, C.brandVibrant]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View entering={ZoomIn.duration(350)} style={{ alignItems: 'center' }}>
            <View style={{ width: 76, height: 76, borderRadius: 22, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Ionicons name="person" size={36} color={C.brandVibrant} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 16 }}>Cargando cliente…</Text>
            <ActivityIndicator size="large" color={C.brandVibrant} />
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <RNAnimated.View style={[s.floatNav, { opacity: navOpacity }]} pointerEvents="box-none">
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={s.floatRow}>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.floatTitle}>{clientId ? 'Editar Cliente' : 'Nuevo Cliente'}</Text>
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
        <LinearGradient colors={[C.brand, C.brandMid, C.brandVibrant]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
          <View style={s.decCircle1} /><View style={s.decCircle2} />
          <View style={s.headerTop}>
            <TouchableOpacity style={s.navBtnWhite} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={s.headerLabel}>{clientId ? 'EDICIÓN' : 'NUEVO CLIENTE'}</Text>
              <Text style={s.headerTitle}>{clientId ? 'Editar Cliente' : 'Nuevo Cliente'}</Text>
            </View>
            <TouchableOpacity style={[s.navBtnWhite, saving && { opacity: 0.5 }]} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.avatarContainer}>
            <Avatar name={fullName} index={0} size={80} />
            <Text style={s.headerName}>{fullName}</Text>
            {form.email ? <Text style={s.headerEmail}>{form.email}</Text> : null}
          </Animated.View>

          <ProgressBar current={openSections} total={Object.keys(sections).length} />
        </LinearGradient>

        <View style={s.body}>
          {/* ─── 1. Personal ──────────────────────────── */}
          <SectionCard title="Información Personal" icon="person-outline" expanded={sections.personal} onToggle={() => toggle('personal')} badge={form.firstName ? '✓' : undefined} badgeColor={C.successMid} index={0}>
            <View style={s.row}>
              <View style={s.half}><FieldInput label="Nombre" value={form.firstName} onChangeText={v => set('firstName', v)} placeholder="Juan" icon="person-outline" error={errors.firstName} required /></View>
              <View style={s.half}><FieldInput label="Apellido" value={form.lastName} onChangeText={v => set('lastName', v)} placeholder="Pérez" icon="person-outline" error={errors.lastName} required /></View>
            </View>
            <FieldInput label="Email" value={form.email} onChangeText={v => set('email', v)} placeholder="cliente@email.com" keyboardType="email-address" icon="mail-outline" error={errors.email} required />
            <View style={s.row}>
              <View style={s.half}><FieldInput label="Teléfono principal" value={form.phone} onChangeText={v => set('phone', v)} placeholder="809-555-1234" keyboardType="phone-pad" icon="call-outline" error={errors.phone} required /></View>
              <View style={s.half}><FieldInput label="Teléfono secundario" value={form.secondaryPhone} onChangeText={v => set('secondaryPhone', v)} placeholder="829-555-5678" keyboardType="phone-pad" icon="call-outline" /></View>
            </View>
          </SectionCard>

          {/* ─── 2. Identificación ───────────────────── */}
          <SectionCard title="Identificación" icon="card-outline" expanded={sections.identification} onToggle={() => toggle('identification')} index={1}>
            <PickerField label="Tipo de documento" value={form.documentType} onValueChange={v => set('documentType', v as any)} items={DOCUMENT_TYPES.map(d => ({ label: d.name, value: d.id }))} icon="card-outline" />
            <FieldInput label="Número de documento" value={form.documentNumber} onChangeText={v => set('documentNumber', v)} placeholder="402-1234567-8" icon="barcode-outline" error={errors.documentNumber} required />
          </SectionCard>

          {/* ─── 3. Financiera ───────────────────────── */}
          <SectionCard title="Información Financiera" icon="cash-outline" expanded={sections.financial} onToggle={() => toggle('financial')} index={2}>
            <FieldInput label="Ingreso mensual" value={form.monthlyIncome} onChangeText={v => set('monthlyIncome', v)} placeholder="45,000" keyboardType="numeric" prefix="RD$" icon="cash-outline" />
            <FieldInput label="Ocupación" value={form.occupation} onChangeText={v => set('occupation', v)} placeholder="Ingeniero de Software" icon="briefcase-outline" />
            <FieldInput label="Empleador/Empresa" value={form.employer} onChangeText={v => set('employer', v)} placeholder="Tech Solutions SRL" icon="business-outline" />
            <FieldInput label="Años en empleo actual" value={form.yearsEmployed} onChangeText={v => set('yearsEmployed', v)} placeholder="5" keyboardType="numeric" suffix="años" icon="time-outline" />
          </SectionCard>

          {/* ─── 4. Dirección ────────────────────────── */}
          <SectionCard title="Dirección" icon="location-outline" expanded={sections.address} onToggle={() => toggle('address')} index={3}>
            <FieldInput label="Dirección" value={form.address} onChangeText={v => set('address', v)} placeholder="Calle Principal #123" icon="home-outline" multiline numberOfLines={2} />
            <View style={s.row}>
              <View style={s.half}><FieldInput label="Ciudad" value={form.city} onChangeText={v => set('city', v)} placeholder="Santo Domingo" icon="location-outline" /></View>
              <View style={s.half}><FieldInput label="Provincia" value={form.province} onChangeText={v => set('province', v)} placeholder="Distrito Nacional" icon="map-outline" /></View>
            </View>
            <FieldInput label="Código Postal" value={form.postalCode} onChangeText={v => set('postalCode', v)} placeholder="10101" keyboardType="numeric" icon="mail-outline" />
          </SectionCard>

          {/* ─── 5. Referencias ──────────────────────── */}
          <SectionCard title="Referencias" icon="people-outline" expanded={sections.references} onToggle={() => toggle('references')} index={4}>
            <Text style={s.subLabel}>Referencia 1</Text>
            <FieldInput label="Nombre completo" value={form.reference1Name} onChangeText={v => set('reference1Name', v)} placeholder="María Rodríguez" icon="person-outline" />
            <View style={s.row}>
              <View style={s.half}><FieldInput label="Teléfono" value={form.reference1Phone} onChangeText={v => set('reference1Phone', v)} placeholder="809-555-8765" keyboardType="phone-pad" icon="call-outline" error={errors.reference1Phone} /></View>
              <View style={s.half}><FieldInput label="Relación" value={form.reference1Relationship} onChangeText={v => set('reference1Relationship', v)} placeholder="Hermana" icon="git-network-outline" /></View>
            </View>
            <Text style={[s.subLabel, { marginTop: 16 }]}>Referencia 2</Text>
            <FieldInput label="Nombre completo" value={form.reference2Name} onChangeText={v => set('reference2Name', v)} placeholder="Carlos Méndez" icon="person-outline" />
            <View style={s.row}>
              <View style={s.half}><FieldInput label="Teléfono" value={form.reference2Phone} onChangeText={v => set('reference2Phone', v)} placeholder="809-555-4321" keyboardType="phone-pad" icon="call-outline" error={errors.reference2Phone} /></View>
              <View style={s.half}><FieldInput label="Relación" value={form.reference2Relationship} onChangeText={v => set('reference2Relationship', v)} placeholder="Amigo" icon="git-network-outline" /></View>
            </View>
          </SectionCard>

          {/* ─── 6. Preferencias ─────────────────────── */}
          <SectionCard title="Preferencias" icon="settings-outline" expanded={sections.preferences} onToggle={() => toggle('preferences')} index={5}>
            <PickerField label="Método de contacto preferido" value={form.preferredContact} onValueChange={v => set('preferredContact', v as any)} items={CONTACT_METHODS.map(c => ({ label: c.name, value: c.id }))} icon="chatbubbles-outline" />
            <View style={s.divider} />
            <ToggleRow label="Recibir notificaciones" sub="Alertas de pagos y vencimientos" icon="notifications-outline" value={form.receiveNotifications} onChange={v => set('receiveNotifications', v)} />
            <ToggleRow label="Recibir promociones" sub="Ofertas y novedades" icon="pricetag-outline" value={form.receivePromotions} onChange={v => set('receivePromotions', v)} />
          </SectionCard>

          {/* ─── 7. Notas ────────────────────────────── */}
          <SectionCard title="Notas Adicionales" icon="document-text-outline" expanded={sections.notes} onToggle={() => toggle('notes')} index={6}>
            <FieldInput label="Notas" value={form.notes} onChangeText={v => set('notes', v)} placeholder="Información adicional sobre el cliente…" multiline numberOfLines={4} icon="create-outline" />
          </SectionCard>

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
                    <Ionicons name="save-outline" size={17} color="#fff" />
                    <Text style={s.submitText}>{clientId ? 'Actualizar' : 'Crear Cliente'}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 48 }} />
        </View>
      </RNAnimated.ScrollView>
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
  avatarContainer: { alignItems: 'center', marginBottom: 16 },
  headerName: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 8, letterSpacing: -0.4 },
  headerEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  body: { padding: 12, paddingTop: 14 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  subLabel: { fontSize: 12, fontWeight: '700', color: C.textSec, marginBottom: 8, letterSpacing: 0.1 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: 6 },
  cancelBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 15, borderRadius: 15, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  cancelText: { fontSize: 14, fontWeight: '700', color: C.textSec },
  submitBtn: { flex: 2.5, borderRadius: 15, overflow: 'hidden', shadowColor: C.brandVibrant, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  submitText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});