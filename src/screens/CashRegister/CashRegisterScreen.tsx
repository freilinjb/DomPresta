import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { MainTabParamList } from '../../navigation/types';

type CashRegisterScreenNavigationProp = StackNavigationProp<MainTabParamList, 'CashRegister'>;

interface CashRegisterScreenProps {
  navigation: CashRegisterScreenNavigationProp;
}

export const CashRegisterScreen: React.FC<CashRegisterScreenProps> = ({ navigation }) => {
  const [cashData, setCashData] = useState({
    initialCash: 0,
    totalIncome: 0,
    totalExpenses: 0,
    currentCash: 0,
    transactions: [],
  });

  useEffect(() => {
    loadCashData();
  }, []);

  const loadCashData = async () => {
    try {
      // TODO: Implementar carga de datos de arqueo desde databaseService
      const data = {
        initialCash: 1000,
        totalIncome: 5000,
        totalExpenses: 2000,
        currentCash: 4000,
        transactions: [],
      };
      setCashData(data);
    } catch (error) {
      console.error('Error loading cash data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de arqueo');
    }
  };

  const handleCloseRegister = () => {
    Alert.alert(
      'Cerrar Arqueo',
      '¿Estás seguro de que quieres cerrar el arqueo del día?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => {
          // TODO: Implementar cierre de arqueo
          Alert.alert('Éxito', 'Arqueo cerrado correctamente');
        }},
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Arqueo de Caja</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Efectivo Inicial</Text>
          <Text style={styles.summaryValue}>${cashData.initialCash.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Ingresos Totales</Text>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>${cashData.totalIncome.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Egresos Totales</Text>
          <Text style={[styles.summaryValue, { color: COLORS.danger }]}>${cashData.totalExpenses.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Efectivo Actual</Text>
          <Text style={[styles.summaryValue, { color: COLORS.primary, fontSize: 24 }]}>${cashData.currentCash.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.transactions}>
        <Text style={styles.sectionTitle}>Transacciones del Día</Text>
        {cashData.transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={64} color={COLORS.text} />
            <Text style={styles.emptyText}>No hay transacciones registradas</Text>
          </View>
        ) : (
          // TODO: Renderizar lista de transacciones
          <Text>Lista de transacciones aquí</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Info', 'Funcionalidad no implementada')}>
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text style={styles.actionText}>Agregar Movimiento</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.closeButton]} onPress={handleCloseRegister}>
          <Ionicons name="lock-closed-outline" size={24} color="white" />
          <Text style={styles.actionText}>Cerrar Arqueo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
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
  date: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
  },
  summary: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  transactions: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 16,
    textAlign: 'center',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  closeButton: {
    backgroundColor: COLORS.danger,
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});