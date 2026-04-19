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

type ClientsScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Clients'>;

interface ClientsScreenProps {
  navigation: ClientsScreenNavigationProp;
}

export const ClientsScreen: React.FC<ClientsScreenProps> = ({ navigation }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadClients();
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.getParent()?.openDrawer()} style={{ marginLeft: 10 }}>
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const loadClients = async () => {
    try {
      // TODO: Implementar carga de clientes desde databaseService
      const clientsData: any[] = []; // Placeholder
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const handleAddClient = () => {
    (navigation as any).navigate('ClientForm');
  };

  const renderClient = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.clientName}>{item.name}</Text>
        <Text style={styles.clientEmail}>{item.email}</Text>
      </View>
      <Text style={styles.clientPhone}>{item.phone}</Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={COLORS.text} />
      <Text style={styles.emptyText}>No hay clientes registrados</Text>
      <Text style={styles.emptySubtext}>Agrega tu primer cliente</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando clientes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddClient}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={clients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={clients.length === 0 ? styles.emptyList : undefined}
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
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  clientEmail: {
    fontSize: 14,
    color: COLORS.text,
  },
  clientPhone: {
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