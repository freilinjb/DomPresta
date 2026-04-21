import * as SQLite from 'expo-sqlite';

// Abrir/Crear la base de datos
const db = SQLite.openDatabaseSync('clientes.db');

// Inicializar la base de datos
export const initDatabase = async (): Promise<void> => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        documentType TEXT CHECK(documentType IN ('cedula', 'passport', 'rnc')) NOT NULL,
        documentNumber TEXT NOT NULL,
        monthlyIncome REAL NOT NULL,
        occupation TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        status TEXT CHECK(status IN ('active', 'inactive', 'blocked')) NOT NULL,
        totalLoans INTEGER NOT NULL,
        activeLoans INTEGER NOT NULL,
        totalAmount REAL NOT NULL,
        lastContact TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        creditScore INTEGER,
        avatar TEXT,
        updatedAt TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
      CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(firstName, lastName);
      CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
      CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(documentNumber);
    `);
    
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
};

export default db;