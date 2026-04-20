// services/database.ts
import * as SQLite from 'expo-sqlite';
import { Alert } from 'react-native';

// Abrir o crear la base de datos
const db = SQLite.openDatabaseSync('clientes.db');

export interface Client {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  documentType: string;
  documentNumber: string;
  monthlyIncome: string;
  occupation: string;
  employer: string;
  yearsEmployed: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  reference1Name: string;
  reference1Phone: string;
  reference1Relationship: string;
  reference2Name: string;
  reference2Phone: string;
  reference2Relationship: string;
  preferredContact: string;
  receiveNotifications: boolean;
  receivePromotions: boolean;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export class DatabaseService {
  // Inicializar la base de datos
  static async initDatabase(): Promise<void> {
    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          phone TEXT NOT NULL,
          secondaryPhone TEXT,
          documentType TEXT NOT NULL,
          documentNumber TEXT NOT NULL UNIQUE,
          monthlyIncome TEXT,
          occupation TEXT,
          employer TEXT,
          yearsEmployed TEXT,
          address TEXT,
          city TEXT,
          province TEXT,
          postalCode TEXT,
          reference1Name TEXT,
          reference1Phone TEXT,
          reference1Relationship TEXT,
          reference2Name TEXT,
          reference2Phone TEXT,
          reference2Relationship TEXT,
          preferredContact TEXT,
          receiveNotifications INTEGER DEFAULT 1,
          receivePromotions INTEGER DEFAULT 0,
          notes TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
        CREATE INDEX IF NOT EXISTS idx_clients_documentNumber ON clients(documentNumber);
        CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
      `);
      
      console.log('Base de datos inicializada correctamente');
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      Alert.alert('Error', 'No se pudo inicializar la base de datos');
    }
  }

  // Insertar nuevo cliente
  static async insertClient(client: Client): Promise<number> {
    try {
      const result = await db.runAsync(
        `INSERT INTO clients (
          firstName, lastName, email, phone, secondaryPhone,
          documentType, documentNumber, monthlyIncome, occupation,
          employer, yearsEmployed, address, city, province,
          postalCode, reference1Name, reference1Phone, reference1Relationship,
          reference2Name, reference2Phone, reference2Relationship,
          preferredContact, receiveNotifications, receivePromotions, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          client.firstName, client.lastName, client.email, client.phone,
          client.secondaryPhone, client.documentType, client.documentNumber,
          client.monthlyIncome, client.occupation, client.employer,
          client.yearsEmployed, client.address, client.city, client.province,
          client.postalCode, client.reference1Name, client.reference1Phone,
          client.reference1Relationship, client.reference2Name,
          client.reference2Phone, client.reference2Relationship,
          client.preferredContact, client.receiveNotifications ? 1 : 0,
          client.receivePromotions ? 1 : 0, client.notes
        ]
      );
      
      return result.lastInsertRowId;
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        Alert.alert('Error', 'Ya existe un cliente con este email o número de documento');
      } else {
        Alert.alert('Error', 'No se pudo guardar el cliente');
      }
      throw error;
    }
  }

  // Actualizar cliente existente
  static async updateClient(id: number, client: Client): Promise<void> {
    try {
      await db.runAsync(
        `UPDATE clients SET
          firstName = ?, lastName = ?, email = ?, phone = ?, secondaryPhone = ?,
          documentType = ?, documentNumber = ?, monthlyIncome = ?, occupation = ?,
          employer = ?, yearsEmployed = ?, address = ?, city = ?, province = ?,
          postalCode = ?, reference1Name = ?, reference1Phone = ?,
          reference1Relationship = ?, reference2Name = ?, reference2Phone = ?,
          reference2Relationship = ?, preferredContact = ?, receiveNotifications = ?,
          receivePromotions = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          client.firstName, client.lastName, client.email, client.phone,
          client.secondaryPhone, client.documentType, client.documentNumber,
          client.monthlyIncome, client.occupation, client.employer,
          client.yearsEmployed, client.address, client.city, client.province,
          client.postalCode, client.reference1Name, client.reference1Phone,
          client.reference1Relationship, client.reference2Name,
          client.reference2Phone, client.reference2Relationship,
          client.preferredContact, client.receiveNotifications ? 1 : 0,
          client.receivePromotions ? 1 : 0, client.notes, id
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el cliente');
      throw error;
    }
  }

  // Obtener cliente por ID
  static async getClientById(id: number): Promise<Client | null> {
    try {
      const result = await db.getFirstAsync<Client & { receiveNotifications: number; receivePromotions: number }>(
        'SELECT * FROM clients WHERE id = ?',
        [id]
      );
      
      if (result) {
        return {
          ...result,
          receiveNotifications: result.receiveNotifications === 1,
          receivePromotions: result.receivePromotions === 1,
        };
      }
      return null;
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      return null;
    }
  }

  // Obtener todos los clientes
  static async getAllClients(): Promise<Client[]> {
    try {
      const results = await db.getAllAsync<Client & { receiveNotifications: number; receivePromotions: number }>(
        'SELECT * FROM clients ORDER BY createdAt DESC'
      );
      
      return results.map(client => ({
        ...client,
        receiveNotifications: client.receiveNotifications === 1,
        receivePromotions: client.receivePromotions === 1,
      }));
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      return [];
    }
  }

  // Buscar clientes
  static async searchClients(searchTerm: string): Promise<Client[]> {
    try {
      const term = `%${searchTerm}%`;
      const results = await db.getAllAsync<Client & { receiveNotifications: number; receivePromotions: number }>(
        `SELECT * FROM clients 
         WHERE firstName LIKE ? 
         OR lastName LIKE ? 
         OR email LIKE ? 
         OR phone LIKE ?
         OR documentNumber LIKE ?
         ORDER BY createdAt DESC`,
        [term, term, term, term, term]
      );
      
      return results.map(client => ({
        ...client,
        receiveNotifications: client.receiveNotifications === 1,
        receivePromotions: client.receivePromotions === 1,
      }));
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      return [];
    }
  }

  // Eliminar cliente
  static async deleteClient(id: number): Promise<void> {
    try {
      await db.runAsync('DELETE FROM clients WHERE id = ?', [id]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el cliente');
      throw error;
    }
  }

  // Verificar si existe cliente por email o documento
  static async clientExists(email: string, documentNumber: string, excludeId?: number): Promise<boolean> {
    try {
      let query = 'SELECT COUNT(*) as count FROM clients WHERE (email = ? OR documentNumber = ?)';
      const params: any[] = [email, documentNumber];
      
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      
      const result = await db.getFirstAsync<{ count: number }>(query, params);
      return (result?.count ?? 0) > 0;
    } catch (error) {
      console.error('Error al verificar existencia:', error);
      return false;
    }
  }
}