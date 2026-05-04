import db from '../database/db';

export interface Setting {
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}

class SettingsService {
  async get(key: string): Promise<string | null> {
    try {
      const setting = await db.getFirstAsync<Setting>(
        'SELECT * FROM settings WHERE key = ?',
        [key]
      );
      return setting ? setting.value : null;
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      throw error;
    }
  }

  async set(key: string, value: string, description?: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT OR REPLACE INTO settings (key, value, description, updatedAt)
         VALUES (?, ?, ?, ?)`,
        [key, value, description || '', now]
      );
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      throw error;
    }
  }

  async getAll(): Promise<Setting[]> {
    try {
      const settings = await db.getAllAsync<Setting>(
        'SELECT * FROM settings ORDER BY key'
      );
      return settings;
    } catch (error) {
      console.error('Error al obtener configuraciones:', error);
      throw error;
    }
  }

  async update(key: string, value: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      await db.runAsync(
        `UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?`,
        [value, now, key]
      );
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await db.runAsync('DELETE FROM settings WHERE key = ?', [key]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error al eliminar configuración:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();