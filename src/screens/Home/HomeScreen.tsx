import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Loan } from '../../types';
import { LoanService } from '../../services/loanService';
import { COLORS } from '../../constants';
import { MainTabParamList } from '../../navigation/types';

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
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

  const activeLoans = loans.filter(loan => loan.status === 'active');
  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Resumen de Préstamos</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{loans.length}</Text>
          <Text style={styles.statLabel}>Total Préstamos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeLoans.length}</Text>
          <Text style={styles.statLabel}>Préstamos Activos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>${totalAmount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Monto Total</Text>
        </View>
      </View>

      <View style={styles.recentLoans}>
        <Text style={styles.sectionTitle}>Préstamos Recientes</Text>
        {loans.slice(0, 3).map(loan => (
          <View key={loan.id} style={styles.loanItem}>
            <Text style={styles.loanName}>{loan.borrowerName}</Text>
            <Text style={styles.loanAmount}>${loan.amount.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    opacity: 0.7,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 4,
  },
  recentLoans: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  loanItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  loanName: {
    fontSize: 16,
    color: COLORS.text,
  },
  loanAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});