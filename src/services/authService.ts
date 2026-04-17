import { DatabaseService } from './databaseService';
import { User } from '../types';

export class AuthService {
  static async initialize(): Promise<void> {
    await DatabaseService.initDatabase();

    // Crear usuario administrador por defecto si no existe
    const adminExists = await DatabaseService.getUserByEmail('admin@dompresta.com');
    if (!adminExists) {
      await DatabaseService.createUser({
        name: 'Administrador',
        email: 'admin@dompresta.com',
        password: 'admin123', // En producción usar hash
        role: 'admin'
      });
    }
  }

  static async login(email: string, password: string): Promise<User | null> {
    try {
      const user = await DatabaseService.getUserByEmail(email);
      if (user && user.password === password) { // En producción verificar hash
        await DatabaseService.setCurrentUser(user.id);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  static async register(name: string, email: string, password: string): Promise<User | null> {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await DatabaseService.getUserByEmail(email);
      if (existingUser) {
        return null; // Usuario ya existe
      }

      const newUser = await DatabaseService.createUser({
        name,
        email,
        password, // En producción hashear la contraseña
        role: 'user'
      });

      await DatabaseService.setCurrentUser(newUser.id);
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  }

  static async logout(): Promise<void> {
    await DatabaseService.logout();
  }

  static async getCurrentUser(): Promise<User | null> {
    return await DatabaseService.getCurrentUser();
  }

  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user || user.password !== currentPassword) {
        return false;
      }

      // En una implementación real, actualizar la contraseña en la base de datos
      // Por ahora, solo simulamos el cambio
      console.log('Password changed for user:', user.email);
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  }
}