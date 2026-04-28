// authService.ts
import { DatabaseService } from './databaseService';
import { User } from '../types';

export class AuthService {
  private static initializationPromise: Promise<void> | null = null;

  static async initialize(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = this._initialize();
    }
    return this.initializationPromise;
  }

  private static async _initialize(): Promise<void> {
    DatabaseService.initDatabase();

    // Verificar si ya hay una sesión activa
    const existingUser = await DatabaseService.getCurrentUser();
    
    // Si hay usuario logueado, no es necesario crear admin
    if (existingUser) {
      console.log('Sesión existente encontrada:', existingUser.email);
      return;
    }

    // Crear usuario administrador por defecto si no existe
    const adminExists = DatabaseService.getUserByEmail('admin@dompresta.com');
    if (!adminExists) {
      await DatabaseService.createUser({
        name: 'Administrador',
        email: 'admin@dompresta.com',
        password: 'admin123', // En producción usar hash
        role: 'admin'
      });
    }
  }

  static async login(email: string, password: string, role?: string): Promise<User | null> {
    try {
      const user = DatabaseService.getUserByEmail(email);
      if (user && user.password === password) {
        // Verificar rol si se especificó
        if (role && user.role !== role && user.role !== 'admin') {
          console.log('Rol incorrecto para este usuario');
          return null;
        }
        
        // Guardar sesión
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
      const existingUser = DatabaseService.getUserByEmail(email);
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

      // Aquí actualizarías la contraseña en la base de datos
      // Por ahora, solo simulamos el cambio
      console.log('Password changed for user:', user.email);
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  }
}