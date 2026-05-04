import db from '../database/db';
import { settingsService } from './settingsService';

export interface PaymentInput {
  id?: string;
  loanId: string;
  clientId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceCode?: string;
  notes?: string;
}

export interface Payment extends PaymentInput {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

class PaymentService {
  async create(payment: PaymentInput): Promise<Payment> {
    const id = payment.id || this.generateId();
    const now = new Date().toISOString();

    const newPayment: Payment = {
      ...payment,
      id,
      createdAt: now,
    };

    try {
      await db.execAsync('BEGIN TRANSACTION');

      // Insertar pago
      await db.runAsync(
        `INSERT INTO payments (
          id, loanId, clientId, amount, paymentDate, paymentMethod,
          referenceCode, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newPayment.id,
          newPayment.loanId,
          newPayment.clientId,
          newPayment.amount,
          newPayment.paymentDate,
          newPayment.paymentMethod,
          newPayment.referenceCode || null,
          newPayment.notes || null,
          newPayment.createdAt
        ]
      );

      // Actualizar balance restante del préstamo
      await db.runAsync(
        `UPDATE loans SET
          remainingBalance = remainingBalance - ?,
          updatedAt = ?
        WHERE id = ?`,
        [payment.amount, now, payment.loanId]
      );

      // Marcar amortizaciones como pagadas (simplificado: marcar la primera pendiente)
      const amortization = await db.getFirstAsync<any>(
        `SELECT id FROM loan_amortization
         WHERE loanId = ? AND status = 'pending'
         ORDER BY period LIMIT 1`,
        [payment.loanId]
      );

      if (amortization) {
        await db.runAsync(
          `UPDATE loan_amortization SET
            status = 'paid',
            updatedAt = ?
          WHERE id = ?`,
          [now, amortization.id]
        );
      }

      // Si el balance llega a 0, marcar préstamo como pagado
      const loan = await db.getFirstAsync<any>(
        'SELECT remainingBalance FROM loans WHERE id = ?',
        [payment.loanId]
      );

      if (loan && loan.remainingBalance <= 0) {
        await db.runAsync(
          `UPDATE loans SET
            status = 'paid',
            updatedAt = ?
          WHERE id = ?`,
          [now, payment.loanId]
        );
      }

      await db.execAsync('COMMIT');

      return newPayment;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      console.error('Error al crear pago:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<Payment | null> {
    try {
      const payment = await db.getFirstAsync<Payment>(
        'SELECT * FROM payments WHERE id = ?',
        [id]
      );
      return payment || null;
    } catch (error) {
      console.error('Error al obtener pago:', error);
      throw error;
    }
  }

  async getByLoanId(loanId: string): Promise<Payment[]> {
    try {
      const payments = await db.getAllAsync<Payment>(
        'SELECT * FROM payments WHERE loanId = ? ORDER BY paymentDate DESC',
        [loanId]
      );
      return payments;
    } catch (error) {
      console.error('Error al obtener pagos del préstamo:', error);
      throw error;
    }
  }

  async getByClientId(clientId: string): Promise<Payment[]> {
    try {
      const payments = await db.getAllAsync<Payment>(
        'SELECT * FROM payments WHERE clientId = ? ORDER BY paymentDate DESC',
        [clientId]
      );
      return payments;
    } catch (error) {
      console.error('Error al obtener pagos del cliente:', error);
      throw error;
    }
  }

  async getAll(): Promise<Payment[]> {
    try {
      const payments = await db.getAllAsync<Payment>(
        'SELECT * FROM payments ORDER BY paymentDate DESC'
      );
      return payments;
    } catch (error) {
      console.error('Error al obtener pagos:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<PaymentInput>): Promise<Payment | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) return null;

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.runAsync(
        `UPDATE payments SET
          amount = ?, paymentDate = ?, paymentMethod = ?,
          referenceCode = ?, notes = ?, updatedAt = ?
        WHERE id = ?`,
        [
          updated.amount,
          updated.paymentDate,
          updated.paymentMethod,
          updated.referenceCode,
          updated.notes,
          updated.updatedAt,
          id
        ]
      );

      return updated;
    } catch (error) {
      console.error('Error al actualizar pago:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await db.execAsync('BEGIN TRANSACTION');

      const payment = await this.getById(id);
      if (!payment) return false;

      // Revertir el balance del préstamo
      await db.runAsync(
        `UPDATE loans SET
          remainingBalance = remainingBalance + ?,
          updatedAt = ?
        WHERE id = ?`,
        [payment.amount, new Date().toISOString(), payment.loanId]
      );

      // Marcar amortización como pendiente nuevamente (simplificado)
      const amortization = await db.getFirstAsync<any>(
        `SELECT id FROM loan_amortization
         WHERE loanId = ? AND status = 'paid'
         ORDER BY period DESC LIMIT 1`,
        [payment.loanId]
      );

      if (amortization) {
        await db.runAsync(
          `UPDATE loan_amortization SET
            status = 'pending',
            updatedAt = ?
          WHERE id = ?`,
          [new Date().toISOString(), amortization.id]
        );
      }

      // Eliminar pago
      const result = await db.runAsync('DELETE FROM payments WHERE id = ?', [id]);

      await db.execAsync('COMMIT');
      return result.changes > 0;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      console.error('Error al eliminar pago:', error);
      throw error;
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async generateReceipt(paymentId: string): Promise<any> {
    try {
      const payment = await this.getById(paymentId);
      if (!payment) throw new Error('Pago no encontrado');

      // Obtener datos del préstamo y cliente
      const loan = await db.getFirstAsync<any>(
        `SELECT l.*, c.firstName, c.lastName, c.documentNumber
         FROM loans l
         LEFT JOIN clients c ON l.clientId = c.id
         WHERE l.id = ?`,
        [payment.loanId]
      );

      if (!loan) throw new Error('Préstamo no encontrado');

      // Obtener configuraciones
      const currency = await settingsService.get('currency') || 'DOP';
      const companyName = await settingsService.get('company_name') || 'DomPresta';
      const companyAddress = await settingsService.get('company_address') || '';
      const companyPhone = await settingsService.get('company_phone') || '';
      const companyEmail = await settingsService.get('company_email') || '';

      const formatCurrency = (amount: number) => `${currency} ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

      return {
        receiptNumber: payment.id,
        company: {
          name: companyName,
          address: companyAddress,
          phone: companyPhone,
          email: companyEmail,
        },
        client: {
          name: `${loan.firstName} ${loan.lastName}`,
          document: loan.documentNumber,
        },
        loan: {
          id: loan.id,
          amount: formatCurrency(loan.amount),
          remainingBalance: formatCurrency(loan.remainingBalance),
        },
        payment: {
          amount: formatCurrency(payment.amount),
          date: new Date(payment.paymentDate).toLocaleDateString('es-DO'),
          method: payment.paymentMethod,
          reference: payment.referenceCode,
          notes: payment.notes,
        },
        generatedAt: new Date().toLocaleString('es-DO'),
      };
    } catch (error) {
      console.error('Error al generar recibo:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();