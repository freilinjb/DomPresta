// AppNavigator.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { NavigationContainer, DefaultTheme, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoginScreen } from '../screens/Auth/LoginScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { LoansScreen } from '../screens/Loans/LoansScreen';
import { LoanDetailsScreen } from '../screens/Loans/LoanDetailsScreen';
import LoanFormScreen from '../screens/Forms/LoanFormScreen';
import { PaymentFormScreen } from '../screens/Forms/PaymentFormScreen';
import { ClientFormScreen } from '../screens/Forms/ClientFormScreen';
import { VendorFormScreen } from '../screens/Forms/VendorFormScreen';
import { LoanRequestFormScreen } from '../screens/Forms/LoanRequestFormScreen';
import { ReportsScreen } from '../screens/Reports/ReportsScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { ClientsScreen } from '../screens/Clients/ClientsScreen';
import ClientDetailsScreen from '../screens/Clients/ClientDetailsScreen';
import { VendorsScreen } from '../screens/Vendors/VendorsScreen';
import { LoanRequestsScreen } from '../screens/LoanRequests/LoanRequestsScreen';
import { CashRegisterScreen } from '../screens/CashRegister/CashRegisterScreen';
import { RootStackParamList, MainTabParamList, DrawerParamList } from './types';
import BottomTabBar from './BottomTabBar';
import ScreenWithTab from './ScreenWithTab';
import { AuthService, User } from '../services/authService';

// ─── Design System ────────────────────────────────────────────────────────────
const DS = {
  colors: {
    grad0: '#3b0764',
    grad1: '#5b21b6',
    grad2: '#6d28d9',
    grad3: '#7c3aed',
    accent: '#a78bfa',
    accentSoft: '#ddd6fe',
    surface: '#f5f3ff',
    surfaceCard: '#ffffff',
    text: '#1e1b4b',
    textSub: '#6b7280',
    textMuted: '#94a3b8',
    white: '#ffffff',
    overlayDark: 'rgba(0,0,0,0.45)',
    overlayLight: 'rgba(255,255,255,0.12)',
    overlayActive: 'rgba(255,255,255,0.22)',
    danger: '#ef4444',
  },
  font: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    title: 22,
  },
  weight: {
    regular: '400' as const,
    medium: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    pill: 999,
  },
};

// ─── Gradientes reutilizables ─────────────────────────────────────────────────
const GRAD_HEADER = [DS.colors.grad0, DS.colors.grad2] as const;
const GRAD_DRAWER = [DS.colors.grad0, DS.colors.grad1, DS.colors.grad2] as const;

// ─── Pantalla de carga ────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <LinearGradient
    colors={[DS.colors.grad0, DS.colors.grad1, DS.colors.grad2]}
    style={styles.loadingContainer}
  >
    <View style={styles.loadingContent}>
      <LinearGradient
        colors={[DS.colors.accent, DS.colors.grad3]}
        style={styles.loadingLogo}
      >
        <Ionicons name="wallet" size={48} color={DS.colors.white} />
      </LinearGradient>
      <Text style={styles.loadingTitle}>DomPresta</Text>
      <Text style={styles.loadingSubtitle}>Sistema Inteligente de Préstamos</Text>
      <View style={styles.loadingSpinner}>
        <ActivityIndicator size="large" color={DS.colors.accent} />
        <Text style={styles.loadingText}>Verificando sesión...</Text>
      </View>
    </View>
  </LinearGradient>
);

