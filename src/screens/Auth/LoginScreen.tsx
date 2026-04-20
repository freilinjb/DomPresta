import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated as RNAnimated,
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { ResponseType } from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '../../services/authService';
import { NotificationService } from '../../services/notificationService';
import { RootStackParamList } from '../../navigation/types';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────
const C = {
  // Brand gradient stops
  g0: '#0d0121',
  g1: '#1a0533',
  g2: '#2e0a5e',
  g3: '#3d0f7a',
  g4: '#6d28d9',
  g5: '#8b5cf6',

  // UI
  accent: '#a78bfa',
  accentBright: '#c4b5fd',
  gold: '#fbbf24',

  // Surface
  surface: 'rgba(255,255,255,0.97)',
  surfaceSub: '#f5f3ff',
  border: 'rgba(109,40,217,0.1)',
  borderFocus: '#6d28d9',
  borderError: '#dc2626',

  // Text
  text: '#0f0a1e',
  textSec: '#4a4560',
  textMuted: '#9591a8',
  textPH: '#b5b0c8',

  // Semantic
  success: '#10b981',
  danger: '#dc2626',
  dangerBg: '#fef2f2',

  // Overlays
  glass: 'rgba(255,255,255,0.08)',
  glassBright: 'rgba(255,255,255,0.15)',
  glassCard: 'rgba(255,255,255,0.06)',
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
type UserRole = 'cliente' | 'cobrador';
interface LoginScreenProps { navigation: LoginScreenNavigationProp; }

WebBrowser.maybeCompleteAuthSession();

// ─── Animated Field ───────────────────────────────────────────────
interface FieldProps {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  error?: string;
  editable?: boolean;
  rightElement?: React.ReactNode;
  onSubmitEditing?: () => void;
  returnKeyType?: any;
}

const Field: React.FC<FieldProps> = ({
  icon, placeholder, value, onChangeText, secureTextEntry, keyboardType = 'default',
  autoCapitalize = 'none', error, editable = true, rightElement, onSubmitEditing, returnKeyType,
}) => {
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new RNAnimated.Value(0)).current;
  const shakeAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(focusAnim, {
      toValue: focused ? 1 : 0, duration: 200, useNativeDriver: false,
    }).start();
  }, [focused]);

  useEffect(() => {
    if (error) {
      RNAnimated.sequence([
        RNAnimated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: 5, duration: 55, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? C.borderError : C.border, error ? C.borderError : C.borderFocus] as any,
  });
  const shadowOpacity = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });
  const iconColor = error ? C.danger : focused ? C.g4 : C.textMuted;

  return (
    <RNAnimated.View style={{ transform: [{ translateX: shakeAnim }], marginBottom: 12 }}>
      <RNAnimated.View style={[
        fS.box,
        { borderColor, shadowColor: C.g4, shadowOffset: { width: 0, height: 3 }, shadowOpacity, shadowRadius: 10, elevation: focused ? 3 : 0 },
        error && fS.boxError,
      ]}>
        <Ionicons name={icon as any} size={18} color={iconColor} style={fS.icon} />
        <TextInput
          style={fS.input}
          placeholder={placeholder}
          placeholderTextColor={C.textPH}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
        />
        {rightElement}
      </RNAnimated.View>
      {error && (
        <Animated.View entering={FadeInDown.duration(180)} style={fS.errorRow}>
          <Ionicons name="alert-circle" size={11} color={C.danger} />
          <Text style={fS.errorText}>{error}</Text>
        </Animated.View>
      )}
    </RNAnimated.View>
  );
};

const fS = StyleSheet.create({
  box: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#faf9ff', borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, minHeight: 52,
  },
  boxError: { borderColor: C.borderError, backgroundColor: C.dangerBg },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500', paddingVertical: 14 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 4 },
  errorText: { fontSize: 11, color: C.danger, fontWeight: '600' },
});

