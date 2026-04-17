import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../../constants';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';

type ProfileScreenTabProp = BottomTabNavigationProp<MainTabParamList, 'Profile'>;
type ProfileScreenStackProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

type ProfileScreenNavigationProp = CompositeNavigationProp<
  ProfileScreenTabProp,
  ProfileScreenStackProp
>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const handleLogout = () => {
    // Mock logout - replace with actual logout logic
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <View style={styles.profileContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>U</Text>
        </View>
        <Text style={styles.name}>Usuario Administrador</Text>
        <Text style={styles.email}>admin@dompresta.com</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Cambiar Contraseña</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Configuraciones</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logout]} onPress={handleLogout}>
          <Text style={[styles.menuText, styles.logoutText]}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profileContainer: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    margin: 16,
    borderRadius: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: COLORS.text,
    opacity: 0.7,
  },
  menuContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    fontSize: 16,
    color: COLORS.text,
  },
  logout: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: COLORS.danger,
  },
});