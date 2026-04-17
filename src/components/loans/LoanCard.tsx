import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Loan } from '../../types';
import { COLORS, LOAN_STATUSES } from '../../constants';

interface LoanCardProps {
  loan: Loan;
  onPress: () => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({ loan, onPress }) => {
  const statusColor = loan.status === 'active' ? COLORS.success :
                     loan.status === 'overdue' ? COLORS.danger : COLORS.warning;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.borrowerName}>{loan.borrowerName}</Text>
        <Text style={[styles.status, { color: statusColor }]}>
          {LOAN_STATUSES[loan.status]}
        </Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.amount}>${loan.amount.toLocaleString()}</Text>
        <Text style={styles.rate}>{loan.interestRate}% interés</Text>
      </View>
      <Text style={styles.term}>{loan.term} meses</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  borrowerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  rate: {
    fontSize: 14,
    color: COLORS.text,
  },
  term: {
    fontSize: 14,
    color: COLORS.text,
  },
});