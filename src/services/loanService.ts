import db from '../database/db';
import { Loan, AmortizationDetail } from '../types';

export interface LoanInput {
  id?: string;
  clientId: string;
  loanTypeId: string;
  loanTypeName: string;
  loanTypeCategory: string;
  amount: number;
  interestRate: number;
  term: number;
  paymentFrequency: string;
  startDate: string;
  firstPaymentDate: string;
  periodicPayment: number;
  totalInterest: number;
  totalAmount: number;
  remainingBalance?: number;
  status?: 'pending' | 'active' | 'paid' | 'overdue' | 'cancelled';
  cashBoxId?: string;
  paymentMethodId?: string;
  referenceCode?: string;
  guarantorName?: string;
  guarantorId?: string;
  guarantorPhone?: string;
  guarantorAddress?: string;
  guaranteeType?: string;
  guaranteeValue?: number;
  guaranteeDescription?: string;
  guaranteeFileNumber?: string;
  guaranteeNotes?: string;
  sanIncludeWeekends?: boolean;
  sanFirstPaymentTomorrow?: boolean;
  informalProfitPercentage?: number;
  informalGracePeriod?: number;
  informalLateFeePercentage?: number;
  legalFees?: number;
  lateFee?: number;
  commission?: number;
  insuranceAmount?: number;
  initialPayment?: number;
  notes?: string;
  amortizationSchedule?: AmortizationDetail[];
}

class LoanService {
  async create(loan: LoanInput): Promise<Loan> {
    const id = loan.id || this.generateId();
    const now = new Date().toISOString();
    const endDate = this.calculateEndDate(loan.firstPaymentDate, loan.term, loan.paymentFrequency);

    const newLoan: any = {
      id,
      ...loan,
      remainingBalance: loan.remainingBalance ?? loan.totalAmount,
      status: loan.status || 'active',
      sanIncludeWeekends: loan.sanIncludeWeekends ? 1 : 0,
      sanFirstPaymentTomorrow: loan.sanFirstPaymentTomorrow ? 1 : 0,
      endDate,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.execAsync('BEGIN TRANSACTION');

      // Insertar préstamo
      await db.runAsync(
        `INSERT INTO loans (
          id, clientId, loanTypeId, loanTypeName, loanTypeCategory,
          amount, interestRate, term, paymentFrequency, startDate,
          firstPaymentDate, endDate, periodicPayment, totalInterest,
          totalAmount, remainingBalance, status, cashBoxId, paymentMethodId,
          referenceCode, guarantorName, guarantorId, guarantorPhone,
          guarantorAddress, guaranteeType, guaranteeValue, guaranteeDescription,
          guaranteeFileNumber, guaranteeNotes, sanIncludeWeekends,
          sanFirstPaymentTomorrow, informalProfitPercentage, informalGracePeriod,
          informalLateFeePercentage, legalFees, lateFee, commission,
          insuranceAmount, initialPayment, createdAt, updatedAt, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newLoan.id, newLoan.clientId, newLoan.loanTypeId, newLoan.loanTypeName,
          newLoan.loanTypeCategory, newLoan.amount, newLoan.interestRate,
          newLoan.term, newLoan.paymentFrequency, newLoan.startDate,
          newLoan.firstPaymentDate, newLoan.endDate, newLoan.periodicPayment,
          newLoan.totalInterest, newLoan.totalAmount, newLoan.remainingBalance,
          newLoan.status, newLoan.cashBoxId, newLoan.paymentMethodId,
          newLoan.referenceCode, newLoan.guarantorName, newLoan.guarantorId,
          newLoan.guarantorPhone, newLoan.guarantorAddress, newLoan.guaranteeType,
          newLoan.guaranteeValue, newLoan.guaranteeDescription,
          newLoan.guaranteeFileNumber, newLoan.guaranteeNotes,
          newLoan.sanIncludeWeekends, newLoan.sanFirstPaymentTomorrow,
          newLoan.informalProfitPercentage, newLoan.informalGracePeriod,
          newLoan.informalLateFeePercentage, newLoan.legalFees, newLoan.lateFee,
          newLoan.commission, newLoan.insuranceAmount, newLoan.initialPayment,
          newLoan.createdAt, newLoan.updatedAt, newLoan.notes
        ]
      );

      // Insertar amortización
      if (loan.amortizationSchedule && loan.amortizationSchedule.length > 0) {
        for (const item of loan.amortizationSchedule) {
          await db.runAsync(
            `INSERT INTO loan_amortization (
              id, loanId, period, paymentDate, payment, principal,
              interest, remaining, status, isWeekend, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              this.generateId(),
              id,
              item.period,
              item.payment_date || '',
              item.payment,
              item.principal,
              item.interest,
              item.remaining,
              item.status || 'pending',
              item.is_weekend ? 1 : 0,
              now
            ]
          );
        }
      }

      // Actualizar contadores del cliente
      await db.runAsync(
        `UPDATE clients SET 
          totalLoans = totalLoans + 1,
          activeLoans = activeLoans + 1,
          totalAmount = totalAmount + ?,
          lastContact = ?
        WHERE id = ?`,
        [loan.totalAmount, now, loan.clientId]
      );

      await db.execAsync('COMMIT');
      