// ─── Role Pill ────────────────────────────────────────────────────
const RolePill: React.FC<{ role: UserRole; active: boolean; onPress: () => void }> = ({ role, active, onPress }) => {
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    RNAnimated.sequence([
      RNAnimated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      RNAnimated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const icon = role === 'cobrador' ? 'briefcase' : 'wallet';
  const label = role === 'cobrador' ? 'Cobrador' : 'Cliente';
  const sub = role === 'cobrador' ? 'Gestión de cobros' : 'Mis préstamos';

  return (
    <RNAnimated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <Pressable style={[rpS.pill, active && rpS.pillActive]} onPress={handlePress}>
        {active && (
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.06)']}
            style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
        )}
        <View style={[rpS.iconRing, active && rpS.iconRingActive]}>
          <Ionicons name={`${icon}-outline` as any} size={16} color={active ? '#fff' : 'rgba(255,255,255,0.45)'} />
        </View>
        <View>
          <Text style={[rpS.label, active && rpS.labelActive]}>{label}</Text>
          <Text style={rpS.sub}>{sub}</Text>
        </View>
        {active && (
          <View style={rpS.activeDot} />
        )}
      </Pressable>
    </RNAnimated.View>
  );
};

const rpS = StyleSheet.create({
  pill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
    overflow: 'hidden', position: 'relative',
    borderWidth: 1, borderColor: 'transparent',
  },
  pillActive: { borderColor: 'rgba(255,255,255,0.2)' },
  iconRing: {
    width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  iconRingActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  label: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.45)', marginBottom: 1 },
  labelActive: { color: '#fff' },
  sub: { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
  activeDot: {
    position: 'absolute', top: 10, right: 10,
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#a78bfa',
  },
});

// ─── Social Button ────────────────────────────────────────────────
const SocialBtn: React.FC<{
  icon: string; label: string; onPress: () => void;
  loading: boolean; disabled: boolean; colors: [string, string];
}> = ({ icon, label, onPress, loading, disabled, colors }) => {
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;

  const handlePress = () => {
    RNAnimated.sequence([
      RNAnimated.timing(scaleAnim, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      RNAnimated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <RNAnimated.View style={[{ flex: 1, transform: [{ scale: scaleAnim }] }, disabled && !loading && { opacity: 0.45 }]}>
      <TouchableOpacity onPress={handlePress} disabled={disabled} activeOpacity={0.88} style={{ borderRadius: 13, overflow: 'hidden' }}>
        <LinearGradient colors={colors} style={sbS.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : (
              <>
                <Ionicons name={icon as any} size={17} color="#fff" />
                <Text style={sbS.label}>{label}</Text>
              </>
            )}
        </LinearGradient>
      </TouchableOpacity>
    </RNAnimated.View>
  );
};

const sbS = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 13, borderRadius: 13,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  label: { fontSize: 13, fontWeight: '700', color: '#fff' },
});

// ─── Decorative Orbs ──────────────────────────────────────────────
const BackgroundOrbs: React.FC = () => (
  <>
    {/* Main orb top-right */}
    <View style={{
      position: 'absolute', width: 380, height: 380, borderRadius: 190,
      top: -120, right: -100, backgroundColor: 'rgba(139,92,246,0.12)',
    }} />
    {/* Secondary orb bottom-left */}
    <View style={{
      position: 'absolute', width: 280, height: 280, borderRadius: 140,
      bottom: -80, left: -80, backgroundColor: 'rgba(109,40,217,0.15)',
    }} />
    {/* Small accent top-left */}
    <View style={{
      position: 'absolute', width: 120, height: 120, borderRadius: 60,
      top: SH * 0.28, left: -30, backgroundColor: 'rgba(167,139,250,0.08)',
    }} />
    {/* Dot cluster */}
    <View style={{
      position: 'absolute', width: 60, height: 60, borderRadius: 30,
      top: SH * 0.5, right: 20, backgroundColor: 'rgba(196,181,253,0.07)',
    }} />
    {/* Floating ring */}
    <View style={{
      position: 'absolute', width: 160, height: 160, borderRadius: 80,
      top: SH * 0.18, right: -60,
      borderWidth: 1, borderColor: 'rgba(167,139,250,0.12)',
      backgroundColor: 'transparent',
    }} />
  </>
);

// ─── Step Indicator ───────────────────────────────────────────────
const StepDots: React.FC<{ step: number; total: number }> = ({ step, total }) => (
  <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={{
        width: i === step ? 18 : 6, height: 6, borderRadius: 3,
        backgroundColor: i === step ? '#fff' : 'rgba(255,255,255,0.3)',
      }} />
    ))}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────
