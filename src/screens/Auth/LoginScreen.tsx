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
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { AuthService } from '../../services/authService';
import { NotificationService } from '../../services/notificationService';
import { RootStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

// ─── Theme igual que HomeScreen ──────────────────────────────────
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
  danger: '#dc2626',
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
type UserRole = 'cliente' | 'cobrador';

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState<'email' | 'google' | 'facebook' | 'apple' | null>(null);
  const [role, setRole] = useState<UserRole>('cliente');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(30)).current;

  // Google Auth
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: 'TU_ANDROID_CLIENT_ID',
    iosClientId: 'TU_IOS_CLIENT_ID',
    webClientId: 'TU_WEB_CLIENT_ID',
    responseType: ResponseType.Token,
  });

  useEffect(() => {
    initializeApp();
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      RNAnimated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
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
    } catch (error) {
      console.error('Init error:', error);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() ||!password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    setAuthLoading('email');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const user = await AuthService.login(email.trim(), password, role);
      if (user) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('MainDrawer'); // ← Como estaba antes
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Credenciales incorrectas');
    } finally {
      setAuthLoading(null);
    }
  };

  // ─── Login simulado con Google ────────────────────────────────
  const handleGoogleAuth = async (token?: string) => {
    setAuthLoading('google');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Simulado: en prod usarías AuthService.loginWithGoogle(token, role)
      await new Promise(resolve => setTimeout(resolve, 1200));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('MainTabs'); // ← Como estaba antes
    } catch (error) {
      Alert.alert('Error', 'No se pudo autenticar con Google');
    } finally {
      setAuthLoading(null);
    }
  };

  // ─── Login simulado con Facebook ──────────────────────────────
  const handleFacebookAuth = async () => {
    setAuthLoading('facebook');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Simulado: en prod usarías expo-auth-session con Facebook
      await new Promise(resolve => setTimeout(resolve, 1200));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('MainDrawer'); // ← Igual que email login
    } catch (error) {
      Alert.alert('Error', 'No se pudo autenticar con Facebook');
    } finally {
      setAuthLoading(null);
    }
  };

  // ─── Login con Apple ──────────────────────────────────────────
  const handleAppleAuth = async () => {
    setAuthLoading('apple');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        // Simulado
        await new Promise(resolve => setTimeout(resolve, 800));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('MainDrawer'); // ← Como estaba antes
      }
    } catch (error: any) {
      if (error.code!== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', 'No se pudo autenticar con Apple');
      }
    } finally {
      setAuthLoading(null);
    }
  };

  const SocialButton = ({ icon, onPress, loadingKey, color, isIonicons = false }: any) => (
    <TouchableOpacity
      style={[s.socialButton, { backgroundColor: color, opacity: authLoading && authLoading!== loadingKey? 0.4 : 1 }]}
      onPress={onPress}
      disabled={!!authLoading}
      activeOpacity={0.8}
    >
      {authLoading === loadingKey? (
        <ActivityIndicator color="#fff" size="small" />
      ) : isIonicons? (
        <Ionicons name={icon} size={24} color="#fff" />
      ) : (
        <Text style={s.socialIconText}>{icon}</Text>
      )}
    </TouchableOpacity>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12? 'Buenos días' : hour < 18? 'Buenas tardes' : 'Buenas noches';
  const roleText = role === 'cobrador'? 'Gestión de cobros en ruta' : 'Sistema de préstamos inteligente';
  const roleIcon = role === 'cobrador'? 'briefcase' : 'wallet';

  return (
    <LinearGradient
      colors={[C.primary, '#6d28d9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.container}
    >
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios'? 'padding' : 'height'}
        style={s.keyboardView}
      >
        <RNAnimated.View
          style={[
            s.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.header}>
            <View style={s.logoWrapper}>
              <LinearGradient
                colors={[C.primary2, C.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.logo}
              >
                <Ionicons name={roleIcon} size={32} color="white" />
              </LinearGradient>
            </View>
            <Text style={s.greeting}>{greeting} 👋</Text>
            <Text style={s.title}>DomPresta</Text>
            <Text style={s.subtitle}>{roleText}</Text>
          </Animated.View>

          {/* Selector de Rol */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={s.roleSwitch}>
            {(['cliente', 'cobrador'] as UserRole[]).map((r) => (
              <Pressable
                key={r}
                style={[s.roleBtn, role === r && s.roleBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRole(r);
                }}
              >
                <Ionicons
                  name={r === 'cobrador'? 'briefcase-outline' : 'person-outline'}
                  size={16}
                  color={role === r? C.white : 'rgba(255,255,255,0.6)'}
                />
                <Text style={[s.roleText, role === r && s.roleTextActive]}>
                  {r === 'cobrador'? 'Cobrador' : 'Cliente'}
                </Text>
              </Pressable>
            ))}
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInUp.delay(300).springify()}>
            <BlurView intensity={30} tint="light" style={s.form}>
              <View style={[s.inputContainer, emailFocused && s.inputActive]}>
                <Ionicons name="mail-outline" size={20} color={emailFocused? C.primary2 : C.textMuted} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Email"
                  placeholderTextColor={C.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!authLoading}
                />
              </View>

              <View style={[s.inputContainer, passFocused && s.inputActive]}>
                <Ionicons name="lock-closed-outline" size={20} color={passFocused? C.primary2 : C.textMuted} style={s.inputIcon} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="Contraseña"
                  placeholderTextColor={C.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  secureTextEntry={!showPassword}
                  editable={!authLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeButton}>
                  <Ionicons
                    name={showPassword? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={C.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={s.forgotButton}
                onPress={() => Alert.alert('Recuperar contraseña', 'Te enviaremos un link a tu correo')}
              >
                <Text style={s.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.loginButton, authLoading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={!!authLoading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[C.primary2, C.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.loginGradient}
                >
                  {authLoading === 'email'? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.loginText}>Iniciar Sesión</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={s.divider}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>o continúa con</Text>
                <View style={s.dividerLine} />
              </View>

              {/* Social Auth */}
              <View style={s.socialContainer}>
                <SocialButton
                  icon="logo-google"
                  onPress={() => googlePromptAsync()}
                  loadingKey="google"
                  color="#EA4335"
                  isIonicons
                />

                <SocialButton
                  icon="logo-facebook"
                  onPress={handleFacebookAuth}
                  loadingKey="facebook"
                  color="#1877F2"
                  isIonicons
                />

                {Platform.OS === 'ios' && (
                  <SocialButton
                    icon="logo-apple"
                    onPress={handleAppleAuth}
                    loadingKey="apple"
                    color="#000000"
                    isIonicons
                  />
                )}
              </View>

              {/* Demo Credentials */}
              <TouchableOpacity
                style={s.demoButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEmail(role === 'cobrador'? 'cobrador@dompresta.com' : 'admin@dompresta.com');
                  setPassword('admin123');
                }}
              >
                <Text style={s.demoText}>Usar credenciales demo</Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>

          {/* Footer */}
          <Text style={s.footer}>DomPresta v2.0.0</Text>
        </RNAnimated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const s = {
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    marginBottom: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: C.white,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  roleBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  roleTextActive: {
    color: C.white,
  },
  form: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: C.bg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
  },
  inputActive: {
    borderColor: C.primary2,
    backgroundColor: C.white,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: C.text,
    fontSize: 15,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 6,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: C.primary2,
    fontSize: 13,
    fontWeight: '700',
  },
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  loginGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  loginText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: 10,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  socialButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  socialIconText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  demoButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  demoText: {
    color: C.primary2,
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 24,
    fontWeight: '600',
  },
} as const;