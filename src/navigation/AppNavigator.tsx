import React from 'react';
import { StatusBar, Platform, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

// ─── Theme igual que HomeScreen ──────────────────────────────────
const C = {
  primary: '#5b21b6',
  primary2: '#7c3aed',
  primary3: '#a78bfa',
  primary4: '#ddd6fe',
  primary5: '#f5f3ff',
  white: '#ffffff',
  text: '#1e1b4b',
  textMuted: '#94a3b8',
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// ─── Header personalizado con gradiente ──────────────────────────
const screenOptions = {
  headerBackground: () => (
    <LinearGradient
      colors={[C.primary, '#6d28d9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ flex: 1 }}
    />
  ),
  headerTintColor: C.white,
  headerTitleStyle: {
    fontWeight: '800' as const,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

// ─── Drawer Content con glassmorphismo ──────────────────────────
const CustomDrawerContent = (props: any) => {
  return (
    <BlurView intensity={95} tint="light" style={{ flex: 1 }}>
      <LinearGradient
        colors={[C.primary, '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)' }}>
          <DrawerContentScrollView
            {...props}
            contentContainerStyle={{ paddingTop: 60 }}
          >
            <DrawerItemList
              {...props}
              activeTintColor={C.white}
              inactiveTintColor="rgba(255,255,255,0.7)"
              activeBackgroundColor="rgba(255,255,255,0.2)"
              labelStyle={{
                fontSize: 15,
                fontWeight: '700',
                marginLeft: -16,
              }}
            />
          </DrawerContentScrollView>
        </View>
      </LinearGradient>
    </BlurView>
  );
};

// ─── MainTabs con BottomTabBar glassmorphismo ───────────────────
const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Loans" component={LoansScreen} />
      <Tab.Screen name="Clients" component={ClientsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// ─── MainDrawer ─────────────────────────────────────────────────
const MainDrawer = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
       ...screenOptions,
        drawerStyle: {
          backgroundColor: 'transparent',
        },
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.5)',
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={MainTabs}
        options={{
          title: 'DomPresta',
          drawerLabel: 'Inicio',
          headerShown: false,
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
};

// ─── AppNavigator ───────────────────────────────────────────────
const AppNavigator = () => {
  const MyTheme = {
   ...DefaultTheme,
    colors: {
     ...DefaultTheme.colors,
      background: C.primary5,
    },
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <NavigationContainer theme={MyTheme}>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={screenOptions}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MainDrawer"
            component={MainDrawer}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LoanDetails"
            component={LoanDetailsScreen}
            options={{ title: 'Detalles del Préstamo' }}
          />
          <Stack.Screen
            name="LoanForm"
            component={LoanFormScreen}
            options={({ route }) => ({
              title: route.params?.loanId? 'Editar Préstamo' : 'Nuevo Préstamo',
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
              title: route.params?.clientId? 'Editar Cliente' : 'Nuevo Cliente',
            })}
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