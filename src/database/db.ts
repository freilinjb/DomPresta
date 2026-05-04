import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('clientes.db');

export const initDatabase = async (): Promise<void> => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        documentType TEXT NOT NULL,
        documentNumber TEXT NOT NULL,
        monthlyIncome REAL NOT NULL,
        occupation TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        status TEXT NOT NULL,
        totalLoans INTEGER NOT NULL,
        activeLoans INTEGER NOT NULL,
        totalAmount REAL NOT NULL,
        lastContact TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        creditScore INTEGER,
        avatar TEXT,
        updatedAt TEXT
      );
    `);

    // ✅ NUEVA: Tabla de préstamos
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY NOT NULL,
        clientId TEXT NOT NULL,
        loanTypeId TEXT NOT NULL,
        loanTypeName TEXT NOT NULL,
        loanTypeCategory TEXT NOT NULL,
        amount REAL NOT NULL,
        interestRate REAL NOT NULL,
        term INTEGER NOT NULL,
        paymentFrequency TEXT NOT NULL,
        startDate TEXT NOT NULL,
        firstPaymentDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        periodicPayment REAL NOT NULL,
        totalInterest REAL NOT NULL,
        totalAmount REAL NOT NULL,
        remainingBalance REAL NOT NULL,
        status TEXT CHECK(status IN ('pending', 'active', 'paid', 'overdue', 'cancelled')) NOT NULL,
        cashBoxId TEXT,
        paymentMethodId TEXT,
        referenceCode TEXT,
        
        -- Codeudor
        guarantorName TEXT,
        guarantorId TEXT,
        guarantorPhone TEXT,
        guarantorAddress TEXT,
        
        -- Garantía
        guaranteeType TEXT,
        guaranteeValue REAL,
        guaranteeDescription TEXT,
        guaranteeFileNumber TEXT,
        guaranteeNotes TEXT,
        
        -- Configuración San
        sanIncludeWeekends INTEGER DEFAULT 0,
        sanFirstPaymentTomorrow INTEGER DEFAULT 0,
        
        -- Configuración Informal
        informalProfitPercentage REAL,
        informalGracePeriod INTEGER DEFAULT 0,
        informalLateFeePercentage REAL DEFAULT 5,
        
        -- Comisiones
        legalFees REAL DEFAULT 0,
        lateFee REAL DEFAULT 0,
        commission REAL DEFAULT 0,
        insuranceAmount REAL DEFAULT 0,
        initialPayment REAL DEFAULT 0,
        
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        notes TEXT,
        
        FOREIGN KEY (clientId) REFERENCES clients(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_loans_clientId ON loans(clientId);
      CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
      CREATE INDEX IF NOT EXISTS idx_loans_startDate ON loans(startDate);
    `);

    // ✅ NUEVA: Tabla de amortización
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS loan_amortization (
        id TEXT PRIMARY KEY NOT NULL,
        loanId TEXT NOT NULL,
        period INTEGER NOT NULL,
        paymentDate TEXT NOT NULL,
        payment REAL NOT NULL,
        principal REAL NOT NULL,
        interest REAL NOT NULL,
        remaining REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        isWeekend INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (loanId) REFERENCES loans(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_amortization_loanId ON loan_amortization(loanId);
    `);

    // ✅ NUEVA: Tabla de pagos
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY NOT NULL,
        loanId TEXT NOT NULL,
        clientId TEXT NOT NULL,
        amount REAL NOT NULL,
        paymentDate TEXT NOT NULL,
        paymentMethod TEXT NOT NULL,
        referenceCode TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        FOREIGN KEY (loanId) REFERENCES loans(id),
        FOREIGN KEY (clientId) REFERENCES clients(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_payments_loanId ON payments(loanId);
      CREATE INDEX IF NOT EXISTS idx_payments_clientId ON payments(clientId);
      CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(paymentDate);
    `);

    // ✅ NUEVA: Tabla de configuración
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        updatedAt TEXT NOT NULL
      );
      
      -- Insertar configuraciones por defecto
      INSERT OR IGNORE INTO settings (key, value, description, updatedAt) VALUES
        ('currency', 'DOP', 'Moneda por defecto (DOP, USD, etc.)', datetime('now')),
        ('company_name', 'DomPresta', 'Nombre de la empresa', datetime('now')),
        ('company_address', 'Santo Domingo, República Dominicana', 'Dirección de la empresa', datetime('now')),
        ('company_phone', '+1 (809) 123-4567', 'Teléfono de la empresa', datetime('now')),
        ('company_email', 'info@dompresta.com', 'Correo electrónico de la empresa', datetime('now')),
        ('interest_rate_default', '15', 'Tasa de interés por defecto (%)', datetime('now')),
        ('late_fee_percentage', '5', 'Porcentaje de mora por defecto (%)', datetime('now')),
        ('grace_period_days', '3', 'Días de gracia por defecto', datetime('now'));
    `);

    console.log('✅ Base de datos inicializada con préstamos, pagos y configuración');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
};

export default db;