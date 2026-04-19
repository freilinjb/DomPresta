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
  Pressable,
  Modal,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { RootStackParamList } from '../../navigation/types';

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
  info: '#0284c7',
  infoBg: '#f0f9ff',
  orange: '#f97316',
  orangeBg: '#fff7ed',
};

type LoanRequestFormRouteProp = RouteProp<RootStackParamList, 'LoanRequestForm'>;
type LoanRequestFormNavigationProp = StackNavigationProp<RootStackParamList, 'LoanRequestForm'>;

interface LoanRequestFormScreenProps {
  route: LoanRequestFormRouteProp;
  navigation: LoanRequestFormNavigationProp;
}

// ─── Tipos ─────────────────────────────────────────────────────────
interface ClientOption {
  id: string;
  name: string;
  phone: string;
  email?: string;
  documentId?: string;
}

interface LoanTypeOption {
  id: string;
  name: string;
  category: 'formal' | 'informal' | 'san';
  minAmount: number;
  maxAmount: number;
  defaultTerm: number;
  defaultInterest: number;
}

interface FormData {
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientDocument: string;
  isNewClient: boolean;
  loanType: string;
  amount: string;
  term: string;
  purpose: string;
  priority: 'high' | 'medium' | 'low';
  expectedDate: string;
  monthlyIncome: string;
  employmentStatus: string;
  employer: string;
  yearsEmployed: string;
  hasGuarantor: boolean;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
  hasCollateral: boolean;
  collateralType: string;
  collateralValue: string;
  collateralDescription: string;
  notes: string;
  notifyWhenApproved: boolean;
  notifyWhenRejected: boolean;
}

// ─── Datos Mock ────────────────────────────────────────────────────
const MOCK_CLIENTS: ClientOption[] = [
  { id: '1', name: 'Juan Rodríguez Méndez', phone: '809-555-1234', email: 'juan@email.com', documentId: '402-1234567-8' },
  { id: '2', name: 'María Pérez González', phone: '829-555-2345', email: 'maria@email.com', documentId: '402-8765432-1' },
  { id: '3', name: 'Carlos García López', phone: '809-555-3456', email: 'carlos@email.com', documentId: '402-3456789-0' },
  { id: '4', name: 'Ana Martínez Ruiz', phone: '829-555-4567', email: 'ana@email.com', documentId: '402-9876543-2' },
];

const MOCK_LOAN_TYPES: LoanTypeOption[] = [
  { id: '1', name: 'Personal', category: 'formal', minAmount: 5000, maxAmount: 500000, defaultTerm: 12, defaultInterest: 12 },
  { id: '2', name: 'San Tradicional', category: 'san', minAmount: 1000, maxAmount: 100000, defaultTerm: 30, defaultInterest: 20 },
  { id: '3', name: 'Microcrédito', category: 'informal', minAmount: 500, maxAmount: 25000, defaultTerm: 12, defaultInterest: 15 },
  { id: '4', name: 'San Express', category: 'san', minAmount: 500, maxAmount: 25000, defaultTerm: 15, defaultInterest: 25 },
  { id: '5', name: 'Vehículo', category: 'formal', minAmount: 100000, maxAmount: 2000000, defaultTerm: 60, defaultInterest: 10 },
];

const COLLATERAL_TYPES = [
  { id: '1', name: 'Prendaria' },
  { id: '2', name: 'Hipotecaria' },
  { id: '3', name: 'Vehículo' },
  { id: '4', name: 'Electrodoméstico' },
  { id: '5', name: 'Joyas' },
];

const EMPLOYMENT_STATUS = [
  { id: 'employed', name: 'Empleado' },
  { id: 'self_employed', name: 'Trabajador independiente' },
  { id: 'business_owner', name: 'Dueño de negocio' },
  { id: 'retired', name: 'Jubilado/Pensionado' },
  { id: 'unemployed', name: 'Desempleado' },
];

// ─── Componentes ───────────────────────────────────────────────────

