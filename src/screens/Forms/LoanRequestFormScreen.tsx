import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../../constants';
import { RootStackParamList } from '../../navigation/types';

type LoanRequestFormRouteProp = RouteProp<RootStackParamList, 'LoanRequestForm'>;
type LoanRequestFormNavigationProp = StackNavigationProp<RootStackParamList, 'LoanRequestForm'>;

interface LoanRequestFormScreenProps {
  route: LoanRequestFormRouteProp;
  navigation: LoanRequestFormNavigationProp;
}

export const LoanRequestFormScreen: React.FC<LoanRequestFormScreenProps> = ({ route, navigation }) => {
  const { requestId } = route.params || {};
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!clientName.trim() || !amount.trim() || !purpose.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Monto inválido');
      return;
    }

    setLoading(true);
    try {
      if (requestId) {
        // TODO: Actualizar solicitud
        Alert.alert('Éxito', 'Solicitud actualizada correctamente');
      } else {
        // TODO: Crear solicitud
        Alert.alert('Éxito', 'Solicitud enviada correctamente');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Nombre del Cliente *</Text>
        <TextInput
          style={styles.input}
          value={clientName}
          onChangeText={setClientName}
          placeholder="Nombre completo del cliente"
          editable={!loading}
        />

        <Text style={styles.label}>Monto Solicitado *</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="numeric"
          editable={!loading}
        />

        <Text style={styles.label}>Plazo (meses)</Text>
        <TextInput
          style={styles.input}
          value={term}
          onChangeText={setTerm}
          placeholder="12"
          keyboardType="numeric"
          editable={!loading}
        />

        <Text style={styles.label}>Propósito del Préstamo *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={purpose}
          onChangeText={setPurpose}
          placeholder="Describa el propósito del préstamo"
          multiline
          numberOfLines={4}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? 'Enviando...' : requestId ? 'Actualizar Solicitud' : 'Enviar Solicitud'}
          </Text>
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
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});