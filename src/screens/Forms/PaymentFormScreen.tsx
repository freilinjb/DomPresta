import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Payment } from '../../types';
import { LoanService } from '../../services/loanService';
import { DatabaseService } from '../../services/databaseService';
import { Button } from '../../components/common/Button';
import { COLORS, PAYMENT_STATUSES } from '../../constants';
import { RootStackParamList } from '../../navigation/types';

type PaymentFormRouteProp = RouteProp<RootStackParamList, 'PaymentForm'>;
type PaymentFormNavigationProp = StackNavigationProp<RootStackParamList, 'PaymentForm'>;

interface PaymentFormScreenProps {
  route: PaymentFormRouteProp;
  navigation: PaymentFormNavigationProp;
}

export const PaymentFormScreen: React.FC<PaymentFormScreenProps> = ({ route, navigation }) => {
  const { loanId } = route.params;
  const [loan, setLoan] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLoanAndPayments();
  }, [loanId]);

  const loadLoanAndPayments = async () => {
    try {
      const loanData = await DatabaseService.getLoanById(loanId);
      if (loanData) {
        setLoan(loanData);
        setPayments(loanData.payments);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la información del préstamo');
    }
  };

  const handleAddPayment = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Ingrese un monto válido');
      return;
    }

    if (!date) {
      Alert.alert('Error', 'Seleccione una fecha');
      return;
    }

    setLoading(true);
    try {
      await LoanService.createPayment({
        loanId,
        amount: amountNum,
        date: new Date(date),
        status: 'paid'
      });

      Alert.alert('Éxito', 'Pago registrado correctamente');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      loadLoanAndPayments(); // Recargar datos
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentId: string, newStatus: 'paid' | 'pending' | 'overdue') => {
    try {
      await DatabaseService.updatePayment(paymentId, { status: newStatus });
      loadLoanAndPayments(); // Recargar datos
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado del pago');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return COLORS.success;
      case 'overdue': return COLORS.danger;
      default: return COLORS.warning;
    }
  };

  if (!loan) {
    return (
      <View style={styles.center}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registrar Pago</Text>
        <Text style={styles.subtitle}>{loan.borrowerName}</Text>
      </View>

      <View style={styles.loanInfo}>
        <Text style={styles.infoText}>Monto del Préstamo: ${loan.amount.toLocaleString()}</Text>
        <Text style={styles.infoText}>Saldo Pendiente: ${(
          loan.amount - payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
        ).toLocaleString()}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monto del Pago *</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fecha del Pago *</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <Button
          title="Registrar Pago"
          onPress={handleAddPayment}
          disabled={loading}
        />
      </View>

      <View style={styles.paymentsSection}>
        <Text style={styles.sectionTitle}>Historial de Pagos</Text>

        {payments.length > 0 ? (
          <FlatList
            data={payments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDate}>
                    {item.date.toLocaleDateString()}
                  </Text>
                  <Text style={styles.paymentAmount}>
                    ${item.amount.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.statusContainer}>
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: getStatusColor(item.status) }]}
                    onPress={() => {
                      const nextStatus = item.status === 'paid' ? 'pending' :
                                       item.status === 'pending' ? 'overdue' : 'paid';
                      handleUpdatePaymentStatus(item.id, nextStatus);
                    }}
                  >
                    <Text style={styles.statusText}>
                      {PAYMENT_STATUSES[item.status]}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            scrollEnabled={false}
          />
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
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    opacity: 0.7,
    marginTop: 4,
  },
  loanInfo: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  form: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.background,
  },
  paymentsSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDate: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.7,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  statusContainer: {
    flex: 0.4,
  },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  noPayments: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.text,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});