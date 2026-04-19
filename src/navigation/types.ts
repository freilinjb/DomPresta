export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  LoanDetails: { loanId: string };
  LoanForm: { loanId?: string };
  PaymentForm: { loanId: string };
  Reports: undefined;
  ClientForm: { clientId?: string };
  VendorForm: { vendorId?: string };
  LoanRequestForm: { requestId?: string };
  CashRegister: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Loans: undefined;
  Clients: undefined;
  Vendors: undefined;
  LoanRequests: undefined;
  CashRegister: undefined;
  Profile: undefined;
  Settings: undefined;
};