import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Loan, Payment, User } from '../types';

const db = SQLite.openDatabaseSync('dompresta.db');

export class DatabaseService {
  static initDatabase(): void {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS loans (
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
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        loan_id TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans (id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  // ─── Usuarios ────────────────────────────────────────────────────────────────

  static async createUser(user: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
  }): Promise<User> {
    const id = Date.now().toString();
    db.runSync(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, user.name, user.email, user.password, user.role]
    );
    return { ...user, id };
  }

  static getUserByEmail(email: string): User | null {
    const row = db.getFirstSync<User>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return row ?? null;
  }

  static updateUser(id: string, updates: Partial<{ name: string; email: string; password: string; role: 'admin' | 'user' }>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email); }
    if (updates.password !== undefined) { fields.push('password = ?'); values.push(updates.password); }
    if (updates.role !== undefined) { fields.push('role = ?'); values.push(updates.role); }

    if (fields.length === 0) return;

    values.push(id);
    db.runSync(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      if (!userId) return null;
      const row = db.getFirstSync<User>(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      return row ?? null;
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

  static async createLoan(loan: Omit<Loan, 'id' | 'payments'>): Promise<Loan> {
    const currentUser = await this.getCurrentUser();
    const id = Date.now().toString();
    db.runSync(
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
      ]
    );
    return { ...loan, id, payments: [] };
  }

  static async getLoans(): Promise<Loan[]> {
    const rows = db.getAllSync<any>(
      'SELECT * FROM loans ORDER BY created_at DESC'
    );
    return Promise.all(
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
          createdAt: new Date(loanData.created_at),
          status: loanData.status,
          payments,
        } as Loan;
      })
    );
  }

  static async getLoanById(id: string): Promise<Loan | null> {
    const loanData = db.getFirstSync<any>(
      'SELECT * FROM loans WHERE id = ?',
      [id]
    );
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
      createdAt: new Date(loanData.created_at),
      status: loanData.status,
      payments,
    };
  }

  static updateLoan(id: string, updates: Partial<Loan>): void {
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
    db.runSync(`UPDATE loans SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  static deleteLoan(id: string): void {
    db.runSync('DELETE FROM payments WHERE loan_id = ?', [id]);
    db.runSync('DELETE FROM loans WHERE id = ?', [id]);
  }

  // ─── Pagos ───────────────────────────────────────────────────────────────────

  static createPayment(payment: Omit<Payment, 'id'>): Payment {
    const id = Date.now().toString();
    db.runSync(
      'INSERT INTO payments (id, loan_id, amount, date, status) VALUES (?, ?, ?, ?, ?)',
      [id, payment.loanId, payment.amount, payment.date.toISOString(), payment.status]
    );
    return { ...payment, id };
  }

  static getPaymentsByLoanId(loanId: string): Promise<Payment[]> {
    const rows = db.getAllSync<any>(
      'SELECT * FROM payments WHERE loan_id = ? ORDER BY date DESC',
      [loanId]
    );
    return Promise.resolve(
      rows.map((p) => ({
        id: p.id,
        loanId: p.loan_id,
        amount: p.amount,
        date: new Date(p.date),
        status: p.status,
      }))
    );
  }

  static updatePayment(id: string, updates: Partial<Payment>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.amount !== undefined) { fields.push('amount = ?'); values.push(updates.amount); }
    if (updates.date !== undefined)   { fields.push('date = ?');   values.push(updates.date.toISOString()); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }

    if (fields.length === 0) return;

    values.push(id);
    db.runSync(`UPDATE payments SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  // ─── Configuraciones ─────────────────────────────────────────────────────────

  static getSetting(key: string): string | null {
    const row = db.getFirstSync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );
    return row?.value ?? null;
  }

  static setSetting(key: string, value: string): void {
    db.runSync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  }
}