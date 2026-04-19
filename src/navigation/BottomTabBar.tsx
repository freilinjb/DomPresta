import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../constants';

const BottomTabBar = () => {
  const navigation = useNavigation();

  const navigateToTab = (screenName: string) => {
    // Navigate to MainTabs and then to the specific screen
    navigation.navigate('MainTabs' as never, { screen: screenName } as never);
  };

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigateToTab('Home')}
      >
        <Ionicons name="home-outline" size={24} color={COLORS.text} />
        <Text style={styles.tabLabel}>Inicio</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigateToTab('Loans')}
      >
        <Ionicons name="cash-outline" size={24} color={COLORS.text} />
        <Text style={styles.tabLabel}>Préstamos</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigateToTab('Clients')}
      >
        <Ionicons name="people-outline" size={24} color={COLORS.text} />
        <Text style={styles.tabLabel}>Clientes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigateToTab('Profile')}
      >
        <Ionicons name="person-outline" size={24} color={COLORS.text} />
        <Text style={styles.tabLabel}>Perfil</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 20,
    marginHorizontal: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  tabLabel: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 2,
  },
});

export default BottomTabBar;