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
import { LoanService } from '../../services/loanService';
import { LoanCard } from '../../components/loans/LoanCard';
import { Loan } from '../../types';
import { COLORS } from '../../constants';
import { MainTabParamList } from '../../navigation/types';

type LoansScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Loans'>;

interface LoansScreenProps {
  navigation: LoansScreenNavigationProp;
}

export const LoansScreen: React.FC<LoansScreenProps> = ({ navigation }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const loansData = await LoanService.getLoans();
      setLoans(loansData);
    } catch (error) {
      console.error('Error loading loans:', error);
      Alert.alert('Error', 'No se pudieron cargar los préstamos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLoans();
  };

  const handleLoanPress = (loan: Loan) => {
    (navigation as any).navigate('LoanDetails', { loanId: loan.id });
  };

  const handleAddLoan = () => {
    (navigation as any).navigate('LoanForm');
  };

  const renderLoan = ({ item }: { item: Loan }) => (
    <LoanCard loan={item} onPress={() => handleLoanPress(item)} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={COLORS.text} />
      <Text style={styles.emptyText}>No hay préstamos registrados</Text>
      <Text style={styles.emptySubtext}>Agrega tu primer préstamo</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando préstamos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Préstamos</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddLoan}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={loans}
        renderItem={renderLoan}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={loans.length === 0 ? styles.emptyList : undefined}
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