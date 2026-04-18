import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Loan, Payment, User } from '../types';

const db = SQLite.openDatabase('dompresta.db');

export class DatabaseService {
  static async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT NOT NULL UNIQUE,
              password TEXT NOT NULL,
              role TEXT DEFAULT 'user',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            [],
            () => console.log('Users table created'),
            (_, error) => { console.error('Error creating users table:', error); return false; }
          );

          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS loans (
              id TEXT PRIMARY KEY,
              borrower_name TEXT NOT NULL,
              amount REAL NOT NULL,
              interest_rate REAL NOT NULL,
              term INTEGER NOT NULL,
              start_date TEXT NOT NULL,
              end_date TEXT NOT NULL,
              status TEXT DEFAULT 'active',
              user_id TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users (id)
            )`,
            [],
            () => console.log('Loans table created'),
            (_, error) => { console.error('Error creating loans table:', error); return false; }
          );

          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS payments (
              id TEXT PRIMARY KEY,
              loan_id TEXT NOT NULL,
              amount REAL NOT NULL,
              date TEXT NOT NULL,
              status TEXT DEFAULT 'pending',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (loan_id) REFERENCES loans (id)
            )`,
            [],
            () => console.log('Payments table created'),
            (_, error) => { console.error('Error creating payments table:', error); return false; }
          );

          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            )`,
            [],
            () => console.log('Settings table created'),
            (_, error) => { console.error('Error creating settings table:', error); return false; }
          );
        },
        (error) => reject(error),
        () => resolve()
      );
    });
  }

  // ─── Usuarios ────────────────────────────────────────────────────────────────

  static async createUser(user: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
  }): Promise<User> {
    return new Promise((resolve, reject) => {
      const id = Date.now().toString();
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
          [id, user.name, user.email, user.password, user.role],
          () => resolve({ ...user, id }),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users WHERE email = ?',
          [email],
          (_, { rows }) => resolve(rows.length > 0 ? rows.item(0) : null),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      if (!userId) return null;

      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM users WHERE id = ?',
            [userId],
            (_, { rows }) => resolve(rows.length > 0 ? rows.item(0) : null),
            (_, error) => { reject(error); return false; }
          );
        });
      });
    } catch {
      return null;
    }
  }

  static async setCurrentUser(userId: string): Promise<void> {
    await AsyncStorage.setItem('currentUserId', userId);
  }

  static async logout(): Promise<void> {
    await AsyncStorage.removeItem('currentUserId');
  }

  // ─── Préstamos ───────────────────────────────────────────────────────────────

  // FIX: await getCurrentUser() FUERA del new Promise para evitar await dentro
  // de un callback no-async.
  static async createLoan(loan: Omit<Loan, 'id' | 'payments'>): Promise<Loan> {
    const currentUser = await this.getCurrentUser(); // ← correcto, fuera del Promise

    return new Promise((resolve, reject) => {
      const id = Date.now().toString();
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO loans
            (id, borrower_name, amount, interest_rate, term, start_date, end_date, status, user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            loan.borrowerName,
            loan.amount,
            loan.interestRate,
            loan.term,
            loan.startDate.toISOString(),
            loan.endDate.toISOString(),
            loan.status,
            currentUser?.id ?? '',
          ],
          () => resolve({ ...loan, id, payments: [] }),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  // FIX: los async callbacks dentro de executeSql son ignorados por expo-sqlite.
  // Se obtienen todos los loan rows primero y luego se resuelven los payments
  // con Promise.all fuera del callback de SQLite.
  static async getLoans(): Promise<Loan[]> {
    const rows = await new Promise<any[]>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM loans ORDER BY created_at DESC',
          [],
          (_, { rows: r }) => {
            const items: any[] = [];
            for (let i = 0; i < r.length; i++) items.push(r.item(i));
            resolve(items);
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });

    // Ahora sí podemos usar await correctamente
    const loans: Loan[] = await Promise.all(
      rows.map(async (loanData) => {
        const payments = await this.getPaymentsByLoanId(loanData.id);
        return {
          id: loanData.id,
          borrowerName: loanData.borrower_name,
          amount: loanData.amount,
          interestRate: loanData.interest_rate,
          term: loanData.term,
          startDate: new Date(loanData.start_date),
          endDate: new Date(loanData.end_date),
          status: loanData.status,
          payments,
        } as Loan;
      })
    );

    return loans;
  }

  // FIX: mismo patrón — resolver el row primero, luego await los payments fuera.
  static async getLoanById(id: string): Promise<Loan | null> {
    const loanData = await new Promise<any | null>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM loans WHERE id = ?',
          [id],
          (_, { rows }) => resolve(rows.length > 0 ? rows.item(0) : null),
          (_, error) => { reject(error); return false; }
        );
      });
    });

    if (!loanData) return null;

    const payments = await this.getPaymentsByLoanId(loanData.id);
    return {
      id: loanData.id,
      borrowerName: loanData.borrower_name,
      amount: loanData.amount,
      interestRate: loanData.interest_rate,
      term: loanData.term,
      startDate: new Date(loanData.start_date),
      endDate: new Date(loanData.end_date),
      status: loanData.status,
      payments,
    };
  }

  static async updateLoan(id: string, updates: Partial<Loan>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.borrowerName !== undefined) { fields.push('borrower_name = ?'); values.push(updates.borrowerName); }
    if (updates.amount !== undefined)       { fields.push('amount = ?');        values.push(updates.amount); }
    if (updates.interestRate !== undefined) { fields.push('interest_rate = ?'); values.push(updates.interestRate); }
    if (updates.term !== undefined)         { fields.push('term = ?');          values.push(updates.term); }
    if (updates.startDate !== undefined)    { fields.push('start_date = ?');    values.push(updates.startDate.toISOString()); }
    if (updates.endDate !== undefined)      { fields.push('end_date = ?');      values.push(updates.endDate.toISOString()); }
    if (updates.status !== undefined)       { fields.push('status = ?');        values.push(updates.status); }

    if (fields.length === 0) return;

    values.push(id);

    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE loans SET ${fields.join(', ')} WHERE id = ?`,
          values,
          () => resolve(),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  static async deleteLoan(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            'DELETE FROM payments WHERE loan_id = ?',
            [id],
            () => {},
            (_, error) => { reject(error); return false; }
          );
          tx.executeSql(
            'DELETE FROM loans WHERE id = ?',
            [id],
            () => {},
            (_, error) => { reject(error); return false; }
          );
        },
        (error) => reject(error),
        () => resolve()
      );
    });
  }

  // ─── Pagos ───────────────────────────────────────────────────────────────────

  static async createPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    return new Promise((resolve, reject) => {
      const id = Date.now().toString();
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO payments (id, loan_id, amount, date, status) VALUES (?, ?, ?, ?, ?)',
          [id, payment.loanId, payment.amount, payment.date.toISOString(), payment.status],
          () => resolve({ ...payment, id }),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  static async getPaymentsByLoanId(loanId: string): Promise<Payment[]> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM payments WHERE loan_id = ? ORDER BY date DESC',
          [loanId],
          (_, { rows }) => {
            const payments: Payment[] = [];
            for (let i = 0; i < rows.length; i++) {
              const p = rows.item(i);
              payments.push({
                id: p.id,
                loanId: p.loan_id,
                amount: p.amount,
                date: new Date(p.date),
                status: p.status,
              });
            }
            resolve(payments);
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  static async updatePayment(id: string, updates: Partial<Payment>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.amount !== undefined) { fields.push('amount = ?'); values.push(updates.amount); }
    if (updates.date !== undefined)   { fields.push('date = ?');   values.push(updates.date.toISOString()); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }

    if (fields.length === 0) return;

    values.push(id);

    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE payments SET ${fields.join(', ')} WHERE id = ?`,
          values,
          () => resolve(),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  // ─── Configuraciones ─────────────────────────────────────────────────────────

  static async getSetting(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT value FROM settings WHERE key = ?',
          [key],
          (_, { rows }) => resolve(rows.length > 0 ? rows.item(0).value : null),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  static async setSetting(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          [key, value],
          () => resolve(),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }
}