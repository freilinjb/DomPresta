import React, { useState, useRef, useEffect } from 'react';
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '../../services/authService';
import { NotificationService } from '../../services/notificationService';
import { RootStackParamList } from '../../navigation/types';

const { width, height } = Dimensions.get('window');

// ─── Design System (igual que AppNavigator) ───────────────────────────────────
const DS = {
  colors: {
    grad0: '#3b0764',
    grad1: '#5b21b6',
    grad2: '#6d28d9',
    grad3: '#7c3aed',
    accent: '#a78bfa',
    accentSoft: '#ddd6fe',
    surface: '#f5f3ff',
    white: '#ffffff',
    text: '#1e1b4b',
    textSub: '#64748b',
    textMuted: '#94a3b8',
    border: 'rgba(0,0,0,0.07)',
    borderActive: '#7c3aed',
    success: '#059669',
    danger: '#dc2626',
    overlayLight: 'rgba(255,255,255,0.13)',
    overlayActive: 'rgba(255,255,255,0.22)',
  },
  font: { xs: 11, sm: 13, md: 15, lg: 17, xl: 22, title: 34 },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 },
  radius: { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 },
};

const GRAD_BG     = [DS.colors.grad0, DS.colors.grad1, DS.colors.grad2] as const;
const GRAD_BTN    = [DS.colors.grad3, DS.colors.grad1] as const;
const GRAD_LOGO   = [DS.colors.accent, DS.colors.grad3] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
type UserRole = 'cliente' | 'cobrador';
interface LoginScreenProps { navigation: LoginScreenNavigationProp; }

WebBrowser.maybeCompleteAuthSession();

