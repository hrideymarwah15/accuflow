// Database types matching Supabase schema

export type UserRole = 'super_admin' | 'finance_manager' | 'accountant' | 'auditor';
export type PartyType = 'customer' | 'vendor' | 'employee' | 'contractor';
export type VoucherType = 'receipt' | 'payment' | 'journal' | 'contra' | 'purchase' | 'sales' | 'expense' | 'income' | 'transfer';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';
export type BankAccountStatus = 'active' | 'archived';

export interface Company {
  id: string;
  name: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  company_id: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
}

export interface BankAccount {
  id: string;
  company_id: string;
  bank_name: string;
  account_number: string;
  ifsc: string | null;
  opening_balance: number;
  current_balance: number;
  status: BankAccountStatus;
  created_at: string;
}

export interface Ledger {
  id: string;
  company_id: string;
  name: string;
  ledger_type: string;
  opening_balance: number;
  current_balance: number;
  created_at: string;
}

export interface Party {
  id: string;
  company_id: string;
  party_type: PartyType;
  name: string;
  pan: string | null;
  gstin: string | null;
  contact: string | null;
  email: string | null;
  address: string | null;
  credit_limit: number;
  outstanding_balance: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  company_id: string;
  voucher_number: string;
  voucher_type: VoucherType;
  transaction_date: string;
  debit_account_id: string | null;
  credit_account_id: string | null;
  ledger_id: string | null;
  bank_account_id: string | null;
  party_id: string | null;
  amount: number;
  gst: number;
  tds: number;
  payment_mode: string | null;
  utr: string | null;
  cheque_number: string | null;
  invoice_number: string | null;
  reference_number: string | null;
  remarks: string | null;
  created_by: string | null;
  approved_by: string | null;
  status: TransactionStatus;
  created_at: string;
  // Joined fields
  debit_account?: Ledger;
  credit_account?: Ledger;
  ledger?: Ledger;
  bank_account?: BankAccount;
  party?: Party;
}

export interface TransactionAttachment {
  id: string;
  transaction_id: string;
  file_path: string;
  created_at: string;
}

export interface Reconciliation {
  id: string;
  bank_account_id: string;
  statement_date: string;
  matched_count: number;
  unmatched_count: number;
  difference: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

// Dashboard summary types
export interface DashboardSummary {
  todayReceipts: number;
  todayPayments: number;
  cashBalance: number;
  bankBalance: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  pendingReconciliation: number;
  pendingApprovals: number;
}
