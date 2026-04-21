export type RootStackParamList = {
  Login: undefined;
  MainDrawer: undefined;
  ClientDetails: { clientId: string };
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
  Profile: undefined;
};

export type DrawerParamList = {
  MainTabs: undefined;
  Vendors: undefined;
  LoanRequests: undefined;
  CashRegister: undefined;
  Settings: undefined;
  Reports: undefined;
};