import React from 'react';
import {
  StatusBar,
  Platform,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Importa tu hook/contexto de auth ────────────────────────
// Ajusta la ruta según tu proyecto
import { useAuth } from '../hooks/useAuth';

import { LoginScreen }         from '../screens/Auth/LoginScreen';
import { HomeScreen }          from '../screens/Home/HomeScreen';
import { LoansScreen }         from '../screens/Loans/LoansScreen';
import { LoanDetailsScreen }   from '../screens/Loans/LoanDetailsScreen';
import LoanFormScreen          from '../screens/Forms/LoanFormScreen';
import { PaymentFormScreen }   from '../screens/Forms/PaymentFormScreen';
import { ClientFormScreen }    from '../screens/Forms/ClientFormScreen';
import { VendorFormScreen }    from '../screens/Forms/VendorFormScreen';
import { LoanRequestFormScreen } from '../screens/Forms/LoanRequestFormScreen';
import { ReportsScreen }       from '../screens/Reports/ReportsScreen';
import { ProfileScreen }       from '../screens/Profile/ProfileScreen';
import { SettingsScreen }      from '../screens/Settings/SettingsScreen';
import { ClientsScreen }       from '../screens/Clients/ClientsScreen';
import { VendorsScreen }       from '../screens/Vendors/VendorsScreen';
import { LoanRequestsScreen }  from '../screens/LoanRequests/LoanRequestsScreen';
import { CashRegisterScreen }  from '../screens/CashRegister/CashRegisterScreen';
import { RootStackParamList, MainTabParamList, DrawerParamList } from './types';
import BottomTabBar   from './BottomTabBar';
import ScreenWithTab  from './ScreenWithTab';

// ─── Design System ────────────────────────────────────────────
const DS = {
  colors: {
    grad0:        '#2e0f5e',
    grad1:        '#4c1d95',
    grad2:        '#5b21b6',
    grad3:        '#6d28d9',
    grad4:        '#7c3aed',
    accent:       '#a78bfa',
    accentSoft:   'rgba(167,139,250,0.15)',
    accentMid:    'rgba(167,139,250,0.28)',
    surface:      '#f5f3ff',
    white:        '#ffffff',
    text:         '#1e1b4b',
    overlayDark:  'rgba(0,0,0,0.50)',
    overlayLight: 'rgba(255,255,255,0.12)',
    overlayMid:   'rgba(255,255,255,0.18)',
    onDim:        'rgba(255,255,255,0.65)',
    onDimmer:     'rgba(255,255,255,0.35)',
    onDimmest:    'rgba(255,255,255,0.22)',
    danger:       'rgba(248,113,113,0.9)',
    dangerBg:     'rgba(248,113,113,0.12)',
    dangerBorder: 'rgba(248,113,113,0.25)',
    online:       '#34d399',
    onlineBorder: '#4c1d95',
  },
  font: { xs: 9, sm: 11, md: 13, base: 15, lg: 17, xl: 20 },
  weight: {
    regular: '400' as const,
    medium:  '600' as const,
    bold:    '700' as const,
    black:   '800' as const,
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 },
};

const GRAD_HEADER = [DS.colors.grad0, DS.colors.grad3] as const;
const GRAD_DRAWER = [DS.colors.grad0, DS.colors.grad1, DS.colors.grad3] as const;
const GRAD_AVATAR = [DS.colors.accent, DS.colors.grad4, DS.colors.grad2] as const;
const GRAD_LOGOUT_TEXT = ['transparent', 'transparent'] as const;

const Stack  = createStackNavigator<RootStackParamList>();
const Tab    = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// ─── screenOptions globales ───────────────────────────────────
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
  headerBackImage: () => (
    <View style={s.backBtn}>
      <Ionicons name="chevron-back" size={20} color={DS.colors.white} />
    </View>
  ),
};

// ─── Config del menú del drawer ───────────────────────────────
interface DrawerMenuItem {
  name:    string;
  label:   string;
  icon:    keyof typeof Ionicons.glyphMap;
  badge?:  number;
}

const DRAWER_MENU: DrawerMenuItem[] = [
  { name: 'MainTabs',    label: 'Inicio',         icon: 'home'              },
  { name: 'Vendors',     label: 'Vendedores',      icon: 'briefcase'         },
  { name: 'LoanRequests',label: 'Solicitudes',     icon: 'document-text',    badge: 5 },
  { name: 'CashRegister',label: 'Arqueo de Caja',  icon: 'wallet'            },
  { name: 'Reports',     label: 'Reportes',        icon: 'stats-chart'       },
  { name: 'Settings',    label: 'Ajustes',         icon: 'settings'          },
];

// ─── Helpers ──────────────────────────────────────────────────

