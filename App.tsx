// App.tsx
import React, { useEffect } from 'react';
import { AuthProvider } from './src/hooks/useAuth';
import AppNavigator from './src/navigation/AppNavigator';
import { DatabaseService } from './src/services/databaseService';
import { configService } from './src/services/configService';

export default function App() {
  useEffect(() => {
    const initialize = async () => {
      DatabaseService.initDatabase();
      await configService.initialize();
    };
    initialize();
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}