const InputField: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  error?: string;
  required?: boolean;
  prefix?: string;
  suffix?: string;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  helper?: string;
  icon?: string;
}> = ({ label, value, onChangeText, placeholder, keyboardType = 'default', error, required = false, prefix, suffix, editable = true, multiline = false, numberOfLines = 1, helper, icon }) => {
  const [isFocused, setIsFocused] = useState(false);
  const shakeAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (error) {
      RNAnimated.sequence([
        RNAnimated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  return (
    <RNAnimated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      <View style={inputS.container}>
        <View style={inputS.labelContainer}>
          {icon && <Ionicons name={icon as any} size={16} color={isFocused ? C.primary2 : C.textMuted} />}
          <Text style={inputS.label}>{label} {required && <Text style={inputS.required}>*</Text>}</Text>
        </View>
        <View style={[inputS.inputWrapper, isFocused && inputS.inputFocused, error && inputS.inputError, !editable && inputS.inputDisabled]}>
          {prefix && <Text style={inputS.prefix}>{prefix}</Text>}
          <TextInput
            style={[inputS.input, multiline && inputS.textArea]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={C.textMuted}
            keyboardType={keyboardType}
            editable={editable}
            multiline={multiline}
            numberOfLines={numberOfLines}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {suffix && <Text style={inputS.suffix}>{suffix}</Text>}
        </View>
        {(error || helper) && (
          <Text style={[inputS.helperText, error && inputS.errorText]}>{error || helper}</Text>
        )}
      </View>
    </RNAnimated.View>
  );
};

const inputS = StyleSheet.create({
  container: { marginBottom: 16 },
  labelContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
  required: { color: C.danger },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: C.border, minHeight: 48 },
  inputFocused: { borderColor: C.primary2, backgroundColor: C.white },
  inputError: { borderColor: C.danger },
  inputDisabled: { backgroundColor: '#f8f9fa', opacity: 0.7 },
  input: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 12 },
  textArea: { height: 100, textAlignVertical: 'top' },
  preffix: { fontSize: 14, color: C.textMuted, marginRight: 4 },
  suffix: { fontSize: 14, color: C.textMuted, marginLeft: 4 },
  helperText: { fontSize: 11, color: C.textMuted, marginTop: 4, marginLeft: 4 },
  errorText: { color: C.danger },
});

const SelectField: React.FC<{
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
  error?: string;
  required?: boolean;
  helper?: string;
  icon?: string;
}> = ({ label, value, onValueChange, items, error, required, helper, icon }) => (
  <View style={selectS.container}>
    <View style={selectS.labelContainer}>
      {icon && <Ionicons name={icon as any} size={16} color={C.textMuted} />}
      <Text style={selectS.label}>{label} {required && <Text style={selectS.required}>*</Text>}</Text>
    </View>
    <View style={[selectS.pickerWrapper, error && selectS.pickerError]}>
      <Picker selectedValue={value} onValueChange={onValueChange} style={selectS.picker} dropdownIconColor={C.textMuted}>
        <Picker.Item label={`Seleccione ${label.toLowerCase()}`} value="" color={C.textMuted} />
        {items.map((item) => <Picker.Item key={item.value} label={item.label} value={item.value} />)}
      </Picker>
    </View>
    {(error || helper) && (
      <Text style={[selectS.helperText, error && selectS.errorText]}>{error || helper}</Text>
    )}
  </View>
);

const selectS = StyleSheet.create({
  container: { marginBottom: 16 },
  labelContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '700', color: C.text },
  required: { color: C.danger },
  pickerWrapper: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.border },
  pickerError: { borderColor: C.danger },
  picker: { height: 50 },
  helperText: { fontSize: 11, color: C.textMuted, marginTop: 4, marginLeft: 4 },
  errorText: { color: C.danger },
});

const SectionHeader: React.FC<{ title: string; icon: string; isExpanded?: boolean; onToggle?: () => void }> = ({ title, icon, isExpanded = true, onToggle }) => (
  <TouchableOpacity style={sectionS.container} onPress={onToggle} disabled={!onToggle} activeOpacity={0.7}>
    <View style={sectionS.left}>
      <View style={sectionS.iconBg}>
        <Ionicons name={icon as any} size={16} color={C.primary2} />
      </View>
      <Text style={sectionS.title}>{title}</Text>
    </View>
    {onToggle && (
      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={C.textMuted} />
    )}
  </TouchableOpacity>
);

const sectionS = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 8 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBg: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.primary5, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '800', color: C.text },
});

const Card: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <View style={[cardS.container, style]}>{children}</View>
);

