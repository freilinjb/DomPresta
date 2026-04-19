import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Alert,
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
import { AuthService } from '../../services/authService';
import { NotificationService } from '../../services/notificationService';
import { RootStackParamList } from '../../navigation/types';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState<'email' | 'google' | 'apple' | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Google Auth
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: 'TU_ANDROID_CLIENT_ID',
    iosClientId: 'TU_IOS_CLIENT_ID',
    webClientId: 'TU_WEB_CLIENT_ID',
    responseType: ResponseType.Token,
  });

  React.useEffect(() => {
    initializeApp();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  React.useEffect(() => {
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
    if (!email.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    setLoading(true);
    setAuthLoading('email');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const user = await AuthService.login(email.trim(), password);
      if (user) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('MainTabs');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Credenciales incorrectas');
    } finally {
      setLoading(false);
      setAuthLoading(null);
    }
  };

  const handleGoogleAuth = async (token?: string) => {
    if (!token) return;
    setAuthLoading('google');
    try {
      // const user = await AuthService.loginWithGoogle(token);
      const user = null; // Placeholder
      Alert.alert('Info', 'Google Auth no implementado aún');
      if (user) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('MainTabs');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo autenticar con Google');
    } finally {
      setAuthLoading(null);
    }
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
        // const user = await AuthService.loginWithApple(credential.identityToken);
        const user = null; // Placeholder
        Alert.alert('Info', 'Apple Auth no implementado aún');
        if (user) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          navigation.replace('MainTabs');
        }
      }
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', 'No se pudo autenticar con Apple');
      }
    } finally {
      setAuthLoading(null);
    }
  };

  const SocialButton = ({ icon, onPress, loading, color, isIonicons = false }: any) => (
    <TouchableOpacity
      style={[styles.socialButton, { backgroundColor: color }]}
      onPress={onPress}
      disabled={!!authLoading}
      activeOpacity={0.8}
    >
      {authLoading === loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : isIonicons ? (
        <Ionicons name={icon} size={24} color="#fff" />
      ) : (
        <Text style={styles.socialIconText}>{icon}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#0F172A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View 
          style={[
            styles.content, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logo}
              >
                <Text style={styles.logoText}>D</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>DomPresta</Text>
            <Text style={styles.subtitle}>Sistema de préstamos inteligente</Text>
          </View>

          {/* Form */}
          <BlurView intensity={20} tint="dark" style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Contraseña"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#64748B" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => Alert.alert('Recuperar contraseña', 'Función disponible próximamente')}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginText}>Iniciar Sesión</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Auth */}
            <View style={styles.socialContainer}>
              <SocialButton
                icon="logo-google"
                onPress={() => googlePromptAsync()}
                loading="google"
                color="#EA4335"
                isIonicons
              />
              
              {Platform.OS === 'ios' && (
                <SocialButton
                  icon="logo-apple"
                  onPress={handleAppleAuth}
                  loading="apple"
                  color="#000000"
                  isIonicons
                />
              )}
            </View>

            {/* Demo Credentials */}
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEmail('admin@dompresta.com');
                setPassword('admin123');
              }}
            >
              <Text style={styles.demoText}>Usar credenciales demo</Text>
            </TouchableOpacity>
          </BlurView>

          {/* Footer */}
          <Text style={styles.footer}>v2.0.0</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    marginBottom: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 38,
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  form: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    color: '#fff',
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 13,
    marginHorizontal: 12,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  socialIconText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '600',
  },
  demoButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  demoText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 12,
    marginTop: 32,
    fontWeight: '500',
  },
} as const;