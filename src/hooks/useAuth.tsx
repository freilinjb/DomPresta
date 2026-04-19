// hooks/useAuth.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Tipos de usuario
export interface User {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  role?: string;
  role_name?: string;
  branch?: string;
  branch_name?: string;
  total_loans?: number;
  totalLoans?: number;
  portfolio?: number;
  portfolioAmount?: number;
  collect_rate?: number;
  collectRate?: number;
  avatar?: string;
}

// Credenciales para login
interface LoginCredentials {
  email: string;
  password: string;
}

// Respuesta del login
interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// Contexto de autenticación
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

// Props del provider
interface AuthProviderProps {
  children: ReactNode;
}

// Crear contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Provider de autenticación
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Cargar usuario al iniciar la app
  useEffect(() => {
    loadStoredUser();
  }, []);

  // Cargar usuario guardado en AsyncStorage
  const loadStoredUser = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const storedUser = await AsyncStorage.getItem('@DomPresta:user');
      const storedToken = await AsyncStorage.getItem('@DomPresta:token');

      if (storedUser && storedToken) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        
        // Verificar si el token sigue siendo válido
        await validateToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  // Validar token con el backend
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      // Aquí iría la llamada a tu API para validar el token
      // const response = await api.validateToken(token);
      // return response.isValid;
      
      // Por ahora, simulamos que el token es válido
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Función de login
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);

      // Aquí iría la llamada real a tu API
      // const response = await api.login(credentials.email, credentials.password);
      
      // SIMULACIÓN de respuesta del backend
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular delay de red
      
      // Simular validación de credenciales
      if (credentials.email === 'demo@dompresta.com' && credentials.password === '123456') {
        const mockResponse: LoginResponse = {
          user: {
            id: '1',
            name: 'Carlos Rodríguez',
            full_name: 'Carlos Rodríguez',
            email: credentials.email,
            role: 'admin',
            role_name: 'Administrador',
            branch: 'Sucursal Principal',
            branch_name: 'Sucursal Principal',
            total_loans: 42,
            totalLoans: 42,
            portfolio: 1250000,
            portfolioAmount: 1250000,
            collect_rate: 94,
            collectRate: 94,
          },
          token: 'mock-jwt-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now(),
        };

        // Guardar en AsyncStorage
        await AsyncStorage.setItem('@DomPresta:user', JSON.stringify(mockResponse.user));
        await AsyncStorage.setItem('@DomPresta:token', mockResponse.token);
        await AsyncStorage.setItem('@DomPresta:refreshToken', mockResponse.refreshToken || '');

        setUser(mockResponse.user);
        setIsAuthenticated(true);
      } else {
        throw new Error('Credenciales inválidas. Usuario: demo@dompresta.com, Contraseña: 123456');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Error de inicio de sesión',
        error instanceof Error ? error.message : 'Credenciales incorrectas. Intenta de nuevo.'
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función de logout
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Aquí iría la llamada a tu API para cerrar sesión
      // await api.logout();
      
      await clearAuthData();
    } catch (error) {
      console.error('Logout error:', error);
      // Aún si hay error, limpiamos los datos locales
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  // Limpiar datos de autenticación
  const clearAuthData = async (): Promise<void> => {
    await AsyncStorage.multiRemove([
      '@DomPresta:user',
      '@DomPresta:token',
      '@DomPresta:refreshToken'
    ]);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Actualizar información del usuario
  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      if (!user) return;
      
      const updatedUser = { ...user, ...userData };
      await AsyncStorage.setItem('@DomPresta:user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  // Refrescar token
  const refreshToken = async (): Promise<string | null> => {
    try {
      const refreshTokenStored = await AsyncStorage.getItem('@DomPresta:refreshToken');
      if (!refreshTokenStored) return null;

      // Aquí iría la llamada a tu API para refrescar el token
      // const response = await api.refreshToken(refreshTokenStored);
      // const newToken = response.token;
      
      // Simular nuevo token
      const newToken = 'refreshed-jwt-token-' + Date.now();
      await AsyncStorage.setItem('@DomPresta:token', newToken);
      
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await logout();
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};