/** Genera iniciales a partir del nombre completo */
const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Formatea un número grande como "284k", "1.2M", etc. */
const formatCompact = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}k`;
  return String(n);
};

// ─── Sección de perfil del drawer ────────────────────────────
interface DrawerUserSectionProps {
  user: {
    name?:        string;
    role?:        string;
    branch?:      string;
    totalLoans?:  number;
    portfolio?:   number;
    collectRate?: number;
  };
  onProfilePress: () => void;
}

const DrawerUserSection: React.FC<DrawerUserSectionProps> = ({ user, onProfilePress }) => {
  const initials      = getInitials(user.name);
  const totalLoans    = user.totalLoans   ?? 0;
  const portfolio     = user.portfolio    ?? 0;
  const collectRate   = user.collectRate  ?? 0;

  return (
    <TouchableOpacity
      onPress={onProfilePress}
      activeOpacity={0.82}
      style={s.userSection}
    >
      {/* Avatar con anillo degradado */}
      <View style={s.avatarWrap}>
        <LinearGradient colors={GRAD_AVATAR} style={s.avatarRing}>
          <View style={s.avatarInner}>
            <Text style={s.avatarInitials}>{initials}</Text>
          </View>
        </LinearGradient>
        {/* Punto en línea */}
        <View style={s.onlineDot} />
      </View>

      {/* Nombre, rol y sucursal */}
      <Text style={s.userName} numberOfLines={1}>{user.name ?? 'Usuario'}</Text>
      <View style={s.userRoleRow}>
        <View style={s.rolePill}>
          <Text style={s.rolePillText}>{user.role ?? 'Usuario'}</Text>
        </View>
        {!!user.branch && (
          <Text style={s.userBranch} numberOfLines={1}>· {user.branch}</Text>
        )}
      </View>

      {/* Tarjeta de métricas rápidas */}
      <View style={s.metricsCard}>
        {[
          { val: String(totalLoans),           lbl: 'PRÉSTAMOS' },
          { val: `${formatCompact(portfolio)}`, lbl: 'CARTERA'   },
          { val: `${collectRate}%`,             lbl: 'COBROS'    },
        ].map(({ val, lbl }, i, arr) => (
          <React.Fragment key={lbl}>
            <View style={s.metricItem}>
              <Text style={s.metricVal}>{val}</Text>
              <Text style={s.metricLbl}>{lbl}</Text>
            </View>
            {i < arr.length - 1 && <View style={s.metricDivider} />}
          </React.Fragment>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ─── Custom Drawer Content ────────────────────────────────────
const CustomDrawerContent = (props: any) => {
  const insets             = useSafeAreaInsets();
  const { state, navigation } = props;

  // Obtiene el usuario autenticado desde tu contexto/hook
  // Si aún no tienes useAuth, sustituye por un objeto estático
  const { user, logout } = useAuth();

  const focusedRouteName: string =
    state.routes[state.index]?.name ?? '';

  const handleLogout = async () => {
    await logout?.();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <LinearGradient
      colors={GRAD_DRAWER}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.25, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Orbes decorativos de fondo */}
      <View style={s.orb1} />
      <View style={s.orb2} />
      {/* Línea de brillo lateral derecha */}
      <View style={s.drawerRightShine} />

      <View style={[s.drawerInner, { paddingTop: insets.top + DS.space.sm }]}>

        {/* ── Perfil del usuario ── */}
        <DrawerUserSection
          user={{
            name:        user?.name        ?? user?.full_name,
            role:        user?.role        ?? user?.role_name,
            branch:      user?.branch      ?? user?.branch_name,
            totalLoans:  user?.total_loans ?? user?.totalLoans,
            portfolio:   user?.portfolio   ?? user?.portfolioAmount,
            collectRate: user?.collect_rate ?? user?.collectRate,
          }}
          onProfilePress={() => {
            navigation.navigate('MainTabs', { screen: 'Profile' });
            navigation.closeDrawer();
          }}
        />

        {/* Separador */}
        <View style={s.drawerSep} />

        {/* ── Menú ── */}
        <Text style={s.sectionLabel}>MENÚ PRINCIPAL</Text>

        <DrawerContentScrollView
          {...props}
          scrollEnabled={false}
          contentContainerStyle={s.menuList}
        >
          {DRAWER_MENU.map((item) => {
            const focused = focusedRouteName === item.name ||
              (item.name === 'MainTabs' && focusedRouteName === '');

            return (
              <TouchableOpacity
                key={item.name}
                activeOpacity={0.75}
                style={[s.menuItem, focused && s.menuItemActive]}
                onPress={() => {
                  if (item.name === 'MainTabs') {
                    navigation.navigate('MainTabs');
                  } else {
                    navigation.navigate(item.name);
                  }
                }}
              >
                {/* Barra lateral izquierda en ítem activo */}
                {focused && <View style={s.activeBar} />}

                {/* Ícono */}
                <View style={[s.menuIconWrap, focused ? s.menuIconActive : s.menuIconNormal]}>
                  <Ionicons
                    name={focused ? item.icon : (`${item.icon}-outline` as any)}
                    size={19}
                    color={focused ? DS.colors.white : DS.colors.accent}
                  />
                </View>

                {/* Label */}
                <Text style={[s.menuLabel, focused && s.menuLabelActive]}>
                  {item.label}
                </Text>

                {/* Badge */}
                {!!item.badge && item.badge > 0 && (
                  <View style={s.menuBadge}>
                    <Text style={s.menuBadgeText}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </Text>
                  </View>
                )}

                {/* Flecha si activo */}
                {focused && (
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color="rgba(255,255,255,0.5)"
                    style={{ marginLeft: DS.space.xs }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </DrawerContentScrollView>

        {/* ── Footer ── */}
        <View style={[s.drawerFooter, { paddingBottom: insets.bottom + DS.space.md }]}>
          <View style={s.drawerSep} />

          <TouchableOpacity
            style={s.logoutBtn}
            activeOpacity={0.78}
            onPress={handleLogout}
          >
            <View style={s.logoutIconWrap}>
              <Ionicons name="log-out-outline" size={18} color={DS.colors.danger} />
            </View>
            <Text style={s.logoutLabel}>Cerrar sesión</Text>
          </TouchableOpacity>

          <Text style={s.versionText}>v1.0.0  ·  DomPresta®  ·  2025</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

// ─── MainTabs ─────────────────────────────────────────────────
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

// ─── MainDrawer ───────────────────────────────────────────────
const MainDrawer = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{
      ...screenOptions,
      drawerStyle: {
        backgroundColor: 'transparent',
        width: 290,
      },
      drawerType:       'front',
      overlayColor:     DS.colors.overlayDark,
      swipeEdgeWidth:   44,
    }}
  >
    <Drawer.Screen
      name="MainTabs"
      component={MainTabs}
      options={{ headerShown: false, title: 'DomPresta' }}
    />
    <Drawer.Screen
      name="Vendors"
      component={ScreenWithTab(VendorsScreen)}
      options={{ title: 'Vendedores' }}
    />
    <Drawer.Screen
      name="LoanRequests"
      component={ScreenWithTab(LoanRequestsScreen)}
      options={{ title: 'Solicitudes' }}
    />
    <Drawer.Screen
      name="CashRegister"
      component={ScreenWithTab(CashRegisterScreen)}
      options={{ title: 'Arqueo de Caja' }}
    />
    <Drawer.Screen
      name="Reports"
      component={ScreenWithTab(ReportsScreen)}
      options={{ title: 'Reportes' }}
    />
    <Drawer.Screen
      name="Settings"
      component={ScreenWithTab(SettingsScreen)}
      options={{ title: 'Configuraciones' }}
    />
  </Drawer.Navigator>
);

// ─── AppNavigator ─────────────────────────────────────────────
const AppNavigator = () => {
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: DS.colors.surface,
      primary:    DS.colors.grad3,
      card:       DS.colors.grad2,
      text:       DS.colors.white,
      border:     'transparent',
    },
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator initialRouteName="Login" screenOptions={screenOptions}>

          <Stack.Screen name="Login"      component={LoginScreen}         options={{ headerShown: false }} />
          <Stack.Screen name="MainDrawer" component={MainDrawer}          options={{ headerShown: false }} />
          <Stack.Screen name="LoanDetails"component={LoanDetailsScreen}   options={{ title: 'Detalle del Préstamo' }} />
          <Stack.Screen
            name="LoanForm"
            component={LoanFormScreen}
            options={({ route }) => ({
              title: route.params?.loanId ? 'Editar Préstamo' : 'Nuevo Préstamo',
            })}
          />
          <Stack.Screen name="PaymentForm"     component={PaymentFormScreen}     options={{ title: 'Registrar Pago' }} />
          <Stack.Screen name="Reports"         component={ReportsScreen}         options={{ title: 'Reportes' }} />
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
          <Stack.Screen name="CashRegister" component={CashRegisterScreen} options={{ title: 'Arqueo de Caja' }} />

        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default AppNavigator;

// ─── StyleSheet ───────────────────────────────────────────────
const s = StyleSheet.create({

  // ── Header back button
  backBtn: {
    marginLeft: DS.space.sm,
    width: 34,
    height: 34,
    borderRadius: DS.radius.pill,
    backgroundColor: DS.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Drawer shell
  drawerInner: {
    flex: 1,
  },
  drawerRightShine: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    zIndex: 10,
  },
  orb1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(167,139,250,0.13)',
    top: -60,
    right: -70,
  },
  orb2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(76,29,149,0.35)',
    bottom: 60,
    left: -55,
  },

  // ── User section
  userSection: {
    paddingHorizontal: DS.space.xl,
    paddingTop: DS.space.md,
    paddingBottom: DS.space.lg,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: DS.space.md,
    alignSelf: 'flex-start',
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    shadowColor: DS.colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 33,
    backgroundColor: DS.colors.grad1,
    borderWidth: 2,
    borderColor: DS.colors.grad0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: DS.font.lg,
    fontWeight: DS.weight.black,
    color: DS.colors.white,
    letterSpacing: -1,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 15,
    height: 15,
    borderRadius: DS.radius.pill,
    backgroundColor: DS.colors.online,
    borderWidth: 2.5,
    borderColor: DS.colors.onlineBorder,
  },

  userName: {
    fontSize: DS.font.lg,
    fontWeight: DS.weight.black,
    color: DS.colors.white,
    letterSpacing: -0.4,
    marginBottom: DS.space.xs,
  },
  userRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.sm,
    marginBottom: DS.space.md,
  },
  rolePill: {
    backgroundColor: DS.colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    paddingHorizontal: DS.space.sm,
    paddingVertical: 3,
    borderRadius: DS.radius.pill,
  },
  rolePillText: {
    fontSize: DS.font.sm,
    fontWeight: DS.weight.bold,
    color: DS.colors.accent,
    letterSpacing: 0.2,
  },
  userBranch: {
    fontSize: DS.font.sm,
    color: DS.colors.onDim,
    fontWeight: DS.weight.medium,
    flexShrink: 1,
  },

  // Tarjeta de métricas
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: DS.radius.lg,
    overflow: 'hidden',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DS.space.md,
  },
  metricVal: {
    fontSize: DS.font.base,
    fontWeight: DS.weight.black,
    color: DS.colors.white,
    letterSpacing: -0.5,
  },
  metricLbl: {
    fontSize: DS.font.xs,
    fontWeight: DS.weight.bold,
    color: DS.colors.onDimmer,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    marginVertical: DS.space.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  // ── Separador
  drawerSep: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginHorizontal: DS.space.xl,
    marginVertical: DS.space.sm,
  },

  // ── Section label
  sectionLabel: {
    fontSize: DS.font.xs,
    fontWeight: DS.weight.black,
    color: DS.colors.onDimmest,
    letterSpacing: 1.2,
    paddingHorizontal: DS.space.xl,
    paddingBottom: DS.space.sm,
  },

  // ── Menu
  menuList: {
    paddingHorizontal: DS.space.md,
    paddingTop: DS.space.xs,
    paddingBottom: DS.space.sm,
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DS.space.md,
    paddingVertical: DS.space.md,
    borderRadius: DS.radius.lg,
    marginBottom: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  menuItemActive: {
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 3,
    borderRadius: 3,
    backgroundColor: DS.colors.accent,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DS.space.md,
  },
  menuIconNormal: {
    backgroundColor: DS.colors.accentSoft,
  },
  menuIconActive: {
    backgroundColor: DS.colors.accentMid,
  },
  menuLabel: {
    flex: 1,
    fontSize: DS.font.base,
    fontWeight: DS.weight.medium,
    color: DS.colors.onDim,
    letterSpacing: 0.1,
  },
  menuLabelActive: {
    color: DS.colors.white,
    fontWeight: DS.weight.black,
  },
  menuBadge: {
    backgroundColor: 'rgba(248,113,113,0.88)',
    borderRadius: DS.radius.pill,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: DS.space.sm,
  },
  menuBadgeText: {
    color: DS.colors.white,
    fontSize: DS.font.xs,
    fontWeight: DS.weight.black,
    lineHeight: 13,
  },

  // ── Footer
  drawerFooter: {
    paddingHorizontal: DS.space.xl,
    paddingTop: DS.space.sm,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.md,
    backgroundColor: DS.colors.dangerBg,
    borderWidth: 1,
    borderColor: DS.colors.dangerBorder,
    borderRadius: DS.radius.lg,
    paddingHorizontal: DS.space.md,
    paddingVertical: DS.space.md,
    marginTop: DS.space.md,
  },
  logoutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: DS.radius.sm,
    backgroundColor: 'rgba(248,113,113,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: {
    fontSize: DS.font.md,
    fontWeight: DS.weight.bold,
    color: DS.colors.danger,
    flex: 1,
  },
  versionText: {
    fontSize: DS.font.xs,
    color: DS.colors.onDimmest,
    textAlign: 'center',
    marginTop: DS.space.md,
    letterSpacing: 0.4,
  },
});