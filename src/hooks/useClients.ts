import { useState, useEffect, useCallback } from 'react';
import { clientService } from '../services/clientService';
import { Client } from '../types';
import { Alert } from 'react-native';
import { initDatabase } from '../database/db';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar DB y cargar datos
  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Inicializar base de datos
      await initDatabase();
      
      // Cargar clientes
      const data = await clientService.getAll();
      setClients(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar clientes';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener un cliente por ID
  const getClient = useCallback(async (id: string): Promise<Client | null> => {
    try {
      // Primero buscar en el estado local
      const localClient = clients.find(c => c.id === id);
      if (localClient) return localClient;
      
      // Si no está en el estado, buscar en la base de datos
      const client = await clientService.getById(id);
      
      // Si se encuentra, actualizar el estado local
      if (client) {
        setClients(prev => {
          const exists = prev.some(c => c.id === client.id);
          if (!exists) {
            return [...prev, client];
          }
          return prev.map(c => c.id === client.id ? client : c);
        });
      }
      
      return client;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener cliente';
      console.error('Error en getClient:', message);
      return null;
    }
  }, [clients]);

  // Crear cliente
  const createClient = useCallback(async (clientData: any) => {
    try {
      const newClient = await clientService.create(clientData);
      setClients(prev => [newClient, ...prev]);
      return newClient;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear cliente';
      Alert.alert('Error', message);
      throw err;
    }
  }, []);

  // Actualizar cliente
  const updateClient = useCallback(async (id: string, updates: any) => {
    try {
      const updated = await clientService.update(id, updates);
      if (updated) {
        setClients(prev => prev.map(c => c.id === id ? updated : c));
      }
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar cliente';
      Alert.alert('Error', message);
      throw err;
    }
  }, []);

  // Eliminar cliente
  const deleteClient = useCallback(async (id: string) => {
    try {
      const success = await clientService.delete(id);
      if (success) {
        setClients(prev => prev.filter(c => c.id !== id));
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar cliente';
      Alert.alert('Error', message);
      throw err;
    }
  }, []);

  // Buscar clientes
  const searchClients = useCallback(async (query: string) => {
    try {
      return await clientService.search(query);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al buscar clientes';
      Alert.alert('Error', message);
      throw err;
    }
  }, []);

  // Obtener estadísticas
  const getStats = useCallback(async () => {
    try {
      return await clientService.getStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener estadísticas';
      Alert.alert('Error', message);
      throw err;
    }
  }, []);

  // Cargar datos mock iniciales
  const loadMockData = useCallback(async (mockClients: any[]) => {
    try {
      setLoading(true);
      await initDatabase();
      await clientService.clearAll();
      
      const clientsWithTimestamps = mockClients.map(client => ({
        ...client,
        createdAt: client.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      await clientService.bulkInsert(clientsWithTimestamps);
      await loadClients();
      
      Alert.alert('Éxito', `${mockClients.length} clientes cargados correctamente`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar datos mock';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, [loadClients]);

  // Refrescar un cliente específico
  const refreshClient = useCallback(async (id: string) => {
    try {
      const client = await clientService.getById(id);
      if (client) {
        setClients(prev => prev.map(c => c.id === id ? client : c));
      }
      return client;
    } catch (err) {
      console.error('Error al refrescar cliente:', err);
      return null;
    }
  }, []);

  // Obtener múltiples clientes por IDs
  const getClientsByIds = useCallback(async (ids: string[]): Promise<Client[]> => {
    try {
      const promises = ids.map(id => clientService.getById(id));
      const results = await Promise.all(promises);
      return results.filter((c): c is Client => c !== null);
    } catch (err) {
      console.error('Error al obtener clientes por IDs:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  return {
    clients,
    loading,
    error,
    loadClients,
    getClient,        // ← Función para obtener un cliente por ID
    getClientsByIds,  // ← Función para obtener múltiples clientes
    refreshClient,    // ← Función para refrescar un cliente específico
    createClient,
    updateClient,
    deleteClient,
    searchClients,
    getStats,
    loadMockData,
  };
};