import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { LoansScreen } from '../screens/Loans/LoansScreen';
import { LoanDetailsScreen } from '../screens/Loans/LoanDetailsScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;