export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading]   = useState<'email' | 'google' | 'facebook' | 'apple' | null>(null);
  const [role, setRole]                 = useState<UserRole>('cliente');
  const [emailError, setEmailError]     = useState('');
  const [passError, setPassError]       = useState('');

  const masterAnim = useRef(new RNAnimated.Value(0)).current;
  const logoScale  = useRef(new RNAnimated.Value(0.6)).current;
  const logoAnim   = useRef(new RNAnimated.Value(0)).current;
  const cardSlide  = useRef(new RNAnimated.Value(60)).current;
  const cardOpacity = useRef(new RNAnimated.Value(0)).current;
  const passwordRef = useRef<TextInput>(null);

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: 'TU_ANDROID_CLIENT_ID',
    iosClientId: 'TU_IOS_CLIENT_ID',
    webClientId: 'TU_WEB_CLIENT_ID',
    responseType: ResponseType.Token,
  });

  useEffect(() => {
    initializeApp();
    // Staggered entrance animation
    RNAnimated.stagger(80, [
      RNAnimated.parallel([
        RNAnimated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        RNAnimated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      RNAnimated.parallel([
        RNAnimated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        RNAnimated.spring(cardSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleAuth(googleResponse.authentication?.accessToken);
    }
  }, [googleResponse]);

  const initializeApp = async () => {
    try {
      await AuthService.initialize();
      await NotificationService.initialize();
    } catch (e) { console.error('Init error:', e); }
  };

  const validateFields = (): boolean => {
    let valid = true;
    setEmailError('');
    setPassError('');

    if (!email.trim()) {
      setEmailError('El correo electrónico es requerido');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setEmailError('Ingresa un correo válido');
      valid = false;
    }
    if (!password.trim()) {
      setPassError('La contraseña es requerida');
      valid = false;
    } else if (password.length < 4) {
      setPassError('Mínimo 4 caracteres');
      valid = false;
    }
    return valid;
  };

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!validateFields()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setAuthLoading('email');
    try {
      const user = await AuthService.login(email.trim(), password, role);
      if (user) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('MainDrawer');
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPassError('Credenciales incorrectas. Verifica tu email y contraseña.');
    } finally { setAuthLoading(null); }
  };

  const handleGoogleAuth = async (token?: string) => {
    setAuthLoading('google');
    try {
      await new Promise(r => setTimeout(r, 1200));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('MainDrawer');
    } catch { Alert.alert('Error', 'No se pudo autenticar con Google'); }
    finally { setAuthLoading(null); }
  };

  const handleFacebookAuth = async () => {
    setAuthLoading('facebook');
    try {
      await new Promise(r => setTimeout(r, 1200));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('MainDrawer');
    } catch { Alert.alert('Error', 'No se pudo autenticar con Facebook'); }
    finally { setAuthLoading(null); }
  };

  const handleAppleAuth = async () => {
    setAuthLoading('apple');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        await new Promise(r => setTimeout(r, 800));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('MainDrawer');
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') Alert.alert('Error', 'No se pudo autenticar con Apple');
    } finally { setAuthLoading(null); }
  };

  const fillDemo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEmailError('');
    setPassError('');
    setEmail(role === 'cobrador' ? 'cobrador@dompresta.com' : 'admin@dompresta.com');
    setPassword('admin123');
  }, [role]);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? '¡Buenos días!' : hour < 18 ? '¡Buenas tardes!' : '¡Buenas noches!';
  const greetingIcon = hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌙';
  const isDisabled = !!authLoading;

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Multi-stop gradient background */}
      <LinearGradient
        colors={[C.g0, C.g1, C.g2, C.g3]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <BackgroundOrbs />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Branding ───────────────────────────── */}
          <RNAnimated.View style={[s.brandWrap, { opacity: logoAnim, transform: [{ scale: logoScale }] }]}>
            {/* Logo */}
            <View style={s.logoOuter}>
              <LinearGradient colors={[C.g5, C.g4, C.g3]} style={s.logoInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={role === 'cobrador' ? 'briefcase' : 'wallet'} size={32} color="#fff" />
              </LinearGradient>
            </View>

            <View style={s.greetingRow}>
              <Text style={s.greetingIcon}>{greetingIcon}</Text>
              <Text style={s.greeting}>{greeting}</Text>
            </View>

            <Text style={s.appName}>DomPresta</Text>
            <Text style={s.tagline}>
              {role === 'cobrador' ? 'Plataforma de gestión de cobros' : 'Sistema inteligente de préstamos'}
            </Text>
          </RNAnimated.View>

          {/* ── Role Selector ──────────────────────── */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.roleWrap}>
            <View style={s.roleContainer}>
              <RolePill role="cliente"   active={role === 'cliente'}   onPress={() => setRole('cliente')} />
              <View style={s.roleSep} />
              <RolePill role="cobrador"  active={role === 'cobrador'}  onPress={() => setRole('cobrador')} />
            </View>
          </Animated.View>

          {/* ── Auth Card ──────────────────────────── */}
          <RNAnimated.View style={[s.cardWrap, { opacity: cardOpacity, transform: [{ translateY: cardSlide }] }]}>
            <View style={s.card}>
              {/* Card top accent */}
              <LinearGradient
                colors={[C.g4, C.g5, 'transparent']}
                style={s.cardAccent}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />

              <Text style={s.cardTitle}>Iniciar sesión</Text>
              <Text style={s.cardSub}>Accede a tu cuenta de {role === 'cobrador' ? 'cobrador' : 'cliente'}</Text>

              <View style={s.fields}>
                <Field
                  icon="mail-outline"
                  placeholder="Correo electrónico"
                  value={email}
                  onChangeText={t => { setEmail(t); if (emailError) setEmailError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={emailError}
                  editable={!isDisabled}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />

                <Field
                  icon="lock-closed-outline"
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={t => { setPassword(t); if (passError) setPassError(''); }}
                  secureTextEntry={!showPassword}
                  error={passError}
                  editable={!isDisabled}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  rightElement={
                    <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={10} style={{ padding: 6 }}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
                    </TouchableOpacity>
                  }
                />
              </View>

              {/* Forgot password */}
              <TouchableOpacity
                style={s.forgotBtn}
                onPress={() => Alert.alert('Recuperar contraseña', 'Recibirás un enlace de recuperación en tu correo registrado.')}
                hitSlop={8}
              >
                <Text style={s.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              {/* Main CTA */}
              <TouchableOpacity
                style={[s.loginBtn, isDisabled && { opacity: 0.65 }]}
                onPress={handleLogin}
                disabled={isDisabled}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={[C.g5, C.g4, C.g3]}
                  style={s.loginGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {authLoading === 'email' ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={s.loginText}>Entrar</Text>
                      <View style={s.loginArrow}>
                        <Ionicons name="arrow-forward" size={16} color={C.g4} />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={s.divider}>
                <View style={s.divLine} />
                <Text style={s.divText}>o continúa con</Text>
                <View style={s.divLine} />
              </View>

              {/* Social auth */}
              <View style={s.socialRow}>
                <SocialBtn
                  icon="logo-google" label="Google"
                  onPress={() => googlePromptAsync()}
                  loading={authLoading === 'google'}
                  disabled={isDisabled}
                  colors={['#ea4335', '#c62828']}
                />
                <SocialBtn
                  icon="logo-facebook" label="Facebook"
                  onPress={handleFacebookAuth}
                  loading={authLoading === 'facebook'}
                  disabled={isDisabled}
                  colors={['#1877f2', '#0d5bb5']}
                />
                {Platform.OS === 'ios' && (
                  <SocialBtn
                    icon="logo-apple" label="Apple"
                    onPress={handleAppleAuth}
                    loading={authLoading === 'apple'}
                    disabled={isDisabled}
                    colors={['#1c1c1e', '#3a3a3c']}
                  />
                )}
              </View>

              {/* Demo credentials */}
              <TouchableOpacity style={s.demoBtn} onPress={fillDemo} disabled={isDisabled} activeOpacity={0.75}>
                <View style={s.demoBadge}>
                  <Ionicons name="flash" size={11} color={C.g4} />
                </View>
                <Text style={s.demoText}>Usar credenciales demo</Text>
              </TouchableOpacity>
            </View>
          </RNAnimated.View>

          {/* ── Footer ─────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={s.footer}>
            <Text style={s.footerText}>DomPresta v2.0.0</Text>
            <View style={s.footerDot} />
            <Text style={s.footerText}>© 2026 Todos los derechos reservados</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.g0 },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
  },

  // Branding
  brandWrap: { alignItems: 'center', marginBottom: 24 },
  logoOuter: {
    width: 80, height: 80, borderRadius: 22, overflow: 'hidden',
    marginBottom: 18,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 16,
  },
  logoInner: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  greetingIcon: { fontSize: 16 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: '600', letterSpacing: 0.2 },
  appName: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1.2, marginBottom: 6 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '500', letterSpacing: 0.2 },

  // Role selector
  roleWrap: { marginBottom: 16 },
  roleContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 6, gap: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  roleSep: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Card
  cardWrap: {
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.35, shadowRadius: 40, elevation: 24,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 26, padding: 24,
    borderWidth: 1, borderColor: 'rgba(109,40,217,0.08)',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
  },
  cardTitle: { fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: -0.5, marginBottom: 4, marginTop: 4 },
  cardSub: { fontSize: 13, color: C.textMuted, fontWeight: '500', marginBottom: 22 },

  // Fields
  fields: { gap: 0 },

  // Forgot
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20, marginTop: 4 },
  forgotText: { fontSize: 13, fontWeight: '700', color: C.g4 },

  // Login button
  loginBtn: {
    borderRadius: 14, overflow: 'hidden', marginBottom: 22,
    shadowColor: C.g4, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  loginGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 10,
  },
  loginText: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
  loginArrow: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divText: { fontSize: 11, color: C.textMuted, fontWeight: '600', marginHorizontal: 12, letterSpacing: 0.3 },

  // Social
  socialRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },

  // Demo
  demoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 4 },
  demoBadge: {
    width: 20, height: 20, borderRadius: 6, backgroundColor: '#ede9fe',
    alignItems: 'center', justifyContent: 'center',
  },
  demoText: { fontSize: 13, fontWeight: '700', color: C.g4 },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 4 },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: '500' },
  footerDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.2)' },
});