      return newLoan as Loan;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      console.error('Error al crear préstamo:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<Loan | null> {
    try {
      const loan = await db.getFirstAsync<any>(
        `SELECT 
          l.*,
          c.firstName || ' ' || c.lastName as borrowerName
        FROM loans l
        LEFT JOIN clients c ON l.clientId = c.id
        WHERE l.id = ?`,
        [id]
      );
      
      if (!loan) return null;

      const amortization = await db.getAllAsync<any>(
        'SELECT * FROM loan_amortization WHERE loanId = ? ORDER BY period',
        [id]
      );

      return {
        ...this.mapToLoan(loan),
        amortizationSchedule: amortization.map(this.mapToAmortization)
      };
    } catch (error) {
      console.error('Error al obtener préstamo:', error);
      throw error;
    }
  }

  async getByClientId(clientId: string): Promise<Loan[]> {
    try {
      const loans = await db.getAllAsync<any>(
        'SELECT * FROM loans WHERE clientId = ? ORDER BY createdAt DESC',
        [clientId]
      );
      
      return loans.map(this.mapToLoan);
    } catch (error) {
      console.error('Error al obtener préstamos del cliente:', error);
      throw error;
    }
  }

  async getAll(): Promise<Loan[]> {
    try {
      // ✅ JOIN con clients para obtener el nombre del cliente
      const loans = await db.getAllAsync<any>(
        `SELECT 
          l.*,
          c.firstName || ' ' || c.lastName as borrowerName
        FROM loans l
        LEFT JOIN clients c ON l.clientId = c.id
        ORDER BY l.createdAt DESC`
      );
      
      return loans.map(row => this.mapToLoan(row));
    } catch (error) {
      console.error('Error al obtener préstamos:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<LoanInput>): Promise<Loan | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) return null;

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.runAsync(
        `UPDATE loans SET
          amount = ?, interestRate = ?, term = ?, status = ?,
          remainingBalance = ?, updatedAt = ?
        WHERE id = ?`,
        [
          updated.amount,
          updated.interestRate,
          updated.term,
          updated.status,
          updated.remainingBalance,
          updated.updatedAt,
          id
        ]
      );

      return updated;
    } catch (error) {
      console.error('Error al actualizar préstamo:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await db.execAsync('BEGIN TRANSACTION');

      const loan = await this.getById(id);
      
      // Eliminar amortización
      await db.runAsync('DELETE FROM loan_amortization WHERE loanId = ?', [id]);
      
      // Eliminar préstamo
      const result = await db.runAsync('DELETE FROM loans WHERE id = ?', [id]);

      if (loan) {
        // Actualizar contadores del cliente
        await db.runAsync(
          `UPDATE clients SET 
            totalLoans = totalLoans - 1,
            activeLoans = activeLoans - 1,
            totalAmount = totalAmount - ?
          WHERE id = ?`,
          [loan.totalAmount, loan.clientId]
        );
      }

      await db.execAsync('COMMIT');
      return result.changes > 0;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      console.error('Error al eliminar préstamo:', error);
      throw error;
    }
  }

  async getStats(): Promise<any> {
    try {
      const stats = await db.getFirstAsync<any>(`
        SELECT 
          COUNT(*) as total,
          SUM(amount) as totalAmount,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
          SUM(remainingBalance) as totalRemaining
        FROM loans
      `);

      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateEndDate(startDate: string, term: number, frequency: string): string {
    const date = new Date(startDate);
    const daysMap: Record<string, number> = {
      daily: 1,
      business_daily: 1,
      weekly: 7,
      biweekly: 15,
      monthly: 30
    };
    const days = (daysMap[frequency] || 30) * term;
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  private mapToLoan(row: any): Loan {
    return {
      id: row.id,
      clientId: row.clientId,
      loanTypeId: row.loanTypeId,
      loanTypeName: row.loanTypeName,
      loanTypeCategory: row.loanTypeCategory,
      amount: row.amount,
      interestRate: row.interestRate,
      term: row.term,
      paymentFrequency: row.paymentFrequency,
      startDate: row.startDate,
      firstPaymentDate: row.firstPaymentDate,
      endDate: row.endDate,
      periodicPayment: row.periodicPayment,
      totalInterest: row.totalInterest,
      totalAmount: row.totalAmount,
      remainingBalance: row.remainingBalance,
      status: row.status,
      cashBoxId: row.cashBoxId,
      paymentMethodId: row.paymentMethodId,
      referenceCode: row.referenceCode,
      guarantorName: row.guarantorName,
      guarantorId: row.guarantorId,
      guarantorPhone: row.guarantorPhone,
      guarantorAddress: row.guarantorAddress,
      guaranteeType: row.guaranteeType,
      guaranteeValue: row.guaranteeValue,
      guaranteeDescription: row.guaranteeDescription,
      guaranteeFileNumber: row.guaranteeFileNumber,
      guaranteeNotes: row.guaranteeNotes,
      sanIncludeWeekends: row.sanIncludeWeekends === 1,
      sanFirstPaymentTomorrow: row.sanFirstPaymentTomorrow === 1,
      informalProfitPercentage: row.informalProfitPercentage,
      informalGracePeriod: row.informalGracePeriod,
      informalLateFeePercentage: row.informalLateFeePercentage,
      legalFees: row.legalFees,
      lateFee: row.lateFee,
      commission: row.commission,
      insuranceAmount: row.insuranceAmount,
      initialPayment: row.initialPayment,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      notes: row.notes,
    };
  }

  private mapToAmortization(row: any): AmortizationDetail {
    return {
      period: row.period,
      payment: row.payment,
      principal: row.principal,
      interest: row.interest,
      remaining: row.remaining,
      status: row.status,
      payment_date: row.paymentDate,
      is_weekend: row.isWeekend === 1,
    };
  }
}

export const loanService = new LoanService();