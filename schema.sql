-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Users (Profiles linked to Auth)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id),
    full_name TEXT,
    role TEXT CHECK (role IN ('super_admin', 'finance_manager', 'accountant', 'auditor')) DEFAULT 'accountant',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Branches
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bank Accounts
CREATE TABLE public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ifsc TEXT,
    opening_balance NUMERIC(15, 2) DEFAULT 0.00,
    current_balance NUMERIC(15, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ledgers
CREATE TABLE public.ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ledger_type TEXT NOT NULL,
    opening_balance NUMERIC(15, 2) DEFAULT 0.00,
    current_balance NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Parties
CREATE TABLE public.parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    party_type TEXT CHECK (party_type IN ('customer', 'vendor', 'employee', 'contractor')),
    name TEXT NOT NULL,
    pan TEXT,
    gstin TEXT,
    contact TEXT,
    email TEXT,
    address TEXT,
    credit_limit NUMERIC(15, 2) DEFAULT 0.00,
    outstanding_balance NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    voucher_number TEXT NOT NULL,
    voucher_type TEXT CHECK (voucher_type IN ('receipt', 'payment', 'journal', 'contra', 'purchase', 'sales', 'expense', 'income', 'transfer')),
    transaction_date DATE NOT NULL,
    debit_account_id UUID REFERENCES public.ledgers(id),
    credit_account_id UUID REFERENCES public.ledgers(id),
    ledger_id UUID REFERENCES public.ledgers(id),
    bank_account_id UUID REFERENCES public.bank_accounts(id),
    party_id UUID REFERENCES public.parties(id),
    amount NUMERIC(15, 2) NOT NULL,
    gst NUMERIC(15, 2) DEFAULT 0.00,
    tds NUMERIC(15, 2) DEFAULT 0.00,
    payment_mode TEXT,
    utr TEXT,
    cheque_number TEXT,
    invoice_number TEXT,
    reference_number TEXT,
    remarks TEXT,
    created_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Transaction Attachments
CREATE TABLE public.transaction_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reconciliations
CREATE TABLE public.reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
    statement_date DATE NOT NULL,
    matched_count INT DEFAULT 0,
    unmatched_count INT DEFAULT 0,
    difference NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id UUID,
    previous_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow all for authenticated users temporarily for development
CREATE POLICY "Allow all for authenticated users" ON public.companies FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.branches FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.bank_accounts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.ledgers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.parties FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.transaction_attachments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.reconciliations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.audit_logs FOR ALL TO authenticated USING (true);
