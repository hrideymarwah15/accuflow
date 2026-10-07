import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../hooks/use-app-store';
import { useAuth } from '../hooks/use-auth';
import { getTransactions, createTransaction, deleteTransaction, getLedgers, getParties, getBankAccounts } from '../lib/api';
import type { Transaction, Ledger, Party, BankAccount, VoucherType } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Loader2, Search, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const VOUCHER_TYPES: VoucherType[] = ['receipt', 'payment', 'journal', 'contra', 'purchase', 'sales', 'expense', 'income', 'transfer'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value);

const voucherColors: Record<string, string> = {
  receipt: 'border-emerald-500/30 text-emerald-400',
  sales: 'border-emerald-500/30 text-emerald-400',
  income: 'border-emerald-500/30 text-emerald-400',
  payment: 'border-red-500/30 text-red-400',
  purchase: 'border-red-500/30 text-red-400',
  expense: 'border-red-500/30 text-red-400',
  journal: 'border-blue-500/30 text-blue-400',
  contra: 'border-amber-500/30 text-amber-400',
  transfer: 'border-purple-500/30 text-purple-400',
};

export default function Transactions() {
  const { company } = useAppStore();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    voucher_number: '',
    voucher_type: '' as VoucherType | '',
    transaction_date: new Date().toISOString().split('T')[0],
    debit_account_id: '',
    credit_account_id: '',
    party_id: '',
    bank_account_id: '',
    amount: '',
    gst: '0',
    tds: '0',
    payment_mode: '',
    utr: '',
    cheque_number: '',
    invoice_number: '',
    reference_number: '',
    remarks: '',
  });

  const loadData = useCallback(async () => {
    if (!company) return;
    try {
      const [txns, ldgrs, prts, bnks] = await Promise.all([
        getTransactions(company.id),
        getLedgers(company.id),
        getParties(company.id),
        getBankAccounts(company.id),
      ]);
      setTransactions(txns);
      setLedgers(ldgrs);
      setParties(prts);
      setBankAccounts(bnks);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { loadData(); }, [loadData]);

  const generateVoucherNumber = (type: string) => {
    const prefix = type.slice(0, 3).toUpperCase();
    const num = String(transactions.length + 1).padStart(4, '0');
    return `${prefix}-${num}`;
  };

  const openCreateDialog = () => {
    setForm({
      voucher_number: '',
      voucher_type: '',
      transaction_date: new Date().toISOString().split('T')[0],
      debit_account_id: '',
      credit_account_id: '',
      party_id: '',
      bank_account_id: '',
      amount: '',
      gst: '0',
      tds: '0',
      payment_mode: '',
      utr: '',
      cheque_number: '',
      invoice_number: '',
      reference_number: '',
      remarks: '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!company || !form.voucher_type || !form.amount || !form.transaction_date) return;
    setSaving(true);
    try {
      const voucherNumber = form.voucher_number || generateVoucherNumber(form.voucher_type);
      await createTransaction({
        company_id: company.id,
        voucher_number: voucherNumber,
        voucher_type: form.voucher_type as VoucherType,
        transaction_date: form.transaction_date,
        debit_account_id: form.debit_account_id || null,
        credit_account_id: form.credit_account_id || null,
        ledger_id: null,
        bank_account_id: form.bank_account_id || null,
        party_id: form.party_id || null,
        amount: Number(form.amount),
        gst: Number(form.gst),
        tds: Number(form.tds),
        payment_mode: form.payment_mode || null,
        utr: form.utr || null,
        cheque_number: form.cheque_number || null,
        invoice_number: form.invoice_number || null,
        reference_number: form.reference_number || null,
        remarks: form.remarks || null,
        created_by: user?.id || null,
        approved_by: null,
        status: 'pending',
      });
      await loadData();
      setDialogOpen(false);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try { await deleteTransaction(id); await loadData(); }
    catch (err) { console.error('Delete failed:', err); }
  };

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.voucher_number.toLowerCase().includes(search.toLowerCase()) ||
      t.voucher_type.toLowerCase().includes(search.toLowerCase()) ||
      (t.party?.name && t.party.name.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType === 'all' || t.voucher_type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-zinc-500 text-sm mt-1">Record and manage all financial vouchers.</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="h-4 w-4" /> New Transaction
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 w-[250px]"
          />
        </div>
        <Tabs value={filterType} onValueChange={setFilterType}>
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-white text-xs">All</TabsTrigger>
            <TabsTrigger value="receipt" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-emerald-400 text-xs">Receipt</TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-red-400 text-xs">Payment</TabsTrigger>
            <TabsTrigger value="journal" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-blue-400 text-xs">Journal</TabsTrigger>
            <TabsTrigger value="sales" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-emerald-400 text-xs">Sales</TabsTrigger>
            <TabsTrigger value="purchase" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-red-400 text-xs">Purchase</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <ArrowLeftRight className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No transactions found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Voucher #</TableHead>
                <TableHead className="text-zinc-400">Type</TableHead>
                <TableHead className="text-zinc-400">Date</TableHead>
                <TableHead className="text-zinc-400">Party</TableHead>
                <TableHead className="text-zinc-400 text-right">Amount</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400 text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((txn) => (
                <TableRow key={txn.id} className="border-zinc-800 hover:bg-zinc-900/60">
                  <TableCell className="font-mono text-sm text-zinc-200">{txn.voucher_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('capitalize', voucherColors[txn.voucher_type] || '')}>
                      {txn.voucher_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">{txn.transaction_date}</TableCell>
                  <TableCell className="text-zinc-300">{txn.party?.name || '—'}</TableCell>
                  <TableCell className={cn('text-right font-semibold', ['receipt', 'sales', 'income'].includes(txn.voucher_type) ? 'text-emerald-400' : 'text-red-400')}>
                    {formatCurrency(txn.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      'capitalize text-xs',
                      txn.status === 'approved' && 'border-emerald-500/30 text-emerald-400',
                      txn.status === 'pending' && 'border-amber-500/30 text-amber-400',
                      txn.status === 'rejected' && 'border-red-500/30 text-red-400',
                    )}>
                      {txn.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(txn.id)} className="h-8 w-8 text-zinc-400 hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
            <DialogDescription className="text-zinc-400">Record a new financial voucher entry.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Voucher Type *</Label>
              <Select value={form.voucher_type} onValueChange={(v) => { if (v) setForm({ ...form, voucher_type: v as VoucherType, voucher_number: generateVoucherNumber(v) }); }}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {VOUCHER_TYPES.map((t) => <SelectItem key={t} value={t} className="text-zinc-200 capitalize focus:bg-zinc-700 focus:text-white">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Voucher Number</Label>
              <Input value={form.voucher_number} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, voucher_number: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Auto-generated" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Date *</Label>
              <Input type="date" value={form.transaction_date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, transaction_date: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Amount (₹) *</Label>
              <Input type="number" value={form.amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, amount: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Debit Account</Label>
              <Select value={form.debit_account_id} onValueChange={(v) => setForm({ ...form, debit_account_id: v ?? '' })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Select ledger" /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {ledgers.map((l) => <SelectItem key={l.id} value={l.id} className="text-zinc-200 focus:bg-zinc-700 focus:text-white">{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Credit Account</Label>
              <Select value={form.credit_account_id} onValueChange={(v) => setForm({ ...form, credit_account_id: v ?? '' })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Select ledger" /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {ledgers.map((l) => <SelectItem key={l.id} value={l.id} className="text-zinc-200 focus:bg-zinc-700 focus:text-white">{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Party</Label>
              <Select value={form.party_id} onValueChange={(v) => setForm({ ...form, party_id: v ?? '' })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Select party" /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {parties.map((p) => <SelectItem key={p.id} value={p.id} className="text-zinc-200 focus:bg-zinc-700 focus:text-white">{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Bank Account</Label>
              <Select value={form.bank_account_id} onValueChange={(v) => setForm({ ...form, bank_account_id: v ?? '' })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Select bank" /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {bankAccounts.map((b) => <SelectItem key={b.id} value={b.id} className="text-zinc-200 focus:bg-zinc-700 focus:text-white">{b.bank_name} - {b.account_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">GST (₹)</Label>
              <Input type="number" value={form.gst} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, gst: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">TDS (₹)</Label>
              <Input type="number" value={form.tds} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, tds: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Payment Mode</Label>
              <Select value={form.payment_mode} onValueChange={(v) => setForm({ ...form, payment_mode: v ?? '' })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Select mode" /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card', 'Other'].map((m) => <SelectItem key={m} value={m.toLowerCase()} className="text-zinc-200 focus:bg-zinc-700 focus:text-white">{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">UTR / Reference</Label>
              <Input value={form.utr} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, utr: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label className="text-zinc-300">Remarks</Label>
              <Input value={form.remarks} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, remarks: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700 text-zinc-300">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.voucher_type || !form.amount || !form.transaction_date} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
