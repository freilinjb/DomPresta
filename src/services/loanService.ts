import { Loan, Payment } from '../types';

export class LoanService {
  static async getLoans(): Promise<Loan[]> {
    // Mock data - replace with actual API call
    return [
      {
        id: '1',
        borrowerName: 'Juan Pérez',
        amount: 5000,
        interestRate: 10,
        term: 12,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'active',
        payments: [],
      },
      // Add more mock loans
    ];
  }

  static async getLoanDetails(id: string): Promise<Loan | null> {
    const loans = await this.getLoans();
    return loans.find(loan => loan.id === id) || null;
  }

  static async createLoan(loan: Omit<Loan, 'id'>): Promise<Loan> {
    // Mock implementation
    const newLoan: Loan = {
      ...loan,
      id: Date.now().toString(),
    };
    return newLoan;
  }

  static async updateLoan(id: string, updates: Partial<Loan>): Promise<Loan | null> {
    // Mock implementation
    const loan = await this.getLoanDetails(id);
    if (!loan) return null;
    return { ...loan, ...updates };
  }
}