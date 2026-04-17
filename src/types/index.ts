export interface Loan {
  id: string;
  borrowerName: string;
  amount: number;
  interestRate: number;
  term: number; // in months
  startDate: Date;
  endDate: Date;
  status: 'active' | 'paid' | 'overdue';
  payments: Payment[];
}

export interface Payment {
  id: string;
  loanId: string;
  amount: number;
  date: Date;
  status: 'paid' | 'pending' | 'overdue';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}