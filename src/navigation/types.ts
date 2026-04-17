export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  LoanDetails: { loanId: string };
  LoanForm: { loanId?: string };
  PaymentForm: { loanId: string };
  Reports: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Loans: undefined;
  Profile: undefined;
  Settings: undefined;
};