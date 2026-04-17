import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Loan, Payment, User, CreateUser } from '../types';

const db = SQLite.openDatabase('dompresta.db');

export class DatabaseService {
  static async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // Crear tabla de usuarios
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
          (_, error) => console.error('Error creating users table:', error)
        );

        // Crear tabla de préstamos
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
          (_, error) => console.error('Error creating loans table:', error)
        );

        // Crear tabla de pagos
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
          (_, error) => console.error('Error creating payments table:', error)
        );

        // Crear tabla de configuraciones
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          )`,
          [],
          () => console.log('Settings table created'),
          (_, error) => console.error('Error creating settings table:', error)
        );
      },
      (error) => reject(error),
      () => resolve()
    );
  }

  // Métodos para usuarios
  static async createUser(user: CreateUser): Promise<User> {
    return new Promise((resolve, reject) => {
      const id = Date.now().toString();
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
          [id, user.name, user.email, user.password, user.role],
          (_, result) => {
            resolve({ ...user, id });
          },
          (_, error) => reject(error)
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
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve(rows.item(0));
            } else {
              resolve(null);
            }
          },
          (_, error) => reject(error)
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
            (_, { rows }) => {
              if (rows.length > 0) {
                resolve(rows.item(0));
              } else {
                resolve(null);
              }
            },
            (_, error) => reject(error)
          );
        });
      });
    } catch (error) {
      return null;
    }
  }

  static async setCurrentUser(userId: string): Promise<void> {
    await AsyncStorage.setItem('currentUserId', userId);
  }

  static async logout(): Promise<void> {
    await AsyncStorage.removeItem('currentUserId');
  }

  // Métodos para préstamos
  static async createLoan(loan: Omit<Loan, 'id' | 'payments'>): Promise<Loan> {
    return new Promise((resolve, reject) => {
      const id = Date.now().toString();
      const currentUser = await this.getCurrentUser();

      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO loans (id, borrower_name, amount, interest_rate, term, start_date, end_date, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, loan.borrowerName, loan.amount, loan.interestRate, loan.term,
           loan.startDate.toISOString(), loan.endDate.toISOString(), loan.status,
           currentUser?.id || ''],
          (_, result) => {
            resolve({
              ...loan,
              id,
              payments: []
            });
          },
          (_, error) => reject(error)
        );
      });
    });
  }

  static async getLoans(): Promise<Loan[]> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM loans ORDER BY created_at DESC',
          [],
          async (_, { rows }) => {
            const loans: Loan[] = [];
            for (let i = 0; i < rows.length; i++) {
              const loanData = rows.item(i);
              const payments = await this.getPaymentsByLoanId(loanData.id);
              loans.push({
                id: loanData.id,
                borrowerName: loanData.borrower_name,
                amount: loanData.amount,
                interestRate: loanData.interest_rate,
                term: loanData.term,
                startDate: new Date(loanData.start_date),
                endDate: new Date(loanData.end_date),
                status: loanData.status,
                payments
              });
            }
            resolve(loans);
          },
          (_, error) => reject(error)
        );
      });
    });
  }

  static async getLoanById(id: string): Promise<Loan | null> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM loans WHERE id = ?',
          [id],
          async (_, { rows }) => {
            if (rows.length > 0) {
              const loanData = rows.item(0);
              const payments = await this.getPaymentsByLoanId(loanData.id);
              resolve({
                id: loanData.id,
                borrowerName: loanData.borrower_name,
                amount: loanData.amount,
                interestRate: loanData.interest_rate,
                term: loanData.term,
                startDate: new Date(loanData.start_date),
                endDate: new Date(loanData.end_date),
                status: loanData.status,
                payments
              });
            } else {
              resolve(null);
            }
          },
          (_, error) => reject(error)
        );
      });
    });
  }

  static async updateLoan(id: string, updates: Partial<Loan>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];

      if (updates.borrowerName) {
        fields.push('borrower_name = ?');
        values.push(updates.borrowerName);
      }
      if (updates.amount !== undefined) {
        fields.push('amount = ?');
        values.push(updates.amount);
      }
      if (updates.interestRate !== undefined) {
        fields.push('interest_rate = ?');
        values.push(updates.interestRate);
      }
      if (updates.term !== undefined) {
        fields.push('term = ?');
        values.push(updates.term);
      }
      if (updates.startDate) {
        fields.push('start_date = ?');
        values.push(updates.startDate.toISOString());
      }
      if (updates.endDate) {
        fields.push('end_date = ?');
        values.push(updates.endDate.toISOString());
      }
      if (updates.status) {
        fields.push('status = ?');
        values.push(updates.status);
      }

      if (fields.length === 0) {
        resolve();
        return;
      }

      values.push(id);

      db.transaction(tx => {
        tx.executeSql(
          `UPDATE loans SET ${fields.join(', ')} WHERE id = ?`,
          values,
          (_, result) => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }

  static async deleteLoan(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // Primero eliminar pagos relacionados
        tx.executeSql(
          'DELETE FROM payments WHERE loan_id = ?',
          [id],
          () => {
            // Luego eliminar el préstamo
            tx.executeSql(
              'DELETE FROM loans WHERE id = ?',
              [id],
              (_, result) => resolve(),
              (_, error) => reject(error)
            );
          },
          (_, error) => reject(error)
        );
      });
    });
  }

  // Métodos para pagos
  static async createPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    return new Promise((resolve, reject) => {
      const id = Date.now().toString();
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO payments (id, loan_id, amount, date, status) VALUES (?, ?, ?, ?, ?)',
          [id, payment.loanId, payment.amount, payment.date.toISOString(), payment.status],
          (_, result) => {
            resolve({ ...payment, id });
          },
          (_, error) => reject(error)
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
              const paymentData = rows.item(i);
              payments.push({
                id: paymentData.id,
                loanId: paymentData.loan_id,
                amount: paymentData.amount,
                date: new Date(paymentData.date),
                status: paymentData.status
              });
            }
            resolve(payments);
          },
          (_, error) => reject(error)
        );
      });
    });
  }

  static async updatePayment(id: string, updates: Partial<Payment>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];

      if (updates.amount !== undefined) {
        fields.push('amount = ?');
        values.push(updates.amount);
      }
      if (updates.date) {
        fields.push('date = ?');
        values.push(updates.date.toISOString());
      }
      if (updates.status) {
        fields.push('status = ?');
        values.push(updates.status);
      }

      if (fields.length === 0) {
        resolve();
        return;
      }

      values.push(id);

      db.transaction(tx => {
        tx.executeSql(
          `UPDATE payments SET ${fields.join(', ')} WHERE id = ?`,
          values,
          (_, result) => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }

  // Métodos para configuraciones
  static async getSetting(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT value FROM settings WHERE key = ?',
          [key],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve(rows.item(0).value);
            } else {
              resolve(null);
            }
          },
          (_, error) => reject(error)
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
          (_, result) => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }
}