const cardS = StyleSheet.create({
  container: { backgroundColor: C.white, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: C.border },
});

// ─── Componente Principal ──────────────────────────────────────────
export const LoanRequestFormScreen: React.FC<LoanRequestFormScreenProps> = ({ route, navigation }) => {
  const { requestId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  // Estado de secciones expandidas
  const [expandedSections, setExpandedSections] = useState({
    client: true,
    loan: true,
    financial: false,
    guarantor: false,
    collateral: false,
    additional: false,
  });

  const [formData, setFormData] = useState<FormData>({
    clientId: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientDocument: '',
    isNewClient: false,
    loanType: '',
    amount: '',
    term: '',
    purpose: '',
    priority: 'medium',
    expectedDate: new Date().toISOString().split('T')[0],
    monthlyIncome: '',
    employmentStatus: '',
    employer: '',
    yearsEmployed: '',
    hasGuarantor: false,
    guarantorName: '',
    guarantorPhone: '',
    guarantorRelationship: '',
    hasCollateral: false,
    collateralType: '',
    collateralValue: '',
    collateralDescription: '',
    notes: '',
    notifyWhenApproved: true,
    notifyWhenRejected: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Datos mock para carga de solicitud existente
  const MOCK_REQUEST_DATA: Partial<FormData> = {
    clientId: '1',
    clientName: 'Juan Rodríguez Méndez',
    clientPhone: '809-555-1234',
    clientEmail: 'juan@email.com',
    clientDocument: '402-1234567-8',
    loanType: '2',
    amount: '15000',
    term: '30',
    purpose: 'Capital de trabajo para negocio',
    priority: 'high',
    monthlyIncome: '45000',
    employmentStatus: 'self_employed',
    employer: 'Negocio propio',
    yearsEmployed: '5',
    hasGuarantor: true,
    guarantorName: 'María Pérez',
    guarantorPhone: '809-555-5678',
    guarantorRelationship: 'Hermana',
    notes: 'Cliente VIP, buen historial',
  };

  useEffect(() => {
    if (requestId) {
      loadRequestData();
    }
    navigation.setOptions({ headerShown: false });
  }, [requestId]);

  const loadRequestData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setFormData(prev => ({ ...prev, ...MOCK_REQUEST_DATA }));
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSelectClient = (client: ClientOption) => {
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      clientEmail: client.email || '',
      clientDocument: client.documentId || '',
      isNewClient: false,
    }));
    setShowClientModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLoanTypeChange = (value: string) => {
    const loanType = MOCK_LOAN_TYPES.find(t => t.id === value);
    if (loanType) {
      setFormData(prev => ({
        ...prev,
        loanType: value,
        term: loanType.defaultTerm.toString(),
      }));
    } else {
      updateFormData('loanType', value);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.clientId && !formData.isNewClient) {
      newErrors.clientName = 'Seleccione un cliente existente o registre uno nuevo';
    }
    if (formData.isNewClient && !formData.clientName.trim()) {
      newErrors.clientName = 'El nombre del cliente es requerido';
    }
    if (formData.isNewClient && !formData.clientPhone.trim()) {
      newErrors.clientPhone = 'El teléfono es requerido';
    }
    if (!formData.loanType) {
      newErrors.loanType = 'Seleccione un tipo de préstamo';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Monto inválido';
    }
    if (!formData.term || parseInt(formData.term) <= 0) {
      newErrors.term = 'Plazo inválido';
    }
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'El propósito es requerido';
    }
    if (formData.hasGuarantor && !formData.guarantorName.trim()) {
      newErrors.guarantorName = 'Nombre del codeudor requerido';
    }
    if (formData.hasCollateral && !formData.collateralType) {
      newErrors.collateralType = 'Tipo de garantía requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Formulario incompleto', 'Por favor complete todos los campos requeridos (*)');
      return;
    }

    setSaving(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ ¡Solicitud enviada!',
        requestId ? 'La solicitud ha sido actualizada correctamente.' : 'La solicitud ha sido enviada para revisión.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo procesar la solicitud');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (v: string) => {
    const num = parseFloat(v) || 0;
    return `RD$${num.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const selectedLoanType = MOCK_LOAN_TYPES.find(t => t.id === formData.loanType);

  if (loading) {
    return (
      <View style={loadS.container}>
        <LinearGradient colors={[C.primary, '#6d28d9']} style={loadS.gradient} />
        <Animated.View entering={ZoomIn.duration(400)} style={loadS.content}>
          <View style={loadS.iconBg}>
            <Ionicons name="document-text" size={40} color={C.primary2} />
          </View>
          <Text style={loadS.title}>Cargando solicitud...</Text>
          <ActivityIndicator size="large" color={C.primary2} />
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <RNAnimated.View style={[styles.floatNav, { opacity: headerOpacity }]}>
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={styles.floatContent}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.floatTitle}>{requestId ? 'Editar Solicitud' : 'Nueva Solicitud'}</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={handleSubmit} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={C.primary2} /> : <Ionicons name="checkmark" size={22} color={C.text} />}
          </TouchableOpacity>
        </View>
      </RNAnimated.View>

      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient colors={[C.primary, '#6d28d9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{requestId ? 'Editar Solicitud' : 'Nueva Solicitud'}</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="checkmark" size={22} color="white" />}
            </TouchableOpacity>
          </View>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerInfo}>
            <Text style={styles.headerSubtitle}>Complete el formulario para solicitar un préstamo</Text>
          </Animated.View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ─── CLIENTE ─────────────────────────────────── */}
          <SectionHeader title="Información del Cliente" icon="person-outline" isExpanded={expandedSections.client} onToggle={() => toggleSection('client')} />
          
          {expandedSections.client && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <Card>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Cliente nuevo</Text>
                  <Switch
                    value={formData.isNewClient}
                    onValueChange={(value) => updateFormData('isNewClient', value)}
                    trackColor={{ false: C.border, true: C.primary3 }}
                    thumbColor={formData.isNewClient ? C.primary2 : C.white}
                  />
                </View>

                {!formData.isNewClient ? (
                  <>
                    <TouchableOpacity style={styles.clientSelector} onPress={() => setShowClientModal(true)}>
                      <View style={styles.clientSelectorContent}>
                        <View style={styles.clientAvatar}>
                          <Ionicons name="person" size={24} color={C.primary2} />
                        </View>
                        <View style={styles.clientInfo}>
                          <Text style={styles.clientName}>{formData.clientName || 'Seleccionar cliente existente'}</Text>
                          {formData.clientPhone && <Text style={styles.clientPhone}>{formData.clientPhone}</Text>}
                        </View>
                        <Ionicons name="chevron-down" size={20} color={C.textMuted} />
                      </View>
                    </TouchableOpacity>
                    {errors.clientName && <Text style={styles.fieldError}>{errors.clientName}</Text>}
                  </>
                ) : (
                  <>
                    <InputField label="Nombre completo" value={formData.clientName} onChangeText={(v) => updateFormData('clientName', v)} placeholder="Ej: Juan Pérez" icon="person-outline" error={errors.clientName} required />
                    <InputField label="Teléfono" value={formData.clientPhone} onChangeText={(v) => updateFormData('clientPhone', v)} placeholder="Ej: 809-555-1234" keyboardType="phone-pad" icon="call-outline" error={errors.clientPhone} required />
                    <InputField label="Email" value={formData.clientEmail} onChangeText={(v) => updateFormData('clientEmail', v)} placeholder="cliente@email.com" keyboardType="email-address" icon="mail-outline" />
                    <InputField label="Documento de identidad" value={formData.clientDocument} onChangeText={(v) => updateFormData('clientDocument', v)} placeholder="Cédula o pasaporte" icon="card-outline" />
                  </>
                )}
              </Card>
            </Animated.View>
          )}

          {/* ─── PRÉSTAMO ───────────────────────────────── */}
          <SectionHeader title="Detalles del Préstamo" icon="cash-outline" isExpanded={expandedSections.loan} onToggle={() => toggleSection('loan')} />
          
          {expandedSections.loan && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <Card>
                <SelectField label="Tipo de préstamo" value={formData.loanType} onValueChange={handleLoanTypeChange} items={MOCK_LOAN_TYPES.map(t => ({ label: t.name, value: t.id }))} icon="options-outline" error={errors.loanType} required />
                
                {selectedLoanType && (
                  <View style={styles.loanTypeInfo}>
                    <Ionicons name="information-circle" size={16} color={C.info} />
                    <Text style={styles.loanTypeInfoText}>
                      Monto: RD${selectedLoanType.minAmount.toLocaleString()} - RD${selectedLoanType.maxAmount.toLocaleString()} | 
                      Interés: {selectedLoanType.defaultInterest}% | 
                      Plazo sugerido: {selectedLoanType.defaultTerm} {selectedLoanType.category === 'san' ? 'días' : 'meses'}
                    </Text>
                  </View>
                )}

                <InputField label="Monto solicitado" value={formData.amount} onChangeText={(v) => updateFormData('amount', v)} placeholder="Ej: 10000" keyboardType="numeric" prefix="RD$" icon="cash-outline" error={errors.amount} required />
                <InputField label={selectedLoanType?.category === 'san' ? 'Plazo (días)' : 'Plazo (meses)'} value={formData.term} onChangeText={(v) => updateFormData('term', v)} placeholder={selectedLoanType?.category === 'san' ? 'Ej: 30' : 'Ej: 12'} keyboardType="numeric" icon="calendar-outline" error={errors.term} required />
                <InputField label="Propósito del préstamo" value={formData.purpose} onChangeText={(v) => updateFormData('purpose', v)} placeholder="Describa el propósito del préstamo" multiline numberOfLines={3} icon="create-outline" error={errors.purpose} required />
                
                <SelectField label="Prioridad" value={formData.priority} onValueChange={(v) => updateFormData('priority', v as any)} items={[
                  { label: 'Alta', value: 'high' },
                  { label: 'Media', value: 'medium' },
                  { label: 'Baja', value: 'low' },
                ]} icon="flag-outline" />
              </Card>
            </Animated.View>
          )}

          {/* ─── INFORMACIÓN FINANCIERA ─────────────────── */}
          <SectionHeader title="Información Financiera" icon="wallet-outline" isExpanded={expandedSections.financial} onToggle={() => toggleSection('financial')} />
          
          {expandedSections.financial && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <Card>
                <InputField label="Ingreso mensual" value={formData.monthlyIncome} onChangeText={(v) => updateFormData('monthlyIncome', v)} placeholder="Ej: 35000" keyboardType="numeric" prefix="RD$" icon="trending-up-outline" />
                <SelectField label="Situación laboral" value={formData.employmentStatus} onValueChange={(v) => updateFormData('employmentStatus', v)} items={EMPLOYMENT_STATUS.map(s => ({ label: s.name, value: s.id }))} icon="briefcase-outline" />
                <InputField label="Empleador/Negocio" value={formData.employer} onChangeText={(v) => updateFormData('employer', v)} placeholder="Nombre del empleador o negocio" icon="business-outline" />
                <InputField label="Años en empleo/negocio" value={formData.yearsEmployed} onChangeText={(v) => updateFormData('yearsEmployed', v)} placeholder="Ej: 3" keyboardType="numeric" icon="time-outline" />
              </Card>
            </Animated.View>
          )}

          {/* ─── CODEUDOR ───────────────────────────────── */}
          <SectionHeader title="Codeudor (Aval)" icon="people-outline" isExpanded={expandedSections.guarantor} onToggle={() => toggleSection('guarantor')} />
          
          {expandedSections.guarantor && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <Card>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Incluir codeudor</Text>
                  <Switch
                    value={formData.hasGuarantor}
                    onValueChange={(v) => updateFormData('hasGuarantor', v)}
                    trackColor={{ false: C.border, true: C.primary3 }}
                    thumbColor={formData.hasGuarantor ? C.primary2 : C.white}
                  />
                </View>

                {formData.hasGuarantor && (
                  <>
                    <InputField label="Nombre completo" value={formData.guarantorName} onChangeText={(v) => updateFormData('guarantorName', v)} placeholder="Nombre del codeudor" icon="person-outline" error={errors.guarantorName} required />
                    <InputField label="Teléfono" value={formData.guarantorPhone} onChangeText={(v) => updateFormData('guarantorPhone', v)} placeholder="Teléfono de contacto" keyboardType="phone-pad" icon="call-outline" />
                    <InputField label="Relación con el cliente" value={formData.guarantorRelationship} onChangeText={(v) => updateFormData('guarantorRelationship', v)} placeholder="Ej: Familiar, Amigo, Socio" icon="git-network-outline" />
                    
                    <View style={styles.infoBox}>
                      <Ionicons name="information-circle" size={16} color={C.info} />
                      <Text style={styles.infoBoxText}>El codeudor será responsable solidario del préstamo.</Text>
                    </View>
                  </>
                )}
              </Card>
            </Animated.View>
          )}

          {/* ─── GARANTÍA ───────────────────────────────── */}
          <SectionHeader title="Garantía" icon="shield-checkmark-outline" isExpanded={expandedSections.collateral} onToggle={() => toggleSection('collateral')} />
          
          {expandedSections.collateral && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <Card>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Incluir garantía</Text>
                  <Switch
                    value={formData.hasCollateral}
                    onValueChange={(v) => updateFormData('hasCollateral', v)}
                    trackColor={{ false: C.border, true: C.primary3 }}
                    thumbColor={formData.hasCollateral ? C.primary2 : C.white}
                  />
                </View>

                {formData.hasCollateral && (
                  <>
                    <SelectField label="Tipo de garantía" value={formData.collateralType} onValueChange={(v) => updateFormData('collateralType', v)} items={COLLATERAL_TYPES.map(t => ({ label: t.name, value: t.id }))} icon="shield-outline" error={errors.collateralType} required />
                    <InputField label="Valor estimado" value={formData.collateralValue} onChangeText={(v) => updateFormData('collateralValue', v)} placeholder="Valor de la garantía" keyboardType="numeric" prefix="RD$" icon="pricetag-outline" />
                    <InputField label="Descripción" value={formData.collateralDescription} onChangeText={(v) => updateFormData('collateralDescription', v)} placeholder="Describa la garantía" multiline numberOfLines={3} icon="document-text-outline" />
                  </>
                )}
              </Card>
            </Animated.View>
          )}

          {/* ─── INFORMACIÓN ADICIONAL ──────────────────── */}
          <SectionHeader title="Información Adicional" icon="settings-outline" isExpanded={expandedSections.additional} onToggle={() => toggleSection('additional')} />
          
          {expandedSections.additional && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <Card>
                <InputField label="Notas adicionales" value={formData.notes} onChangeText={(v) => updateFormData('notes', v)} placeholder="Información adicional relevante" multiline numberOfLines={4} icon="create-outline" />
                
                <View style={styles.switchRow}>
                  <View style={styles.switchLabelContainer}>
                    <Ionicons name="notifications-outline" size={18} color={C.textSub} />
                    <Text style={styles.switchLabel}>Notificar cuando sea aprobada</Text>
                  </View>
                  <Switch
                    value={formData.notifyWhenApproved}
                    onValueChange={(v) => updateFormData('notifyWhenApproved', v)}
                    trackColor={{ false: C.border, true: C.primary3 }}
                    thumbColor={formData.notifyWhenApproved ? C.primary2 : C.white}
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchLabelContainer}>
                    <Ionicons name="close-circle-outline" size={18} color={C.textSub} />
                    <Text style={styles.switchLabel}>Notificar cuando sea rechazada</Text>
                  </View>
                  <Switch
                    value={formData.notifyWhenRejected}
                    onValueChange={(v) => updateFormData('notifyWhenRejected', v)}
                    trackColor={{ false: C.border, true: C.primary3 }}
                    thumbColor={formData.notifyWhenRejected ? C.primary2 : C.white}
                  />
                </View>
              </Card>
            </Animated.View>
          )}

          {/* ─── RESUMEN ────────────────────────────────── */}
          {formData.amount && parseFloat(formData.amount) > 0 && (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumen de la Solicitud</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Cliente:</Text>
                  <Text style={styles.summaryValue}>{formData.clientName || 'Pendiente'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tipo de préstamo:</Text>
                  <Text style={styles.summaryValue}>{selectedLoanType?.name || 'No seleccionado'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Monto solicitado:</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(formData.amount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Plazo:</Text>
                  <Text style={styles.summaryValue}>{formData.term} {selectedLoanType?.category === 'san' ? 'días' : 'meses'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Prioridad:</Text>
                  <Text style={[styles.summaryValue, { color: formData.priority === 'high' ? C.danger : formData.priority === 'medium' ? C.warning : C.success }]}>
                    {formData.priority === 'high' ? 'Alta' : formData.priority === 'medium' ? 'Media' : 'Baja'}
                  </Text>
                </View>
              </Card>
            </Animated.View>
          )}

          {/* ─── BOTONES ────────────────────────────────── */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={saving}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitButton, saving && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="white" />
                  <Text style={styles.submitText}>{requestId ? 'Actualizar' : 'Enviar Solicitud'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </RNAnimated.ScrollView>

      {/* ─── MODAL SELECCIÓN DE CLIENTE ────────────────── */}
      <Modal visible={showClientModal} transparent animationType="fade" onRequestClose={() => setShowClientModal(false)}>
        <BlurView intensity={100} tint="dark" style={modalS.overlay}>
          <Animated.View entering={ZoomIn.duration(200)} style={modalS.content}>
            <View style={modalS.header}>
              <Text style={modalS.title}>Seleccionar Cliente</Text>
              <TouchableOpacity onPress={() => setShowClientModal(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={modalS.body}>
              {MOCK_CLIENTS.map((client) => (
                <TouchableOpacity key={client.id} style={modalS.clientItem} onPress={() => handleSelectClient(client)}>
                  <View style={modalS.clientAvatar}>
                    <Text style={modalS.clientInitials}>{client.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</Text>
                  </View>
                  <View style={modalS.clientInfo}>
                    <Text style={modalS.clientName}>{client.name}</Text>
                    <Text style={modalS.clientPhone}>{client.phone}</Text>
                  </View>
                  {formData.clientId === client.id && <Ionicons name="checkmark-circle" size={24} color={C.success} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={modalS.footer}>
              <TouchableOpacity style={modalS.newClientButton} onPress={() => { setShowClientModal(false); updateFormData('isNewClient', true); }}>
                <Ionicons name="person-add" size={18} color={C.primary2} />
                <Text style={modalS.newClientText}>Registrar nuevo cliente</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </BlurView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 20 },
  floatNav: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99, height: 100, paddingTop: 50, overflow: 'hidden', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
  floatContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  floatTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  header: { paddingTop: 56, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: 'white', letterSpacing: -0.5 },
  headerInfo: { paddingHorizontal: 20 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  body: { padding: 16 },
  
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  switchLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 14, color: C.text, fontWeight: '500' },
  
  clientSelector: { backgroundColor: C.primary5, borderRadius: 14, padding: 12 },
  clientSelectorContent: { flexDirection: 'row', alignItems: 'center' },
  clientAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: '600', color: C.text },
  clientPhone: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  fieldError: { fontSize: 11, color: C.danger, marginTop: 4, marginLeft: 4 },
  
  loanTypeInfo: { flexDirection: 'row', backgroundColor: C.infoBg, borderRadius: 12, padding: 12, marginBottom: 16 },
  loanTypeInfoText: { fontSize: 12, color: C.info, flex: 1, marginLeft: 8, lineHeight: 18 },
  
  infoBox: { flexDirection: 'row', backgroundColor: C.infoBg, borderRadius: 12, padding: 12, marginTop: 8 },
  infoBoxText: { fontSize: 12, color: C.info, flex: 1, marginLeft: 8 },
  
  summaryCard: { backgroundColor: C.primary5, borderColor: C.primary3 },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: C.primary2, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: C.textSub },
  summaryValue: { fontSize: 13, fontWeight: '600', color: C.text },
  
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelButton: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border },
  cancelText: { fontSize: 15, fontWeight: '700', color: C.textSub },
  submitButton: { flex: 2, flexDirection: 'row', paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary2 },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { fontSize: 15, fontWeight: '700', color: 'white' },
});

const modalS = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { backgroundColor: C.white, borderRadius: 24, padding: 20, width: '100%', maxWidth: 400, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: C.text },
  body: { maxHeight: 400 },
  clientItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  clientAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primary5, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  clientInitials: { fontSize: 15, fontWeight: '800', color: C.primary2 },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: '600', color: C.text },
  clientPhone: { fontSize: 12, color: C.textMuted },
  footer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border },
  newClientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  newClientText: { fontSize: 14, fontWeight: '600', color: C.primary2 },
});

const loadS = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  iconBg: { width: 80, height: 80, borderRadius: 20, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 24 },
});