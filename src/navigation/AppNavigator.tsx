import React from 'react';
import { StatusBar, Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { BlurView } from 'expo-blur';
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
import { VendorsScreen } from '../screens/Vendors/VendorsScreen';
import { LoanRequestsScreen } from '../screens/LoanRequests/LoanRequestsScreen';
import { CashRegisterScreen } from '../screens/CashRegister/CashRegisterScreen';
import { RootStackParamList, MainTabParamList, DrawerParamList } from './types';
import BottomTabBar from './BottomTabBar';
import ScreenWithTab from './ScreenWithTab';

// ─── Design System ────────────────────────────────────────────────────────────
const DS = {
  // Paleta principal — violeta profundo → índigo
  colors: {
    grad0: '#3b0764',   // violeta muy oscuro
    grad1: '#5b21b6',   // violeta principal
    grad2: '#6d28d9',   // violeta medio
    grad3: '#7c3aed',   // violeta claro
    accent: '#a78bfa',  // lavanda
    accentSoft: '#ddd6fe',
    surface: '#f5f3ff', // fondo general
    surfaceCard: '#ffffff',
    text: '#1e1b4b',
    textSub: '#6b7280',
    textMuted: '#94a3b8',
    white: '#ffffff',
    overlayDark: 'rgba(0,0,0,0.45)',
    overlayLight: 'rgba(255,255,255,0.12)',
    overlayActive: 'rgba(255,255,255,0.22)',
  },
  // Tipografía
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
  // Espaciado
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  // Bordes
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

// ─── Stack / Tab / Drawer factories ──────────────────────────────────────────
const Stack = createStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// ─── screenOptions globales ───────────────────────────────────────────────────
const screenOptions = {
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
  // Botón "back" personalizado con fondo semi-transparente
  headerBackImage: () => (
    <View style={styles.backBtn}>
      <Ionicons name="chevron-back" size={20} color={DS.colors.white} />
    </View>
  ),
};

// ─── Drawer items config ──────────────────────────────────────────────────────
const DRAWER_ITEMS = [
  { name: 'Inicio',      icon: 'home-outline'          as const },
  { name: 'Vendedores',  icon: 'briefcase-outline'     as const },
  { name: 'Solicitudes', icon: 'document-text-outline' as const },
  { name: 'Arqueo',      icon: 'calculator-outline'    as const },
  { name: 'Reportes',    icon: 'stats-chart-outline'   as const },
  { name: 'Ajustes',     icon: 'settings-outline'      as const },
];

// ─── Drawer Header ornamental ─────────────────────────────────────────────────
const DrawerHeader = () => (
  <View style={styles.drawerHeader}>
    {/* Círculo decorativo de fondo */}
    <View style={styles.drawerHeaderOrb} />
    <View style={styles.drawerLogoWrap}>
      <LinearGradient
        colors={[DS.colors.accent, DS.colors.grad3]}
        style={styles.drawerLogoGrad}
      >
        <Ionicons name="wallet" size={28} color={DS.colors.white} />
      </LinearGradient>
    </View>
    <Text style={styles.drawerAppName}>DomPresta</Text>
    <Text style={styles.drawerAppSub}>Panel de Gestión</Text>
    {/* Separador decorativo */}
    <View style={styles.drawerDivider} />
  </View>
);

// ─── Custom Drawer Content ────────────────────────────────────────────────────
const CustomDrawerContent = (props: any) => {
  const insets = useSafeAreaInsets();
  const { state, navigation } = props;
  const focusedIndex = state.index;

  return (
    <LinearGradient
      colors={GRAD_DRAWER}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Capa de textura sutil */}
      <View style={[styles.drawerNoise, { paddingTop: insets.top }]}>
        <DrawerHeader />

        <DrawerContentScrollView
          {...props}
          scrollEnabled={false}
          contentContainerStyle={styles.drawerScroll}
        >
          {state.routes.map((route: any, index: number) => {
            const item = DRAWER_ITEMS[index];
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
                    // @ts-ignore
                    borderRadius={DS.radius.md}
                  />
                )}
                <View style={[styles.drawerIconWrap, focused && styles.drawerIconWrapActive]}>
                  <Ionicons
                    name={item?.icon ?? 'ellipse-outline'}
                    size={19}
                    color={focused ? DS.colors.white : DS.colors.accent}
                  />
                </View>
                <Text style={[styles.drawerLabel, focused && styles.drawerLabelActive]}>
                  {item?.name ?? route.name}
                </Text>
                {focused && (
                  <View style={styles.drawerActiveDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </DrawerContentScrollView>

        {/* Footer del drawer */}
        <View style={[styles.drawerFooter, { paddingBottom: insets.bottom + DS.space.md }]}>
          <View style={styles.drawerDivider} />
          <Text style={styles.drawerFooterText}>v1.0.0  •  DomPresta®</Text>
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
    <Tab.Screen name="Home"     component={HomeScreen}    />
    <Tab.Screen name="Loans"    component={LoansScreen}   />
    <Tab.Screen name="Clients"  component={ClientsScreen} />
    <Tab.Screen name="Profile"  component={ProfileScreen} />
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
        width: 285,
      },
      drawerType: 'front',
      overlayColor: DS.colors.overlayDark,
      swipeEdgeWidth: 40,
    }}
  >
    <Drawer.Screen
      name="MainTabs"
      component={MainTabs}
      options={{
        title: 'DomPresta',
        headerShown: false,
        drawerLabel: 'Inicio',
        drawerIcon: ({ color, size }) => (
          <Ionicons name="home-outline" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen
      name="Vendors"
      component={ScreenWithTab(VendorsScreen)}
      options={{
        title: 'Vendedores',
        drawerLabel: 'Vendedores',
        drawerIcon: ({ color, size }) => (
          <Ionicons name="briefcase-outline" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen
      name="LoanRequests"
      component={ScreenWithTab(LoanRequestsScreen)}
      options={{
        title: 'Solicitudes',
        drawerLabel: 'Solicitudes',
        drawerIcon: ({ color, size }) => (
          <Ionicons name="document-text-outline" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen
      name="CashRegister"
      component={ScreenWithTab(CashRegisterScreen)}
      options={{
        title: 'Arqueo de Caja',
        drawerLabel: 'Arqueo',
        drawerIcon: ({ color, size }) => (
          <Ionicons name="calculator-outline" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen
      name="Reports"
      component={ScreenWithTab(ReportsScreen)}
      options={{
        title: 'Reportes',
        drawerLabel: 'Reportes',
        drawerIcon: ({ color, size }) => (
          <Ionicons name="stats-chart-outline" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen
      name="Settings"
      component={ScreenWithTab(SettingsScreen)}
      options={{
        title: 'Configuraciones',
        drawerLabel: 'Ajustes',
        drawerIcon: ({ color, size }) => (
          <Ionicons name="settings-outline" size={size} color={color} />
        ),
      }}
    />
  </Drawer.Navigator>
);

// ─── AppNavigator ─────────────────────────────────────────────────────────────
const AppNavigator = () => {
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

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={screenOptions}
        >
          {/* Auth */}
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />

          {/* Shell principal */}
          <Stack.Screen
            name="MainDrawer"
            component={MainDrawer}
            options={{ headerShown: false }}
          />

          {/* Stack de detalle / formularios */}
          <Stack.Screen
            name="LoanDetails"
            component={LoanDetailsScreen}
            options={{ title: 'Detalle del Préstamo' }}
          />
          <Stack.Screen
            name="LoanForm"
            component={LoanFormScreen}
            options={({ route }) => ({
              title: route.params?.loanId ? 'Editar Préstamo' : 'Nuevo Préstamo',
            })}
          />
          <Stack.Screen
            name="PaymentForm"
            component={PaymentFormScreen}
            options={{ title: 'Registrar Pago' }}
          />
          <Stack.Screen
            name="Reports"
            component={ReportsScreen}
            options={{ title: 'Reportes' }}
          />
          <Stack.Screen
            name="ClientForm"
            component={ClientFormScreen}
            options={({ route }) => ({
              title: route.params?.clientId ? 'Editar Cliente' : 'Nuevo Cliente',
            })}
          />
          <Stack.Screen
            name="VendorForm"
            component={VendorFormScreen}
            options={({ route }) => ({
              title: route.params?.vendorId ? 'Editar Vendedor' : 'Nuevo Vendedor',
            })}
          />
          <Stack.Screen
            name="LoanRequestForm"
            component={LoanRequestFormScreen}
            options={({ route }) => ({
              title: route.params?.requestId ? 'Editar Solicitud' : 'Nueva Solicitud',
            })}
          />
          <Stack.Screen
            name="CashRegister"
            component={CashRegisterScreen}
            options={{ title: 'Arqueo de Caja' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default AppNavigator;

// ─── StyleSheet centralizado ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header back button
  backBtn: {
    marginLeft: DS.space.sm,
    width: 34,
    height: 34,
    borderRadius: DS.radius.pill,
    backgroundColor: DS.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Drawer ──────────────────────────────────────────────────────────────────
  drawerNoise: {
    flex: 1,
  },

  drawerHeader: {
    paddingHorizontal: DS.space.xl,
    paddingTop: DS.space.xl,
    paddingBottom: DS.space.lg,
    alignItems: 'flex-start',
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
  drawerLogoWrap: {
    marginBottom: DS.space.md,
    shadowColor: DS.colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  drawerLogoGrad: {
    width: 52,
    height: 52,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerAppName: {
    fontSize: DS.font.xl,
    fontWeight: DS.weight.black,
    color: DS.colors.white,
    letterSpacing: -0.5,
    marginBottom: DS.space.xs,
  },
  drawerAppSub: {
    fontSize: DS.font.sm,
    fontWeight: DS.weight.medium,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.3,
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
  drawerItemActive: {
    // El gradiente se renderiza con StyleSheet.absoluteFill dentro
  },

  drawerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: DS.radius.sm,
    backgroundColor: 'rgba(167,139,250,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DS.space.md,
  },
  drawerIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  drawerLabel: {
    flex: 1,
    fontSize: DS.font.md,
    fontWeight: DS.weight.medium,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.1,
  },
  drawerLabelActive: {
    color: DS.colors.white,
    fontWeight: DS.weight.bold,
  },

  drawerActiveDot: {
    width: 6,
    height: 6,
    borderRadius: DS.radius.pill,
    backgroundColor: DS.colors.accent,
    marginLeft: DS.space.sm,
  },

  drawerFooter: {
    paddingHorizontal: DS.space.xl,
    paddingTop: DS.space.md,
  },
  drawerFooterText: {
    fontSize: DS.font.xs,
    color: 'rgba(255,255,255,0.3)',
    marginTop: DS.space.md,
    letterSpacing: 0.4,
  },
});