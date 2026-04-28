import React, { useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { AuthService } from '../services/authService';
import { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');

type LoadingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Loading'>;

interface LoadingScreenProps {
  navigation: LoadingScreenNavigationProp;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ navigation }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Animación de rotación del ícono
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000 }),
      -1,
      false
    );

    // Animación de pulso
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500)),
        withTiming(1, { duration: 500))
      ),
      -1,
      true
    );

    // Verificar sesión
    checkAuthState();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const checkAuthState = async () => {
    try {
      // Inicializar servicios (esto verificará la sesión guardada)
      await AuthService.initialize();
      
      // Verificar si hay sesión activa
      const isAuthenticated = await AuthService.isAuthenticated();
      
      // Pequeña pausa para la animación
      setTimeout(() => {
        if (isAuthenticated) {
          // Usuario logueado, ir al drawer principal
          navigation.replace('MainDrawer');
        } else {
          // Sin sesión, ir al login
          navigation.replace('Login');
        }
      }, 1500);
    } catch (error) {
      console.error('Error checking auth state:', error);
      navigation.replace('Login');
    }
  };

  return (
    <LinearGradient
      colors={['#0d0121', '#1a0533', '#2e0a5e', '#3d0f7a']}
      style={styles.container}
    >
      <Animated.View entering={FadeIn.duration(1000)} style={styles.content}>
        <Animated.View style={[styles.logoContainer, animatedStyle]}>
          <LinearGradient
            colors={['#8b5cf6', '#6d28d9', '#3d0f7a']}
            style={styles.logo}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logoText}>DP</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.Text 
          entering={FadeIn.delay(300).duration(800)}
          style={styles.appName}
        >
          DomPresta
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.delay(500).duration(800)}
          style={styles.subtitle}
        >
          Sistema Inteligente de Préstamos
        </Animated.Text>

        <Animated.View 
          entering={FadeIn.delay(700).duration(800)}
          style={styles.loaderContainer}
        >
          <ActivityIndicator size="large" color="#a78bfa" />
          <Text style={styles.loadingText}>Verificando sesión...</Text>
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginBottom: 50,
  },
  loaderContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
});