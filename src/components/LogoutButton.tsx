import React from 'react';
import { TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../services/authService';

export const LogoutButton: React.FC = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={styles.button}>
      <Ionicons name="log-out-outline" size={24} color="#dc2626" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});