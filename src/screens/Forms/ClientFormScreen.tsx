import React, { useState, useEffect } from 'react';
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

type ClientFormRouteProp = RouteProp<RootStackParamList, 'ClientForm'>;
type ClientFormNavigationProp = StackNavigationProp<RootStackParamList, 'ClientForm'>;

interface ClientFormScreenProps {
  route: ClientFormRouteProp;
  navigation: ClientFormNavigationProp;
}

export const ClientFormScreen: React.FC<ClientFormScreenProps> = ({ route, navigation }) => {
  const { clientId } = route.params || {};
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientId) {
      // TODO: Cargar datos del cliente
      loadClient(clientId);
    }
  }, [clientId]);

  const loadClient = async (id: string) => {
    try {
      // TODO: Implementar carga de cliente
      // const client = await ClientService.getClient(id);
      // setName(client.name);
      // etc.
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el cliente');
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Nombre y email son obligatorios');
      return;
    }

    setLoading(true);
    try {
      if (clientId) {
        // TODO: Actualizar cliente
        // await ClientService.updateClient(clientId, { name, email, phone, address });
        Alert.alert('Éxito', 'Cliente actualizado correctamente');
      } else {
        // TODO: Crear cliente
        // await ClientService.createClient({ name, email, phone, address });
        Alert.alert('Éxito', 'Cliente creado correctamente');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nombre completo"
          editable={!loading}
        />

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+1234567890"
          keyboardType="phone-pad"
          editable={!loading}
        />

        <Text style={styles.label}>Dirección</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={address}
          onChangeText={setAddress}
          placeholder="Dirección completa"
          multiline
          numberOfLines={3}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveText}>
            {loading ? 'Guardando...' : clientId ? 'Actualizar Cliente' : 'Crear Cliente'}
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
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});