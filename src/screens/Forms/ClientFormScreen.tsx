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
  FadeInRight,
  SlideInRight,
  ZoomIn,
  ZoomOut,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { RootStackParamList } from '../../navigation/types';

type ClientFormRouteProp = RouteProp<RootStackParamList, 'ClientForm'>;
type ClientFormNavigationProp = StackNavigationProp<RootStackParamList, 'ClientForm'>;

interface ClientFormScreenProps {
  route: ClientFormRouteProp;
  navigation: ClientFormNavigationProp;
}

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
};

// ─── Tipos ─────────────────────────────────────────────────────────
interface ClientFormData {
  // Información personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  
  // Identificación
  documentType: 'cedula' | 'passport' | 'rnc';
  documentNumber: string;
  
  // Información financiera
  monthlyIncome: string;
  occupation: string;
  employer: string;
  yearsEmployed: string;
  
  // Dirección
  address: string;
  city: string;
  province: string;
  postalCode: string;
  
  // Referencias
  reference1Name: string;
  reference1Phone: string;
  reference1Relationship: string;
  reference2Name: string;
  reference2Phone: string;
  reference2Relationship: string;
  
  // Preferencias
  preferredContact: 'phone' | 'email' | 'whatsapp';
  receiveNotifications: boolean;
  receivePromotions: boolean;
  
  // Notas
  notes: string;
}

interface FormSection {
  id: string;
  title: string;
  icon: string;
  isExpanded: boolean;
}

// ─── Input Component ───────────────────────────────────────────────
interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  required?: boolean;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  suffix?: string;
  onPress?: () => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  required,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  suffix,
  onPress,
}) => {
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
          <Ionicons name={icon as any} size={16} color={isFocused ? C.primary2 : C.textMuted} />
          <Text style={inputS.label}>
            {label} {required && <Text style={inputS.required}>*</Text>}
          </Text>
        </View>
        <Pressable onPress={onPress} disabled={!onPress}>
          <View style={[
            inputS.inputWrapper,
            isFocused && inputS.inputFocused,
            error && inputS.inputError,
            !editable && inputS.inputDisabled,
          ]}>
            <TextInput
              style={[inputS.input, multiline && inputS.textArea]}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={C.textMuted}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              editable={editable}
              multiline={multiline}
              numberOfLines={numberOfLines}
              maxLength={maxLength}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {suffix && (
              <Text style={inputS.suffix}>{suffix}</Text>
            )}
            {onPress && (
              <Ionicons name="chevron-down" size={18} color={C.textMuted} />
            )}
          </View>
        </Pressable>
        {error && (
          <Animated.Text entering={FadeInDown} style={inputS.errorText}>
            {error}
          </Animated.Text>
        )}
      </View>
    </RNAnimated.View>
  );
};

const inputS = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.2,
  },
  required: {
    color: C.danger,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: C.primary2,
    backgroundColor: C.white,
  },
  inputError: {
    borderColor: C.danger,
  },
  inputDisabled: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    paddingVertical: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  suffix: {
    fontSize: 13,
    color: C.textMuted,
    marginLeft: 8,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 11,
    color: C.danger,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
});

// ─── SectionHeader Component ────────────────────────────────────────
const SectionHeader: React.FC<{
  title: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  completed?: boolean;
}> = ({ title, icon, isExpanded, onToggle, completed }) => (
  <TouchableOpacity
    style={sectionS.header}
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggle();
    }}
    activeOpacity={0.7}
  >
    <View style={sectionS.headerLeft}>
      <View style={[sectionS.iconBg, completed && sectionS.iconBgCompleted]}>
        <Ionicons
          name={icon as any}
          size={18}
          color={completed ? C.white : C.primary2}
        />
      </View>
      <Text style={sectionS.title}>{title}</Text>
      {completed && (
        <View style={sectionS.completedBadge}>
          <Ionicons name="checkmark" size={12} color={C.success} />
        </View>
      )}
    </View>
    <Ionicons
      name={isExpanded ? 'chevron-up' : 'chevron-down'}
      size={20}
      color={C.textMuted}
    />
  </TouchableOpacity>
);

