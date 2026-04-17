import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Loan } from '../../types';
import { LoanService } from '../../services/loanService';
import { NotificationService } from '../../services/notificationService';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../constants';
import { RootStackParamList } from '../../navigation/types';

type LoanFormRouteProp = RouteProp<RootStackParamList, 'LoanForm'>;
type LoanFormNavigationProp = StackNavigationProp<RootStackParamList, 'LoanForm'>;

interface LoanFormScreenProps {
  route: LoanFormRouteProp;
  navigation: LoanFormNavigationProp;
}

export const LoanFormScreen: React.FC<LoanFormScreenProps> = ({ route, navigation }) => {
  const { loanId } = route.params || {};
  const isEditing = !!loanId;

  const [borrowerName, setBorrowerName] = useState('');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [term, setTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loan, setLoan] = useState<Loan | null>(null);

  useEffect(() => {
    if (isEditing && loanId) {
      loadLoan();
    }
  }, [loanId]);

  const loadLoan = async () => {
    try {
      const loanData = await LoanService.getLoanDetails(loanId!);
      if (loanData) {
        setLoan(loanData);
        setBorrowerName(loanData.borrowerName);
        setAmount(loanData.amount.toString());
        setInterestRate(loanData.interestRate.toString());
        setTerm(loanData.term.toString());
        setStartDate(loanData.startDate.toISOString().split('T')[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el préstamo');
    }
  };

  const validateForm = (): boolean => {
    if (!borrowerName.trim()) {
      Alert.alert('Error', 'El nombre del prestatario es requerido');
      return false;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'El monto debe ser un número positivo');
      return false;
    }

    const rateNum = parseFloat(interestRate);
    if (isNaN(rateNum) || rateNum < 0) {
      Alert.alert('Error', 'La tasa de interés debe ser un número válido');
      return false;
    }

    const termNum = parseInt(term);
    if (isNaN(termNum) || termNum <= 0) {
      Alert.alert('Error', 'El plazo debe ser un número entero positivo');
      return false;
    }

    if (!startDate) {
      Alert.alert('Error', 'La fecha de inicio es requerida');
      return false;
    }

    return true;
  };

  const calculateEndDate = (start: Date, months: number): Date => {
    const endDate = new Date(start);
    endDate.setMonth(endDate.getMonth() + months);
    return endDate;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const loanData = {
        borrowerName: borrowerName.trim(),
        amount: parseFloat(amount),
        interestRate: parseFloat(interestRate),
        term: parseInt(term),
        startDate: new Date(startDate),
        endDate: calculateEndDate(new Date(startDate), parseInt(term)),
        status: 'active' as const,
      };

      if (isEditing && loan) {
        await LoanService.updateLoan(loan.id, loanData);
        Alert.alert('Éxito', 'Préstamo actualizado correctamente');
      } else {
        const newLoan = await LoanService.createLoan(loanData);

        // Programar recordatorios de pago
        await NotificationService.scheduleLoanDueReminder(newLoan);

        Alert.alert('Éxito', 'Préstamo creado correctamente');
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el préstamo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!loan) return;

    Alert.alert(
      'Eliminar Préstamo',
      '¿Estás seguro de que quieres eliminar este préstamo? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await LoanService.deleteLoan(loan.id);
              Alert.alert('Éxito', 'Préstamo eliminado correctamente');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el préstamo');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditing ? 'Editar Préstamo' : 'Nuevo Préstamo'}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del Prestatario *</Text>
          <TextInput
            style={styles.input}
            value={borrowerName}
            onChangeText={setBorrowerName}
            placeholder="Ingrese el nombre completo"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monto del Préstamo *</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Tasa de Interés (%)</Text>
            <TextInput
              style={styles.input}
              value={interestRate}
              onChangeText={setInterestRate}
              placeholder="10.0"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Plazo (meses)</Text>
            <TextInput
              style={styles.input}
              value={term}
              onChangeText={setTerm}
              placeholder="12"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fecha de Inicio *</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {parseFloat(amount) > 0 && parseFloat(interestRate) > 0 && parseInt(term) > 0 && (
          <View style={styles.calculationCard}>
            <Text style={styles.calculationTitle}>Cálculos del Préstamo</Text>
            <Text style={styles.calculationText}>
              Pago Mensual: ${LoanService.calculateMonthlyPayment(
                parseFloat(amount),
                parseFloat(interestRate),
                parseInt(term)
              ).toFixed(2)}
            </Text>
            <Text style={styles.calculationText}>
              Interés Total: ${LoanService.calculateTotalInterest(
                parseFloat(amount),
                parseFloat(interestRate),
                parseInt(term)
              ).toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title={isEditing ? 'Actualizar Préstamo' : 'Crear Préstamo'}
            onPress={handleSubmit}
            disabled={loading}
          />

          {isEditing && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Eliminar Préstamo</Text>
            </TouchableOpacity>
          )}
        </View>
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  calculationCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  calculationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  calculationText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 20,
  },
  deleteButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});