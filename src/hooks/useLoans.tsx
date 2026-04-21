import { useState, useCallback } from 'react';
import { loanService, LoanInput } from '../services/loanService';
import { Loan } from '../types';
import { Alert } from 'react-native';

export const useLoans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loanService.getAll();
      setLoans(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los préstamos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createLoan = useCallback(async (loanData: LoanInput) => {
    try {
      const newLoan = await loanService.create(loanData);
      setLoans(prev => [newLoan, ...prev]);
      return newLoan;
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el préstamo');
      throw error;
    }
  }, []);

  const getLoan = useCallback(async (id: string) => {
    try {
      return await loanService.getById(id);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener el préstamo');
      return null;
    }
  }, []);

  const getClientLoans = useCallback(async (clientId: string) => {
    try {
      return await loanService.getByClientId(clientId);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron obtener los préstamos del cliente');
      return [];
    }
  }, []);

  const updateLoan = useCallback(async (id: string, updates: Partial<LoanInput>) => {
    try {
      const updated = await loanService.update(id, updates);
      if (updated) {
        setLoans(prev => prev.map(l => l.id === id ? updated : l));
      }
      return updated;
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el préstamo');
      throw error;
    }
  }, []);

  const deleteLoan = useCallback(async (id: string) => {
    try {
      const success = await loanService.delete(id);
      if (success) {
        setLoans(prev => prev.filter(l => l.id !== id));
      }
      return success;
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el préstamo');
      throw error;
    }
  }, []);

  const getStats = useCallback(async () => {
    try {
      return await loanService.getStats();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron obtener las estadísticas');
      return null;
    }
  }, []);

  return {
    loans,
    loading,
    loadLoans,
    createLoan,
    getLoan,
    getClientLoans,
    updateLoan,
    deleteLoan,
    getStats,
  };
};