const sectionS = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.primary5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBgCompleted: {
    backgroundColor: C.success,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  completedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});

// ─── DocumentTypeModal Component ────────────────────────────────────
const DocumentTypeModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelect: (type: 'cedula' | 'passport' | 'rnc') => void;
  currentType: string;
}> = ({ visible, onClose, onSelect, currentType }) => {
  const types = [
    { value: 'cedula' as const, label: 'Cédula', icon: 'card-outline' },
    { value: 'passport' as const, label: 'Pasaporte', icon: 'airplane-outline' },
    { value: 'rnc' as const, label: 'RNC', icon: 'business-outline' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={modalS.overlay} onPress={onClose}>
        <Animated.View entering={ZoomIn.duration(200)} style={modalS.content}>
          <View style={modalS.header}>
            <Text style={modalS.title}>Tipo de documento</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={C.text} />
            </TouchableOpacity>
          </View>
          {types.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[modalS.option, currentType === type.value && modalS.optionActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(type.value);
                onClose();
              }}
            >
              <View style={modalS.optionLeft}>
                <View style={modalS.optionIcon}>
                  <Ionicons name={type.icon as any} size={20} color={currentType === type.value ? C.primary2 : C.textSub} />
                </View>
                <Text style={[modalS.optionLabel, currentType === type.value && modalS.optionLabelActive]}>
                  {type.label}
                </Text>
              </View>
              {currentType === type.value && (
                <Ionicons name="checkmark-circle" size={20} color={C.primary2} />
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// ─── ContactMethodModal Component ───────────────────────────────────
const ContactMethodModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelect: (method: 'phone' | 'email' | 'whatsapp') => void;
  currentMethod: string;
}> = ({ visible, onClose, onSelect, currentMethod }) => {
  const methods = [
    { value: 'phone' as const, label: 'Teléfono', icon: 'call-outline' },
    { value: 'whatsapp' as const, label: 'WhatsApp', icon: 'logo-whatsapp' },
    { value: 'email' as const, label: 'Email', icon: 'mail-outline' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={modalS.overlay} onPress={onClose}>
        <Animated.View entering={ZoomIn.duration(200)} style={modalS.content}>
          <View style={modalS.header}>
            <Text style={modalS.title}>Método de contacto preferido</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={C.text} />
            </TouchableOpacity>
          </View>
          {methods.map((method) => (
            <TouchableOpacity
              key={method.value}
              style={[modalS.option, currentMethod === method.value && modalS.optionActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(method.value);
                onClose();
              }}
            >
              <View style={modalS.optionLeft}>
                <View style={modalS.optionIcon}>
                  <Ionicons name={method.icon as any} size={20} color={currentMethod === method.value ? C.primary2 : C.textSub} />
                </View>
                <Text style={[modalS.optionLabel, currentMethod === method.value && modalS.optionLabelActive]}>
                  {method.label}
                </Text>
              </View>
              {currentMethod === method.value && (
                <Ionicons name="checkmark-circle" size={20} color={C.primary2} />
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const modalS = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 350,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  optionActive: {
    backgroundColor: C.primary5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textSub,
  },
  optionLabelActive: {
    color: C.primary2,
  },
});

// ─── ProgressBar Component ──────────────────────────────────────────
const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <View style={progressS.container}>
    <View style={progressS.bar}>
      <Animated.View
        style={[
          progressS.fill,
          { width: `${progress}%` },
        ]}
      />
    </View>
    <Text style={progressS.text}>{Math.round(progress)}% completado</Text>
  </View>
);

const progressS = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  bar: {
    height: 6,
    backgroundColor: C.primary4,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  fill: {
    height: '100%',
    backgroundColor: C.primary2,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textSub,
    textAlign: 'right',
  },
});

// ─── Main Component ─────────────────────────────────────────────────
export const ClientFormScreen: React.FC<ClientFormScreenProps> = ({ route, navigation }) => {
  const { clientId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  
  // Estado del formulario
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    documentType: 'cedula',
    documentNumber: '',
    monthlyIncome: '',
    occupation: '',
    employer: '',
    yearsEmployed: '',
    address: '',
    city: '',
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

  // Estado de errores
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});

  // Estado de secciones expandidas
  const [sections, setSections] = useState<FormSection[]>([
    { id: 'personal', title: 'Información Personal', icon: 'person-outline', isExpanded: true },
    { id: 'identification', title: 'Identificación', icon: 'card-outline', isExpanded: false },
    { id: 'financial', title: 'Información Financiera', icon: 'cash-outline', isExpanded: false },
    { id: 'address', title: 'Dirección', icon: 'location-outline', isExpanded: false },
    { id: 'references', title: 'Referencias', icon: 'people-outline', isExpanded: false },
    { id: 'preferences', title: 'Preferencias', icon: 'settings-outline', isExpanded: false },
    { id: 'notes', title: 'Notas Adicionales', icon: 'document-text-outline', isExpanded: false },
  ]);

  // Estado de modales
  const [showDocTypeModal, setShowDocTypeModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Datos mock para carga
  const MOCK_CLIENT_DATA: ClientFormData = {
    firstName: 'Juan',
    lastName: 'Pérez González',
    email: 'juan.perez@email.com',
    phone: '809-555-1234',
    secondaryPhone: '829-555-5678',
    documentType: 'cedula',
    documentNumber: '402-1234567-8',
    monthlyIncome: '45000',
    occupation: 'Ingeniero de Software',
    employer: 'Tech Solutions SRL',
    yearsEmployed: '5',
    address: 'Calle Principal #123',
    city: 'Santo Domingo',
    province: 'Distrito Nacional',
    postalCode: '10101',
    reference1Name: 'María Rodríguez',
    reference1Phone: '809-555-8765',
    reference1Relationship: 'Hermana',
    reference2Name: 'Carlos Méndez',
    reference2Phone: '809-555-4321',
    reference2Relationship: 'Amigo',
    preferredContact: 'whatsapp',
    receiveNotifications: true,
    receivePromotions: true,
    notes: 'Cliente preferencial, buen historial de pagos.',
  };

  useEffect(() => {
    if (clientId) {
      loadClient(clientId);
    }
    
    navigation.setOptions({
      headerShown: false,
    });
  }, [clientId]);

  const loadClient = async (id: string) => {
    setLoading(true);
    try {
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFormData(MOCK_CLIENT_DATA);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = <K extends keyof ClientFormData>(key: K, value: ClientFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Limpiar error del campo
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, isExpanded: !section.isExpanded }
          : section
      )
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ClientFormData, string>> = {};

    // Validaciones básicas
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^[\d\-\s()+]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Teléfono inválido (mínimo 10 dígitos)';
    }
    if (!formData.documentNumber.trim()) {
      newErrors.documentNumber = 'El número de documento es requerido';
    }

    // Validaciones de referencias (si se han ingresado)
    if (formData.reference1Name && !formData.reference1Phone) {
      newErrors.reference1Phone = 'Teléfono requerido';
    }
    if (formData.reference2Name && !formData.reference2Phone) {
      newErrors.reference2Phone = 'Teléfono requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateProgress = (): number => {
    const fields = [
      formData.firstName, formData.lastName, formData.email, formData.phone,
      formData.documentNumber, formData.address, formData.city,
    ];
    const filled = fields.filter(f => f && f.trim().length > 0).length;
    return (filled / fields.length) * 100;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Formulario incompleto',
        'Por favor, completa todos los campos requeridos (*)',
        [{ text: 'Entendido' }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ ¡Éxito!',
        clientId ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const getDocumentTypeLabel = () => {
    const types = { cedula: 'Cédula', passport: 'Pasaporte', rnc: 'RNC' };
    return types[formData.documentType];
  };

  const getContactMethodLabel = () => {
    const methods = { phone: 'Teléfono', email: 'Email', whatsapp: 'WhatsApp' };
    return methods[formData.preferredContact];
  };

  if (loading) {
    return (
      <View style={loadS.container}>
        <LinearGradient
          colors={[C.primary, '#6d28d9']}
          style={loadS.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Animated.View entering={ZoomIn.duration(400)} style={loadS.content}>
          <View style={loadS.iconBg}>
            <Ionicons name="person" size={40} color={C.primary2} />
          </View>
          <Text style={loadS.title}>Cargando cliente...</Text>
          <ActivityIndicator size="large" color={C.primary2} />
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating header */}
      <RNAnimated.View style={[styles.floatNav, { opacity: headerOpacity }]}>
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={styles.floatContent}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.floatTitle}>
            {clientId ? 'Editar Cliente' : 'Nuevo Cliente'}
          </Text>
          <View style={{ width: 38 }} />
        </View>
      </RNAnimated.View>

      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── HEADER ───────────────────────────────────── */}
        <LinearGradient
          colors={[C.primary, '#6d28d9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {clientId ? 'Editar Cliente' : 'Nuevo Cliente'}
            </Text>
            <TouchableOpacity style={styles.iconBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="checkmark" size={22} color="white" />
              )}
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>
                  {formData.firstName ? formData.firstName[0] : '?'}
                  {formData.lastName ? formData.lastName[0] : ''}
                </Text>
              </LinearGradient>
            </View>
            <Text style={styles.headerName}>
              {formData.firstName || formData.lastName
                ? `${formData.firstName} ${formData.lastName}`
                : 'Nuevo Cliente'}
            </Text>
            {formData.email && (
              <Text style={styles.headerEmail}>{formData.email}</Text>
            )}
          </Animated.View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ── PROGRESS BAR ────────────────────────────── */}
          <ProgressBar progress={calculateProgress()} />

          {/* ── SECCIONES ───────────────────────────────── */}
          {sections.map((section, index) => (
            <Animated.View
              key={section.id}
              entering={FadeInDown.delay(150 + index * 30).springify()}
              style={styles.section}
            >
              <SectionHeader
                title={section.title}
                icon={section.icon}
                isExpanded={section.isExpanded}
                onToggle={() => toggleSection(section.id)}
              />

              {section.isExpanded && (
                <Animated.View entering={FadeInDown.duration(200)} style={styles.sectionContent}>
                  {/* Información Personal */}
                  {section.id === 'personal' && (
                    <>
                      <View style={styles.row}>
                        <View style={styles.half}>
                          <InputField
                            label="Nombre"
                            value={formData.firstName}
                            onChangeText={(text) => updateFormData('firstName', text)}
                            placeholder="Juan"
                            icon="person-outline"
                            error={errors.firstName}
                            required
                          />
                        </View>
                        <View style={styles.half}>
                          <InputField
                            label="Apellido"
                            value={formData.lastName}
                            onChangeText={(text) => updateFormData('lastName', text)}
                            placeholder="Pérez"
                            icon="person-outline"
                            error={errors.lastName}
                            required
                          />
                        </View>
                      </View>
                      <InputField
                        label="Email"
                        value={formData.email}
                        onChangeText={(text) => updateFormData('email', text)}
                        placeholder="cliente@email.com"
                        icon="mail-outline"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={errors.email}
                        required
                      />
                      <View style={styles.row}>
                        <View style={styles.half}>
                          <InputField
                            label="Teléfono principal"
                            value={formData.phone}
                            onChangeText={(text) => updateFormData('phone', text)}
                            placeholder="809-555-1234"
                            icon="call-outline"
                            keyboardType="phone-pad"
                            error={errors.phone}
                            required
                          />
                        </View>
                        <View style={styles.half}>
                          <InputField
                            label="Teléfono secundario"
                            value={formData.secondaryPhone}
                            onChangeText={(text) => updateFormData('secondaryPhone', text)}
                            placeholder="829-555-5678"
                            icon="call-outline"
                            keyboardType="phone-pad"
                          />
                        </View>
                      </View>
                    </>
                  )}

                  {/* Identificación */}
                  {section.id === 'identification' && (
                    <>
                      <InputField
                        label="Tipo de documento"
                        value={getDocumentTypeLabel()}
                        onChangeText={() => {}}
                        placeholder="Seleccionar tipo"
                        icon="card-outline"
                        onPress={() => setShowDocTypeModal(true)}
                      />
                      <InputField
                        label="Número de documento"
                        value={formData.documentNumber}
                        onChangeText={(text) => updateFormData('documentNumber', text)}
                        placeholder="402-1234567-8"
                        icon="barcode-outline"
                        error={errors.documentNumber}
                        required
                      />
                    </>
                  )}

                  {/* Información Financiera */}
                  {section.id === 'financial' && (
                    <>
                      <InputField
                        label="Ingreso mensual"
                        value={formData.monthlyIncome}
                        onChangeText={(text) => updateFormData('monthlyIncome', text)}
                        placeholder="45,000"
                        icon="cash-outline"
                        keyboardType="numeric"
                        suffix="RD$"
                      />
                      <InputField
                        label="Ocupación"
                        value={formData.occupation}
                        onChangeText={(text) => updateFormData('occupation', text)}
                        placeholder="Ingeniero de Software"
                        icon="briefcase-outline"
                      />
                      <InputField
                        label="Empleador/Empresa"
                        value={formData.employer}
                        onChangeText={(text) => updateFormData('employer', text)}
                        placeholder="Tech Solutions SRL"
                        icon="business-outline"
                      />
                      <InputField
                        label="Años en empleo actual"
                        value={formData.yearsEmployed}
                        onChangeText={(text) => updateFormData('yearsEmployed', text)}
                        placeholder="5"
                        icon="time-outline"
                        keyboardType="numeric"
                        suffix="años"
                      />
                    </>
                  )}

                  {/* Dirección */}
                  {section.id === 'address' && (
                    <>
                      <InputField
                        label="Dirección"
                        value={formData.address}
                        onChangeText={(text) => updateFormData('address', text)}
                        placeholder="Calle Principal #123"
                        icon="home-outline"
                        multiline
                        numberOfLines={2}
                      />
                      <View style={styles.row}>
                        <View style={styles.half}>
                          <InputField
                            label="Ciudad"
                            value={formData.city}
                            onChangeText={(text) => updateFormData('city', text)}
                            placeholder="Santo Domingo"
                            icon="location-outline"
                          />
                        </View>
                        <View style={styles.half}>
                          <InputField
                            label="Provincia"
                            value={formData.province}
                            onChangeText={(text) => updateFormData('province', text)}
                            placeholder="Distrito Nacional"
                            icon="map-outline"
                          />
                        </View>
                      </View>
                      <InputField
                        label="Código Postal"
                        value={formData.postalCode}
                        onChangeText={(text) => updateFormData('postalCode', text)}
                        placeholder="10101"
                        icon="mail-outline"
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </>
                  )}

                  {/* Referencias */}
                  {section.id === 'references' && (
                    <>
                      <Text style={styles.subsectionTitle}>Referencia 1</Text>
                      <InputField
                        label="Nombre completo"
                        value={formData.reference1Name}
                        onChangeText={(text) => updateFormData('reference1Name', text)}
                        placeholder="María Rodríguez"
                        icon="person-outline"
                      />
                      <View style={styles.row}>
                        <View style={styles.half}>
                          <InputField
                            label="Teléfono"
                            value={formData.reference1Phone}
                            onChangeText={(text) => updateFormData('reference1Phone', text)}
                            placeholder="809-555-8765"
                            icon="call-outline"
                            keyboardType="phone-pad"
                            error={errors.reference1Phone}
                          />
                        </View>
                        <View style={styles.half}>
                          <InputField
                            label="Relación"
                            value={formData.reference1Relationship}
                            onChangeText={(text) => updateFormData('reference1Relationship', text)}
                            placeholder="Hermana"
                            icon="people-outline"
                          />
                        </View>
                      </View>

                      <Text style={[styles.subsectionTitle, { marginTop: 16 }]}>Referencia 2</Text>
                      <InputField
                        label="Nombre completo"
                        value={formData.reference2Name}
                        onChangeText={(text) => updateFormData('reference2Name', text)}
                        placeholder="Carlos Méndez"
                        icon="person-outline"
                      />
                      <View style={styles.row}>
                        <View style={styles.half}>
                          <InputField
                            label="Teléfono"
                            value={formData.reference2Phone}
                            onChangeText={(text) => updateFormData('reference2Phone', text)}
                            placeholder="809-555-4321"
                            icon="call-outline"
                            keyboardType="phone-pad"
                            error={errors.reference2Phone}
                          />
                        </View>
                        <View style={styles.half}>
                          <InputField
                            label="Relación"
                            value={formData.reference2Relationship}
                            onChangeText={(text) => updateFormData('reference2Relationship', text)}
                            placeholder="Amigo"
                            icon="people-outline"
                          />
                        </View>
                      </View>
                    </>
                  )}

                  {/* Preferencias */}
                  {section.id === 'preferences' && (
                    <>
                      <InputField
                        label="Método de contacto preferido"
                        value={getContactMethodLabel()}
                        onChangeText={() => {}}
                        placeholder="Seleccionar método"
                        icon="chatbubbles-outline"
                        onPress={() => setShowContactModal(true)}
                      />
                      
                      <View style={styles.switchContainer}>
                        <View style={styles.switchRow}>
                          <View style={styles.switchLabel}>
                            <Ionicons name="notifications-outline" size={20} color={C.textSub} />
                            <Text style={styles.switchText}>Recibir notificaciones</Text>
                          </View>
                          <Switch
                            value={formData.receiveNotifications}
                            onValueChange={(value) => updateFormData('receiveNotifications', value)}
                            trackColor={{ false: C.border, true: C.primary3 }}
                            thumbColor={formData.receiveNotifications ? C.primary2 : C.white}
                          />
                        </View>
                        
                        <View style={styles.switchRow}>
                          <View style={styles.switchLabel}>
                            <Ionicons name="pricetag-outline" size={20} color={C.textSub} />
                            <Text style={styles.switchText}>Recibir promociones</Text>
                          </View>
                          <Switch
                            value={formData.receivePromotions}
                            onValueChange={(value) => updateFormData('receivePromotions', value)}
                            trackColor={{ false: C.border, true: C.primary3 }}
                            thumbColor={formData.receivePromotions ? C.primary2 : C.white}
                          />
                        </View>
                      </View>
                    </>
                  )}

                  {/* Notas */}
                  {section.id === 'notes' && (
                    <InputField
                      label="Notas adicionales"
                      value={formData.notes}
                      onChangeText={(text) => updateFormData('notes', text)}
                      placeholder="Información adicional sobre el cliente..."
                      icon="document-text-outline"
                      multiline
                      numberOfLines={4}
                    />
                  )}
                </Animated.View>
              )}
            </Animated.View>
          ))}

          {/* ── BOTONES DE ACCIÓN ──────────────────────── */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="white" />
                  <Text style={styles.saveText}>
                    {clientId ? 'Actualizar' : 'Crear Cliente'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </RNAnimated.ScrollView>

      {/* ─── MODALES ────────────────────────────────── */}
      <DocumentTypeModal
        visible={showDocTypeModal}
        onClose={() => setShowDocTypeModal(false)}
        onSelect={(type) => updateFormData('documentType', type)}
        currentType={formData.documentType}
      />
      
      <ContactMethodModal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSelect={(method) => updateFormData('preferredContact', method)}
        currentMethod={formData.preferredContact}
      />
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  floatNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    height: Platform.OS === 'ios' ? 100 : 90,
    paddingTop: Platform.OS === 'ios' ? 50 : 44,
    overflow: 'hidden',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  floatContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  floatTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
  },
  header: {
    paddingTop: 56,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  headerInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  headerName: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  body: {
    padding: 16,
    marginTop: 8,
  },
  section: {
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: C.border,
    overflow: 'hidden',
  },
  sectionContent: {
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  switchContainer: {
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchText: {
    fontSize: 14,
    color: C.text,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textSub,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary2,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
});

const loadS = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginBottom: 24,
  },
});