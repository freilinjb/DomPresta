import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { COLORS } from '../../constants';
import { MainTabParamList } from '../../navigation/types';

type SettingsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Settings'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuraciones</Text>
      </View>

      <View style={styles.settingsContainer}>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Notificaciones</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#767577', true: COLORS.primary }}
            thumbColor={notifications ? 'white' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Modo Oscuro</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#767577', true: COLORS.primary }}
            thumbColor={darkMode ? 'white' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Idioma</Text>
          <Text style={styles.settingValue}>Español</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Moneda</Text>
          <Text style={styles.settingValue}>USD</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Versión de la App</Text>
          <Text style={styles.settingValue}>1.0.0</Text>
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
  settingsContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: {
    fontSize: 16,
    color: COLORS.text,
  },
  settingValue: {
    fontSize: 16,
    color: COLORS.text,
    opacity: 0.7,
  },
});