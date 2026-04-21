import db from '@/database/db';
import { Client } from '../types/index';

export interface ClientInput extends Omit<Client, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

class ClientService {
  // Crear un nuevo cliente
  async create(client: ClientInput): Promise<Client> {
    const id = client.id || this.generateId();
    const now = new Date().toISOString();

    const newClient: Client = {
      id,
      ...client,
      createdAt: client.createdAt || now,
      updatedAt: now,
    };

    try {
      await db.runAsync(
        `INSERT INTO clients (
          id, firstName, lastName, email, phone, documentType, documentNumber,
          monthlyIncome, occupation, address, city, status, totalLoans,
          activeLoans, totalAmount, lastContact, createdAt, creditScore,
          avatar, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newClient.id,
          newClient.firstName,
          newClient.lastName,
          newClient.email,
          newClient.phone,
          newClient.documentType,
          newClient.documentNumber,
          newClient.monthlyIncome,
          newClient.occupation,
          newClient.address,
          newClient.city,
          newClient.status,
          newClient.totalLoans,
          newClient.activeLoans,
          newClient.totalAmount,
          newClient.lastContact,
          newClient.createdAt,
          newClient.creditScore || null,
          newClient.avatar || null,
          newClient.updatedAt,
        ]
      );

      return newClient;
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  }

  // Obtener todos los clientes
  async getAll(): Promise<Client[]> {
    try {
      const result = await db.getAllAsync<any>(
        'SELECT * FROM clients ORDER BY createdAt DESC'
      );

      return result.map(this.mapToClient);
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  }

  // Obtener cliente por ID
  async getById(id: string): Promise<Client | null> {
    try {
      console.log(`🔍 Buscando cliente con ID: ${id}`);

      const result = await db.getFirstAsync<any>(
        'SELECT * FROM clients WHERE id = ?',
        [id]
      );

      if (!result) {
        console.log(`❌ No se encontró cliente con ID: ${id}`);
        return null;
      }

      console.log(`✅ Cliente encontrado: ${result.firstName} ${result.lastName}`);
      return this.mapToClient(result);
    } catch (error) {
      console.error('❌ Error al obtener cliente por ID:', error);
      throw error;
    }
  }

  // Verificar si existe un cliente
  async exists(id: string): Promise<boolean> {
    try {
      const result = await db.getFirstAsync<any>(
        'SELECT 1 FROM clients WHERE id = ?',
        [id]
      );
      return !!result;
    } catch (error) {
      console.error('Error al verificar existencia:', error);
      return false;
    }
  }

  // Actualizar cliente
  async update(id: string, updates: Partial<ClientInput>): Promise<Client | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) return null;

      const updatedClient = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.runAsync(
        `UPDATE clients SET
          firstName = ?, lastName = ?, email = ?, phone = ?,
          documentType = ?, documentNumber = ?, monthlyIncome = ?,
          occupation = ?, address = ?, city = ?, status = ?,
          totalLoans = ?, activeLoans = ?, totalAmount = ?,
          lastContact = ?, creditScore = ?, avatar = ?, updatedAt = ?
        WHERE id = ?`,
        [
          updatedClient.firstName,
          updatedClient.lastName,
          updatedClient.email,
          updatedClient.phone,
          updatedClient.documentType,
          updatedClient.documentNumber,
          updatedClient.monthlyIncome,
          updatedClient.occupation,
          updatedClient.address,
          updatedClient.city,
          updatedClient.status,
          updatedClient.totalLoans,
          updatedClient.activeLoans,
          updatedClient.totalAmount,
          updatedClient.lastContact,
          updatedClient.creditScore || null,
          updatedClient.avatar || null,
          updatedClient.updatedAt,
          id,
        ]
      );

      return updatedClient;
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  }

  // Eliminar cliente
  async delete(id: string): Promise<boolean> {
    try {
      const result = await db.runAsync(
        'DELETE FROM clients WHERE id = ?',
        [id]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  }

  // Buscar clientes
  async search(query: string): Promise<Client[]> {
    const searchTerm = `%${query}%`;
    try {
      const result = await db.getAllAsync<any>(
        `SELECT * FROM clients 
         WHERE firstName LIKE ? 
            OR lastName LIKE ? 
            OR email LIKE ? 
            OR phone LIKE ? 
            OR documentNumber LIKE ?
         ORDER BY createdAt DESC`,
        [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
      );

      return result.map(this.mapToClient);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      throw error;
    }
  }

  // Obtener estadísticas
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    blocked: number;
    withLoans: number;
    totalAmount: number;
  }> {
    try {
      const stats = await db.getFirstAsync<any>(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
          SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked,
          SUM(CASE WHEN totalLoans > 0 THEN 1 ELSE 0 END) as withLoans,
          SUM(totalAmount) as totalAmount
        FROM clients
      `);

      return {
        total: stats.total || 0,
        active: stats.active || 0,
        inactive: stats.inactive || 0,
        blocked: stats.blocked || 0,
        withLoans: stats.withLoans || 0,
        totalAmount: stats.totalAmount || 0,
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  // Insertar múltiples clientes (para migración inicial)
  async bulkInsert(clients: ClientInput[]): Promise<void> {
    try {
      await db.execAsync('BEGIN TRANSACTION');

      for (const client of clients) {
        await this.create(client);
      }

      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      console.error('Error en inserción masiva:', error);
      throw error;
    }
  }

  // Limpiar toda la tabla
  async clearAll(): Promise<void> {
    try {
      await db.runAsync('DELETE FROM clients');
    } catch (error) {
      console.error('Error al limpiar tabla:', error);
      throw error;
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async getByEmail(email: string): Promise<Client | null> {
    try {
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM clients WHERE email = ?',
        [email.toLowerCase()]
      );

      return result ? this.mapToClient(result) : null;
    } catch (error) {
      console.error('Error al obtener cliente por email:', error);
      throw error;
    }
  }

  // Obtener cliente por número de documento
  async getByDocumentNumber(documentNumber: string): Promise<Client | null> {
    try {
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM clients WHERE documentNumber = ?',
        [documentNumber]
      );

      return result ? this.mapToClient(result) : null;
    } catch (error) {
      console.error('Error al obtener cliente por documento:', error);
      throw error;
    }
  }

  private mapToClient(row: any): Client {
    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      documentType: row.documentType,
      documentNumber: row.documentNumber,
      monthlyIncome: row.monthlyIncome,
      occupation: row.occupation,
      address: row.address,
      city: row.city,
      status: row.status,
      totalLoans: row.totalLoans,
      activeLoans: row.activeLoans,
      totalAmount: row.totalAmount,
      lastContact: row.lastContact,
      createdAt: row.createdAt,
      creditScore: row.creditScore,
      avatar: row.avatar,
    };
  }
}

export const clientService = new ClientService();