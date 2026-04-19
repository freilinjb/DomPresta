import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { MainTabParamList } from '../../navigation/types';

type VendorsScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Vendors'>;

interface VendorsScreenProps {
  navigation: VendorsScreenNavigationProp;
}

export const VendorsScreen: React.FC<VendorsScreenProps> = ({ navigation }) => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      // TODO: Implementar carga de vendedores desde databaseService
      const vendorsData: any[] = []; // Placeholder
      setVendors(vendorsData);
    } catch (error) {
      console.error('Error loading vendors:', error);
      Alert.alert('Error', 'No se pudieron cargar los vendedores');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadVendors();
  };

  const handleAddVendor = () => {
    (navigation as any).navigate('VendorForm');
  };

  const renderVendor = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.vendorName}>{item.name}</Text>
        <Text style={styles.vendorEmail}>{item.email}</Text>
      </View>
      <Text style={styles.vendorPhone}>{item.phone}</Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="business-outline" size={64} color={COLORS.text} />
      <Text style={styles.emptyText}>No hay vendedores registrados</Text>
      <Text style={styles.emptySubtext}>Agrega tu primer vendedor</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando vendedores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vendedores</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddVendor}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={vendors}
        renderItem={renderVendor}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={vendors.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  vendorEmail: {
    fontSize: 14,
    color: COLORS.text,
  },
  vendorPhone: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyList: {
    flex: 1,
  },
});