// ─── Navigators ───────────────────────────────────────────────────────────────
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// ─── screenOptions globales ───────────────────────────────────────────────────
const screenOptions: StackNavigationOptions = {
  headerBackground: () => (
    <LinearGradient
      colors={GRAD_HEADER}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={StyleSheet.absoluteFill}
    />
  ),
  headerTintColor: DS.colors.white,
  headerTitleStyle: {
    fontWeight: DS.weight.black,
    fontSize: DS.font.lg,
    letterSpacing: -0.4,
    color: DS.colors.white,
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  headerLeft: ({ canGoBack, onPress }) =>
    canGoBack? (
      <TouchableOpacity style={styles.backBtn} onPress={onPress}>
        <Ionicons name="chevron-back" size={20} color={DS.colors.white} />
      </TouchableOpacity>
    ) : null,
};

// ─── Drawer Config ────────────────────────────────────────────────────────────
const DRAWER_CONFIG = [
  { name: 'MainTabs', route: 'MainTabs', label: 'Inicio', icon: 'home-outline' },
  { name: 'Vendors', route: 'Vendors', label: 'Vendedores', icon: 'briefcase-outline' },
  { name: 'LoanRequests', route: 'LoanRequests', label: 'Solicitudes', icon: 'document-text-outline' },
  { name: 'CashRegister', route: 'CashRegister', label: 'Arqueo', icon: 'calculator-outline' },
  { name: 'Reports', route: 'Reports', label: 'Reportes', icon: 'stats-chart-outline' },
  { name: 'Settings', route: 'Settings', label: 'Ajustes', icon: 'settings-outline' },
] as const;

interface DrawerHeaderProps {
  user: User | null;
}

const DrawerHeader: React.FC<DrawerHeaderProps> = ({ user }) => {
  const getInitials = (name: string) => {
    return name
     .split(' ')
     .map(n => n[0])
     .join('')
     .toUpperCase()
     .slice(0, 2);
  };

  return (
    <View style={styles.drawerHeader}>
      <View style={styles.drawerHeaderOrb} />

      {/* Info del usuario */}
      <View style={styles.userInfoContainer}>
        {user?.avatar? (
          <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
        ) : (
          <LinearGradient
            colors={[DS.colors.accent, DS.colors.grad3]}
            style={styles.userAvatarPlaceholder}
          >
            <Text style={styles.userInitials}>
              {user?.name? getInitials(user.name) : 'U'}
            </Text>
          </LinearGradient>
        )}

        <View style={styles.userTextContainer}>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name || 'Usuario'}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email || 'sin-email@dompresta.com'}
          </Text>
          {user?.role && (
            <View style={styles.userRoleBadge}>
              <Text style={styles.userRoleText}>{user.role}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.drawerDivider} />
    </View>
  );
};

