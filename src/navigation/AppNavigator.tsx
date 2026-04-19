import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { LoansScreen } from '../screens/Loans/LoansScreen';
import { LoanDetailsScreen } from '../screens/Loans/LoanDetailsScreen';
import { LoanFormScreen } from '../screens/Forms/LoanFormScreen';
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
import { COLORS } from '../constants';
import { RootStackParamList, MainTabParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text,
        tabBarStyle: {
          backgroundColor: 'white',
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: 'white',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio',
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen
        name="Loans"
        component={LoansScreen}
        options={{
          title: 'Préstamos',
          tabBarLabel: 'Préstamos',
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{
          title: 'Clientes',
          tabBarLabel: 'Clientes',
        }}
      />
      <Tab.Screen
        name="Vendors"
        component={VendorsScreen}
        options={{
          title: 'Vendedores',
          tabBarLabel: 'Vendedores',
        }}
      />
      <Tab.Screen
        name="LoanRequests"
        component={LoanRequestsScreen}
        options={{
          title: 'Solicitudes',
          tabBarLabel: 'Solicitudes',
        }}
      />
      <Tab.Screen
        name="CashRegister"
        component={CashRegisterScreen}
        options={{
          title: 'Arqueo',
          tabBarLabel: 'Arqueo',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Configuraciones',
          tabBarLabel: 'Ajustes',
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: 'white',
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
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
            title: route.params?.loanId ? 'Editar Préstamo' : 'Nuevo Préstamo'
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
            title: route.params?.clientId ? 'Editar Cliente' : 'Nuevo Cliente'
          })}
        />
        <Stack.Screen
          name="VendorForm"
          component={VendorFormScreen}
          options={({ route }) => ({
            title: route.params?.vendorId ? 'Editar Vendedor' : 'Nuevo Vendedor'
          })}
        />
        <Stack.Screen
          name="LoanRequestForm"
          component={LoanRequestFormScreen}
          options={({ route }) => ({
            title: route.params?.requestId ? 'Editar Solicitud' : 'Nueva Solicitud'
          })}
        />
        <Stack.Screen
          name="CashRegister"
          component={CashRegisterScreen}
          options={{ title: 'Arqueo de Caja' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;