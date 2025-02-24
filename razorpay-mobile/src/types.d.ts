export interface BankAccountItem {
  fundAccountId: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

export interface TransactionItem {
  payoutId: string;
  amount: number;
  status: string;
  timestamp: string;
}
