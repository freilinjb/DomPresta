import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Loan } from '../../types';
import { LoanService } from '../../services/loanService';
import { LoanCard } from '../../components/loans/LoanCard';
import { COLORS } from '../../constants';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';

type LoansScreenTabProp = BottomTabNavigationProp<MainTabParamList, 'Loans'>;
type LoansScreenStackProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

type LoansScreenNavigationProp = CompositeNavigationProp<
  LoansScreenTabProp,
  LoansScreenStackProp
>;

interface LoansScreenProps {
  navigation: LoansScreenNavigationProp;
}

export const LoansScreen: React.FC<LoansScreenProps> = ({ navigation }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const loanData = await LoanService.getLoans();
      setLoans(loanData);
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoanPress = (loan: Loan) => {
    navigation.navigate('LoanDetails', { loanId: loan.id });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Cargando préstamos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Préstamos</Text>
      </View>

      <FlatList
        data={loans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LoanCard loan={item} onPress={() => handleLoanPress(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay préstamos registrados</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('LoanForm')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    opacity: 0.7,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
  },
});