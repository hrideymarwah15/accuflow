import { supabase } from './supabase';
import type {
  BankAccount,
  Ledger,
  Party,
  Transaction,
  AuditLog,
  UserProfile,
  Company,
} from './types';

// ─── Company ────────────────────────────────────────────────────────
export async function getOrCreateCompany(userId: string): Promise<Company> {
  // Check if user has a profile with a company
  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', userId)
    .single();

  if (profile?.company_id) {
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();
    if (error) throw error;
    return company;
  }

  // Create a default company and assign to user
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({ name: 'My Company' })
    .select()
    .single();
  if (companyError) throw companyError;

  // Upsert user profile
  await supabase
    .from('users')
    .upsert({ id: userId, company_id: company.id, role: 'super_admin' });

  return company;
}

// ─── User Profile ───────────────────────────────────────────────────
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ─── Bank Accounts ──────────────────────────────────────────────────
export async function getBankAccounts(companyId: string): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createBankAccount(account: Omit<BankAccount, 'id' | 'created_at' | 'current_balance'> & { current_balance?: number }): Promise<BankAccount> {
  const insertData = {
    ...account,
    current_balance: account.current_balance ?? account.opening_balance,
  };
  const { data, error } = await supabase
    .from('bank_accounts')
    .insert(insertData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBankAccount(id: string, updates: Partial<BankAccount>): Promise<BankAccount> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBankAccount(id: string): Promise<void> {
  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── Ledgers ────────────────────────────────────────────────────────
export async function getLedgers(companyId: string): Promise<Ledger[]> {
  const { data, error } = await supabase
    .from('ledgers')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createLedger(ledger: Omit<Ledger, 'id' | 'created_at' | 'current_balance'> & { current_balance?: number }): Promise<Ledger> {
  const insertData = {
    ...ledger,
    current_balance: ledger.current_balance ?? ledger.opening_balance,
  };
  const { data, error } = await supabase
    .from('ledgers')
    .insert(insertData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLedger(id: string, updates: Partial<Ledger>): Promise<Ledger> {
  const { data, error } = await supabase
    .from('ledgers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLedger(id: string): Promise<void> {
  const { error } = await supabase.from('ledgers').delete().eq('id', id);
  if (error) throw error;
}

// ─── Parties ────────────────────────────────────────────────────────
export async function getParties(companyId: string): Promise<Party[]> {
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createParty(party: Omit<Party, 'id' | 'created_at'>): Promise<Party> {
  const { data, error } = await supabase
    .from('parties')
    .insert(party)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateParty(id: string, updates: Partial<Party>): Promise<Party> {
  const { data, error } = await supabase
    .from('parties')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteParty(id: string): Promise<void> {
  const { error } = await supabase.from('parties').delete().eq('id', id);
  if (error) throw error;
}

// ─── Transactions ───────────────────────────────────────────────────
export async function getTransactions(companyId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      debit_account:ledgers!transactions_debit_account_id_fkey(*),
      credit_account:ledgers!transactions_credit_account_id_fkey(*),
      party:parties(*)
    `)
    .eq('company_id', companyId)
    .order('transaction_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTransaction(txn: Omit<Transaction, 'id' | 'created_at' | 'debit_account' | 'credit_account' | 'ledger' | 'bank_account' | 'party'>): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert(txn)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { debit_account, credit_account, ledger, bank_account, party, ...cleanUpdates } = updates as Transaction;
  const { data, error } = await supabase
    .from('transactions')
    .update(cleanUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

// ─── Audit Logs ─────────────────────────────────────────────────────
export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert(log);
  if (error) throw error;
}

// ─── Dashboard Aggregations ─────────────────────────────────────────
export async function getDashboardData(companyId: string) {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [
    bankAccountsResult,
    todayReceiptsResult,
    todayPaymentsResult,
    monthlyRevenueResult,
    monthlyExpensesResult,
    pendingApprovalsResult,
    recentTransactionsResult,
  ] = await Promise.all([
    supabase.from('bank_accounts').select('current_balance').eq('company_id', companyId).eq('status', 'active'),
    supabase.from('transactions').select('amount').eq('company_id', companyId).eq('voucher_type', 'receipt').eq('transaction_date', today).eq('status', 'approved'),
    supabase.from('transactions').select('amount').eq('company_id', companyId).eq('voucher_type', 'payment').eq('transaction_date', today).eq('status', 'approved'),
    supabase.from('transactions').select('amount').eq('company_id', companyId).in('voucher_type', ['receipt', 'sales', 'income']).gte('transaction_date', monthStart).eq('status', 'approved'),
    supabase.from('transactions').select('amount').eq('company_id', companyId).in('voucher_type', ['payment', 'purchase', 'expense']).gte('transaction_date', monthStart).eq('status', 'approved'),
    supabase.from('transactions').select('id').eq('company_id', companyId).eq('status', 'pending'),
    supabase.from('transactions').select('*,party:parties(name)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(10),
  ]);

  const bankBalance = (bankAccountsResult.data || []).reduce((sum, a) => sum + Number(a.current_balance), 0);
  const todayReceipts = (todayReceiptsResult.data || []).reduce((sum, t) => sum + Number(t.amount), 0);
  const todayPayments = (todayPaymentsResult.data || []).reduce((sum, t) => sum + Number(t.amount), 0);
  const monthlyRevenue = (monthlyRevenueResult.data || []).reduce((sum, t) => sum + Number(t.amount), 0);
  const monthlyExpenses = (monthlyExpensesResult.data || []).reduce((sum, t) => sum + Number(t.amount), 0);
  const pendingApprovals = pendingApprovalsResult.data?.length || 0;
  const recentTransactions = recentTransactionsResult.data || [];

  return {
    bankBalance,
    todayReceipts,
    todayPayments,
    monthlyRevenue,
    monthlyExpenses,
    netProfit: monthlyRevenue - monthlyExpenses,
    pendingApprovals,
    recentTransactions,
  };
}
