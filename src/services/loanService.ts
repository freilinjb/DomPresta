import { Loan, Payment } from '../types';
import { DatabaseService } from './databaseService';

export class LoanService {
  static async getLoans(): Promise<Loan[]> {
    try {
      return await DatabaseService.getLoans();
    } catch (error) {
      console.error('Error getting loans:', error);
      return [];
    }
  }

  static async getLoanDetails(id: string): Promise<Loan | null> {
    try {
      return await DatabaseService.getLoanById(id);
    } catch (error) {
      console.error('Error getting loan details:', error);
      return null;
    }
  }

  static async createLoan(loan: Omit<Loan, 'id' | 'payments'>): Promise<Loan> {
    try {
      return await DatabaseService.createLoan(loan);
    } catch (error) {
      console.error('Error creating loan:', error);
      throw error;
    }
  }

  static async updateLoan(id: string, updates: Partial<Loan>): Promise<Loan | null> {
    try {
      await DatabaseService.updateLoan(id, updates);
      return await this.getLoanDetails(id);
    } catch (error) {
      console.error('Error updating loan:', error);
      return null;
    }
  }

  static async deleteLoan(id: string): Promise<boolean> {
    try {
      await DatabaseService.deleteLoan(id);
      return true;
    } catch (error) {
      console.error('Error deleting loan:', error);
      return false;
    }
  }

  // Métodos para pagos
  static async createPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    try {
      return await DatabaseService.createPayment(payment);
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  static async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | null> {
    try {
      await DatabaseService.updatePayment(id, updates);
      // Devolver el pago actualizado (simplificado)
      return null; // En una implementación completa, buscar el pago actualizado
    } catch (error) {
      console.error('Error updating payment:', error);
      return null;
    }
  }

  // Métodos de utilidad
  static calculateMonthlyPayment(amount: number, interestRate: number, term: number): number {
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = term;
    return (amount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
           (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  }

  static calculateTotalInterest(amount: number, interestRate: number, term: number): number {
    const monthlyPayment = this.calculateMonthlyPayment(amount, interestRate, term);
    return (monthlyPayment * term) - amount;
  }

  static generatePaymentSchedule(loan: Loan): Payment[] {
    const monthlyPayment = this.calculateMonthlyPayment(loan.amount, loan.interestRate, loan.term);
    const payments: Payment[] = [];
    let remainingBalance = loan.amount;

    for (let i = 1; i <= loan.term; i++) {
      const interestPayment = remainingBalance * (loan.interestRate / 100 / 12);
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      const paymentDate = new Date(loan.startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);

      payments.push({
        id: `payment_${i}`,
        loanId: loan.id,
        amount: monthlyPayment,
        date: paymentDate,
        status: paymentDate <= new Date() ? 'pending' : 'pending'
      });
    }

    return payments;
  }
}