// ─── Component ────────────────────────────────────────────────────────────────
export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading]   = useState<'email' | 'google' | 'facebook' | 'apple' | null>(null);
  const [role, setRole]                 = useState<UserRole>('cliente');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused]   = useState(false);

  const fadeAnim  = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(40)).current;

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: 'TU_ANDROID_CLIENT_ID',
    iosClientId: 'TU_IOS_CLIENT_ID',
    webClientId: 'TU_WEB_CLIENT_ID',
    responseType: ResponseType.Token,
  });

  useEffect(() => {
    initializeApp();
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      RNAnimated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos.');
      return;
    }
    setAuthLoading('email');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const user = await AuthService.login(email.trim(), password, role);
      if (user) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('MainDrawer');
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Acceso denegado', 'Credenciales incorrectas. Inténtalo de nuevo.');
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

  // ─── Derived values ─────────────────────────────────────────────────────────
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? 'Buenos días ☀️' : hour < 18 ? 'Buenas tardes 🌤' : 'Buenas noches 🌙';
  const roleLabel  = role === 'cobrador' ? 'Gestión de cobros en ruta' : 'Sistema de préstamos inteligente';
  const roleIcon   = role === 'cobrador' ? 'briefcase' : 'wallet';
  const isDisabled = !!authLoading;

  // ─── Sub-components ─────────────────────────────────────────────────────────
  const SocialBtn = ({
    icon, onPress, loadingKey, bg,
  }: { icon: string; onPress: () => void; loadingKey: string; bg: string }) => (
    <TouchableOpacity
      style={[styles.socialBtn, { backgroundColor: bg, opacity: isDisabled && authLoading !== loadingKey ? 0.4 : 1 }]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {authLoading === loadingKey
        ? <ActivityIndicator color={DS.colors.white} size="small" />
        : <Ionicons name={icon as any} size={22} color={DS.colors.white} />}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={GRAD_BG} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.root}>
      <StatusBar style="light" />

      {/* Orbes decorativos de fondo */}
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <RNAnimated.ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + DS.space.xl, paddingBottom: insets.bottom + DS.space.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.header}>
            {/* Logo */}
            <View style={styles.logoShadow}>
              <LinearGradient colors={GRAD_LOGO} style={styles.logo}>
                <Ionicons name={roleIcon as any} size={30} color={DS.colors.white} />
              </LinearGradient>
            </View>

            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.appName}>DomPresta</Text>
            <Text style={styles.appSub}>{roleLabel}</Text>
          </Animated.View>

          {/* ── Role Toggle ─────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.roleRow}>
            {(['cliente', 'cobrador'] as UserRole[]).map((r) => {
              const active = role === r;
              return (
                <Pressable
                  key={r}
                  style={[styles.roleBtn, active && styles.roleBtnActive]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRole(r); }}
                >
                  {active && (
                    <LinearGradient
                      colors={[DS.colors.overlayActive, 'rgba(255,255,255,0.08)']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[StyleSheet.absoluteFill, { borderRadius: DS.radius.sm }]}
                    />
                  )}
                  <Ionicons
                    name={(r === 'cobrador' ? 'briefcase-outline' : 'person-outline') as any}
                    size={15}
                    color={active ? DS.colors.white : 'rgba(255,255,255,0.5)'}
                  />
                  <Text style={[styles.roleTxt, active && styles.roleTxtActive]}>
                    {r === 'cobrador' ? 'Cobrador' : 'Cliente'}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* ── Form Card ──────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(240).springify()}>
            <BlurView intensity={20} tint="light" style={styles.card}>

              {/* Email */}
              <View style={[styles.field, emailFocused && styles.fieldActive]}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color={emailFocused ? DS.colors.grad3 : DS.colors.textMuted}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Correo electrónico"
                  placeholderTextColor={DS.colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isDisabled}
                />
              </View>

              {/* Password */}
              <View style={[styles.field, passFocused && styles.fieldActive]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color={passFocused ? DS.colors.grad3 : DS.colors.textMuted}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  placeholder="Contraseña"
                  placeholderTextColor={DS.colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  secureTextEntry={!showPassword}
                  editable={!isDisabled}
                />
                <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn} hitSlop={8}>
                  <Ionicons name={(showPassword ? 'eye-off-outline' : 'eye-outline') as any} size={19} color={DS.colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Forgot */}
              <TouchableOpacity
                style={styles.forgotRow}
                onPress={() => Alert.alert('Recuperar contraseña', 'Te enviaremos un link a tu correo.')}
              >
                <Text style={styles.forgotTxt}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              {/* Login button */}
              <TouchableOpacity
                style={[styles.loginBtn, isDisabled && { opacity: 0.65 }]}
                onPress={handleLogin}
                disabled={isDisabled}
                activeOpacity={0.88}
              >
                <LinearGradient colors={GRAD_BTN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginGrad}>
                  {authLoading === 'email'
                    ? <ActivityIndicator color={DS.colors.white} />
                    : (
                      <>
                        <Text style={styles.loginTxt}>Iniciar Sesión</Text>
                        <Ionicons name="arrow-forward" size={17} color={DS.colors.white} />
                      </>
                    )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerTxt}>o continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social */}
              <View style={styles.socialRow}>
                <SocialBtn icon="logo-google"   onPress={() => googlePromptAsync()} loadingKey="google"   bg="#EA4335" />
                <SocialBtn icon="logo-facebook" onPress={handleFacebookAuth}        loadingKey="facebook" bg="#1877F2" />
                {Platform.OS === 'ios' && (
                  <SocialBtn icon="logo-apple"  onPress={handleAppleAuth}           loadingKey="apple"    bg="#000" />
                )}
              </View>

              {/* Demo */}
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEmail(role === 'cobrador' ? 'cobrador@dompresta.com' : 'admin@dompresta.com');
                  setPassword('admin123');
                }}
              >
                <Ionicons name="flash-outline" size={13} color={DS.colors.grad3} />
                <Text style={styles.demoTxt}>Usar credenciales demo</Text>
              </TouchableOpacity>

            </BlurView>
          </Animated.View>

          {/* Footer */}
          <Text style={styles.footer}>DomPresta v2.0.0  •  Todos los derechos reservados</Text>
        </RNAnimated.ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  kav:  { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: DS.space.xl,
  },

  // Orbes de fondo
  orb: {
    position: 'absolute',
    borderRadius: DS.radius.pill,
    backgroundColor: 'rgba(167,139,250,0.10)',
  },
  orbTop: {
    width: 320,
    height: 320,
    top: -80,
    right: -80,
  },
  orbBottom: {
    width: 260,
    height: 260,
    bottom: -60,
    left: -60,
    backgroundColor: 'rgba(109,40,217,0.18)',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: DS.space.xl,
  },
  logoShadow: {
    marginBottom: DS.space.lg,
    shadowColor: DS.colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 14,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: DS.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: DS.font.sm,
    fontWeight: DS.weight.semibold,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: DS.space.xs,
    letterSpacing: 0.2,
  },
  appName: {
    fontSize: DS.font.title,
    fontWeight: DS.weight.black,
    color: DS.colors.white,
    letterSpacing: -0.9,
    marginBottom: DS.space.xs,
  },
  appSub: {
    fontSize: DS.font.sm,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.3,
  },

  // ── Role Toggle ───────────────────────────────────────────────────────────
  roleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: DS.radius.md,
    padding: DS.space.xs,
    marginBottom: DS.space.lg,
    gap: DS.space.xs,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: DS.radius.sm,
    gap: DS.space.sm,
    overflow: 'hidden',
  },
  roleBtnActive: {
    // gradient inside
  },
  roleTxt: {
    fontSize: DS.font.sm,
    fontWeight: DS.weight.bold,
    color: 'rgba(255,255,255,0.5)',
  },
  roleTxtActive: {
    color: DS.colors.white,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    borderRadius: DS.radius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    padding: DS.space.xxl,
    shadowColor: DS.colors.grad0,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 18,
  },

  // ── Fields ────────────────────────────────────────────────────────────────
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DS.space.md,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md,
    borderWidth: 1.5,
    borderColor: DS.colors.border,
    paddingHorizontal: DS.space.md,
  },
  fieldActive: {
    borderColor: DS.colors.borderActive,
    backgroundColor: DS.colors.white,
    shadowColor: DS.colors.grad3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldIcon: { marginRight: DS.space.md },
  fieldInput: {
    flex: 1,
    paddingVertical: 14,
    color: DS.colors.text,
    fontSize: DS.font.md,
    fontWeight: DS.weight.medium,
  },
  eyeBtn: { padding: DS.space.sm },

  // ── Forgot ────────────────────────────────────────────────────────────────
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: DS.space.xl,
  },
  forgotTxt: {
    color: DS.colors.grad3,
    fontSize: DS.font.sm,
    fontWeight: DS.weight.bold,
  },

  // ── Login button ──────────────────────────────────────────────────────────
  loginBtn: {
    borderRadius: DS.radius.md,
    overflow: 'hidden',
    marginBottom: DS.space.xl,
    shadowColor: DS.colors.grad1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  loginGrad: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: DS.space.sm,
  },
  loginTxt: {
    color: DS.colors.white,
    fontSize: DS.font.md,
    fontWeight: DS.weight.black,
    letterSpacing: 0.4,
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DS.space.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: DS.colors.border,
  },
  dividerTxt: {
    color: DS.colors.textMuted,
    fontSize: DS.font.xs,
    fontWeight: DS.weight.semibold,
    marginHorizontal: DS.space.md,
    letterSpacing: 0.2,
  },

  // ── Social ────────────────────────────────────────────────────────────────
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: DS.space.md,
    marginBottom: DS.space.lg,
  },
  socialBtn: {
    width: 54,
    height: 54,
    borderRadius: DS.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },

  // ── Demo ──────────────────────────────────────────────────────────────────
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.space.xs,
    paddingVertical: DS.space.xs,
  },
  demoTxt: {
    color: DS.colors.grad3,
    fontSize: DS.font.sm,
    fontWeight: DS.weight.bold,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.35)',
    fontSize: DS.font.xs,
    marginTop: DS.space.xl,
    fontWeight: DS.weight.semibold,
    letterSpacing: 0.3,
  },
});