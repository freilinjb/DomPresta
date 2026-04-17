import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Loan } from '../../types';
import { LoanService } from '../../services/loanService';
import { COLORS, LOAN_STATUSES } from '../../constants';
import { RootStackParamList } from '../../navigation/types';

type LoanDetailsRouteProp = RouteProp<RootStackParamList, 'LoanDetails'>;
type LoanDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'LoanDetails'>;

interface LoanDetailsScreenProps {
  route: LoanDetailsRouteProp;
  navigation: LoanDetailsNavigationProp;
}

export const LoanDetailsScreen: React.FC<LoanDetailsScreenProps> = ({ route, navigation }) => {
  const { loanId } = route.params;
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoanDetails();
  }, [loanId]);

  const loadLoanDetails = async () => {
    try {
      const loanData = await LoanService.getLoanDetails(loanId);
      setLoan(loanData);
    } catch (error) {
      console.error('Error loading loan details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Cargando detalles...</Text>
      </View>
    );
  }

  if (!loan) {
    return (
      <View style={styles.center}>
        <Text>Préstamo no encontrado</Text>
      </View>
    );
  }

  const statusColor = loan.status === 'active' ? COLORS.success :
                     loan.status === 'overdue' ? COLORS.danger : COLORS.warning;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{loan.borrowerName}</Text>
        <Text style={[styles.status, { color: statusColor }]}>
          {LOAN_STATUSES[loan.status]}
        </Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Monto del Préstamo:</Text>
          <Text style={styles.value}>${loan.amount.toLocaleString()}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Tasa de Interés:</Text>
          <Text style={styles.value}>{loan.interestRate}%</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Plazo:</Text>
          <Text style={styles.value}>{loan.term} meses</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Fecha de Inicio:</Text>
          <Text style={styles.value}>{loan.startDate.toLocaleDateString()}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Fecha de Fin:</Text>
          <Text style={styles.value}>{loan.endDate.toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.paymentsContainer}>
        <Text style={styles.sectionTitle}>Pagos</Text>
        {loan.payments.length > 0 ? (
          loan.payments.map(payment => (
            <View key={payment.id} style={styles.paymentItem}>
              <Text style={styles.paymentDate}>{payment.date.toLocaleDateString()}</Text>
              <Text style={styles.paymentAmount}>${payment.amount.toLocaleString()}</Text>
              <Text style={[styles.paymentStatus, { color: payment.status === 'paid' ? COLORS.success : COLORS.danger }]}>
                {payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noPayments}>No hay pagos registrados</Text>
        )}
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
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailsContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    color: COLORS.text,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  paymentsContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentDate: {
    fontSize: 14,
    color: COLORS.text,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  noPayments: {
    fontSize: 16,
    color: COLORS.text,
    opacity: 0.7,
    textAlign: 'center',
  },
});