const CustomDrawerContent = ({ state, navigation }: DrawerContentComponentProps) => {
  const insets = useSafeAreaInsets();
  const focusedIndex = state.index;
  const [user, setUser] = useState<User | null>(null);

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const handleLogout = async () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (e) {
            Alert.alert('Error', 'No se pudo cerrar sesión');
          }
        },
      },
    ]);
  };

  const handleProfilePress = () => {
    navigation.navigate('MainTabs', { screen: 'Profile' });
    navigation.closeDrawer();
  };

  return (
    <LinearGradient
      colors={GRAD_DRAWER}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={[styles.drawerNoise, { paddingTop: insets.top }]}>
        <TouchableOpacity activeOpacity={0.8} onPress={handleProfilePress}>
          <DrawerHeader user={user} />
        </TouchableOpacity>

        <DrawerContentScrollView
          scrollEnabled={false}
          contentContainerStyle={styles.drawerScroll}
        >
          {state.routes.map((route, index) => {
            const config = DRAWER_CONFIG.find(c => c.name === route.name);
            if (!config) return null;
            const focused = index === focusedIndex;

            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.75}
                style={[styles.drawerItem, focused && styles.drawerItemActive]}
                onPress={() => navigation.navigate(route.name)}
              >
                {focused && (
                  <LinearGradient
                    colors={[DS.colors.overlayActive, 'rgba(255,255,255,0.06)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                    borderRadius={DS.radius.md}
                  />
                )}
                <View style={[styles.drawerIconWrap, focused && styles.drawerIconWrapActive]}>
                  <Ionicons
                    name={config.icon as any}
                    size={19}
                    color={focused? DS.colors.white : DS.colors.accent}
                  />
                </View>
                <Text style={[styles.drawerLabel, focused && styles.drawerLabelActive]}>
                  {config.label}
                </Text>
                {focused && <View style={styles.drawerActiveDot} />}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.drawerItem, styles.drawerLogoutItem]}
            onPress={handleLogout}
          >
            <View style={styles.drawerIconWrap}>
              <Ionicons name="log-out-outline" size={19} color={DS.colors.danger} />
            </View>
            <Text style={[styles.drawerLabel, styles.drawerLogoutLabel]}>
              Cerrar Sesión
            </Text>
          </TouchableOpacity>
        </DrawerContentScrollView>

        <View style={[styles.drawerFooter, { paddingBottom: insets.bottom + DS.space.md }]}>
          <View style={styles.drawerDivider} />
          <Text style={styles.drawerFooterText}>v1.0.0 • DomPresta®</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

// ─── MainTabs ────────────────────────────────────────────────────────────────
const MainTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <BottomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Loans" component={LoansScreen} />
    <Tab.Screen name="Clients" component={ClientsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ─── MainDrawer ───────────────────────────────────────────────────────────────
const MainDrawer = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{
     ...screenOptions,
      drawerStyle: {
        backgroundColor: 'transparent',
        width: 295,
      },
      drawerType: 'front',
      overlayColor: DS.colors.overlayDark,
      swipeEdgeWidth: 40,
    }}
  >
    <Drawer.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
    <Drawer.Screen name="Vendors" component={ScreenWithTab(VendorsScreen)} options={{ title: 'Vendedores' }} />
    <Drawer.Screen name="LoanRequests" component={ScreenWithTab(LoanRequestsScreen)} options={{ title: 'Solicitudes' }} />
    <Drawer.Screen name="CashRegister" component={ScreenWithTab(CashRegisterScreen)} options={{ title: 'Arqueo de Caja' }} />
    <Drawer.Screen name="Reports" component={ScreenWithTab(ReportsScreen)} options={{ title: 'Reportes' }} />
    <Drawer.Screen name="Settings" component={ScreenWithTab(SettingsScreen)} options={{ title: 'Configuraciones' }} />
  </Drawer.Navigator>
);

// ─── AppNavigator ─────────────────────────────────────────────────────────────
const AppNavigator = () => {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navTheme = {
   ...DefaultTheme,
    colors: {
     ...DefaultTheme.colors,
      background: DS.colors.surface,
      primary: DS.colors.grad2,
      card: DS.colors.grad1,
      text: DS.colors.white,
      border: 'transparent',
    },
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      await AuthService.initialize();
      const auth = await AuthService.isAuthenticated();
      setIsAuthenticated(auth);
    } catch (error) {
      console.error('Error checking auth state:', error);
      setIsAuthenticated(false);
    } finally {
      setIsReady(true);
    }
  };

  if (!isReady) return <LoadingScreen />;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName={isAuthenticated? 'MainDrawer' : 'Login'}
          screenOptions={screenOptions}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MainDrawer" component={MainDrawer} options={{ headerShown: false }} />

          {/* Formularios y detalles */}
          <Stack.Screen name="LoanDetails" component={LoanDetailsScreen} options={{ title: 'Detalle del Préstamo' }} />
          <Stack.Screen
            name="LoanForm"
            component={LoanFormScreen}
            options={({ route }) => ({
              title: route.params?.loanId? 'Editar Préstamo' : 'Nuevo Préstamo',
            })}
          />
          <Stack.Screen name="PaymentForm" component={PaymentFormScreen} options={{ title: 'Registrar Pago' }} />
          <Stack.Screen
            name="ClientForm"
            component={ClientFormScreen}
            options={({ route }) => ({
              title: route.params?.clientId? 'Editar Cliente' : 'Nuevo Cliente',
            })}
          />
          <Stack.Screen
            name="ClientDetails"
            component={ClientDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VendorForm"
            component={VendorFormScreen}
            options={({ route }) => ({
              title: route.params?.vendorId? 'Editar Vendedor' : 'Nuevo Vendedor',
            })}
          />
          <Stack.Screen
            name="LoanRequestForm"
            component={LoanRequestFormScreen}
            options={({ route }) => ({
              title: route.params?.requestId? 'Editar Solicitud' : 'Nueva Solicitud',
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default AppNavigator;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backBtn: {
    marginLeft: DS.space.sm,
    width: 34,
    height: 34,
    borderRadius: DS.radius.pill,
    backgroundColor: DS.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: { flex: 1 },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DS.space.xl,
  },
  loadingLogo: {
    width: 100,
    height: 100,
    borderRadius: DS.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DS.space.xl,
    shadowColor: DS.colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: DS.weight.black,
    color: DS.colors.white,
    letterSpacing: -1,
    marginBottom: DS.space.sm,
  },
  loadingSubtitle: {
    fontSize: DS.font.md,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: DS.space.xxl,
  },
  loadingSpinner: { alignItems: 'center', gap: DS.space.md },
  loadingText: {
    fontSize: DS.font.sm,
    color: 'rgba(255,255,255,0.5)',
    marginTop: DS.space.md,
  },
  drawerNoise: { flex: 1 },
  drawerHeader: {
    paddingHorizontal: DS.space.xl,
    paddingTop: DS.space.xl,
    paddingBottom: DS.space.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  drawerHeaderOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(167,139,250,0.12)',
    top: -40,
    right: -40,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.md,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: DS.radius.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  userAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  userInitials: {
    fontSize: DS.font.lg,
    fontWeight: DS.weight.black,
    color: DS.colors.white,
  },
  userTextContainer: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: DS.font.lg,
    fontWeight: DS.weight.bold,
    color: DS.colors.white,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: DS.font.xs,
    fontWeight: DS.weight.medium,
    color: 'rgba(255,255,255,0.6)',
  },
  userRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(167,139,250,0.25)',
    paddingHorizontal: DS.space.sm,
    paddingVertical: 2,
    borderRadius: DS.radius.sm,
    marginTop: 4,
  },
  userRoleText: {
    fontSize: 10,
    fontWeight: DS.weight.bold,
    color: DS.colors.accentSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  drawerDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: DS.space.lg,
  },
  drawerScroll: {
    paddingHorizontal: DS.space.md,
    paddingTop: DS.space.md,
    paddingBottom: DS.space.sm,
    gap: DS.space.xs,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DS.space.md,
    paddingVertical: DS.space.md,
    borderRadius: DS.radius.md,
    marginBottom: DS.space.xs,
    position: 'relative',
    overflow: 'hidden',
  },
  drawerItemActive: {},
  drawerLogoutItem: { marginTop: DS.space.md },
  drawerLogoutLabel: { color: DS.colors.danger },
  drawerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: DS.radius.sm,
    backgroundColor: 'rgba(167,139,250,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DS.space.md,
  },
  drawerIconWrapActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  drawerLabel: {
    flex: 1,
    fontSize: DS.font.md,
    fontWeight: DS.weight.medium,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.1,
  },
  drawerLabelActive: { color: DS.colors.white, fontWeight: DS.weight.bold },
  drawerActiveDot: {
    width: 6,
    height: 6,
    borderRadius: DS.radius.pill,
    backgroundColor: DS.colors.accent,
    marginLeft: DS.space.sm,
  },
  drawerFooter: { paddingHorizontal: DS.space.xl, paddingTop: DS.space.md },
  drawerFooterText: {
    fontSize: DS.font.xs,
    color: 'rgba(255,255,255,0.3)',
    marginTop: DS.space.md,
    letterSpacing: 0.4,
  },
});