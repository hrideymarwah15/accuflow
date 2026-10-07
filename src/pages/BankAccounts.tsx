import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../hooks/use-app-store';
import { getBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount } from '../lib/api';
import type { BankAccount } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Search, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value);

interface BankForm {
  bank_name: string;
  account_number: string;
  ifsc: string;
  opening_balance: string;
}

const emptyForm: BankForm = { bank_name: '', account_number: '', ifsc: '', opening_balance: '0' };

export default function BankAccounts() {
  const { company } = useAppStore();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BankForm>(emptyForm);

  const loadAccounts = useCallback(async () => {
    if (!company) return;
    try {
      const data = await getBankAccounts(company.id);
      setAccounts(data);
    } catch (err) { console.error('Failed to load bank accounts:', err); }
    finally { setLoading(false); }
  }, [company]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const openCreateDialog = () => {
    setEditingAccount(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (account: BankAccount) => {
    setEditingAccount(account);
    setForm({
      bank_name: account.bank_name,
      account_number: account.account_number,
      ifsc: account.ifsc || '',
      opening_balance: String(account.opening_balance),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!company || !form.bank_name || !form.account_number) return;
    setSaving(true);
    try {
      if (editingAccount) {
        await updateBankAccount(editingAccount.id, {
          bank_name: form.bank_name,
          account_number: form.account_number,
          ifsc: form.ifsc || null,
          opening_balance: Number(form.opening_balance),
        });
      } else {
        await createBankAccount({
          company_id: company.id,
          bank_name: form.bank_name,
          account_number: form.account_number,
          ifsc: form.ifsc || null,
          opening_balance: Number(form.opening_balance),
          status: 'active',
        });
      }
      await loadAccounts();
      setDialogOpen(false);
    } catch (err) { console.error('Save failed:', err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bank account?')) return;
    try { await deleteBankAccount(id); await loadAccounts(); }
    catch (err) { console.error('Delete failed:', err); }
  };

  const filtered = accounts.filter(
    (a) => a.bank_name.toLowerCase().includes(search.toLowerCase()) ||
      a.account_number.includes(search)
  );

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.current_balance), 0);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} · Total balance: <span className="text-emerald-400 font-semibold">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Add Bank Account
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Search banks..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Landmark className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No bank accounts found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Bank Name</TableHead>
                <TableHead className="text-zinc-400">Account Number</TableHead>
                <TableHead className="text-zinc-400">IFSC</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400 text-right">Opening Balance</TableHead>
                <TableHead className="text-zinc-400 text-right">Current Balance</TableHead>
                <TableHead className="text-zinc-400 text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((account) => (
                <TableRow key={account.id} className="border-zinc-800 hover:bg-zinc-900/60">
                  <TableCell className="font-medium text-zinc-200">{account.bank_name}</TableCell>
                  <TableCell className="font-mono text-sm text-zinc-300">{account.account_number}</TableCell>
                  <TableCell className="font-mono text-xs text-zinc-400">{account.ifsc || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      'capitalize',
                      account.status === 'active' ? 'border-emerald-500/30 text-emerald-400' : 'border-zinc-600 text-zinc-500'
                    )}>
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-zinc-400">{formatCurrency(account.opening_balance)}</TableCell>
                  <TableCell className={cn('text-right font-semibold', account.current_balance >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {formatCurrency(account.current_balance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(account)} className="h-8 w-8 text-zinc-400 hover:text-white">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)} className="h-8 w-8 text-zinc-400 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
            <DialogDescription className="text-zinc-400">Enter the bank account details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Bank Name *</Label>
              <Input value={form.bank_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, bank_name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="e.g. HDFC Bank" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Account Number *</Label>
              <Input value={form.account_number} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, account_number: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">IFSC Code</Label>
              <Input value={form.ifsc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, ifsc: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Opening Balance (₹)</Label>
              <Input type="number" value={form.opening_balance} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, opening_balance: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700 text-zinc-300">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.bank_name || !form.account_number} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingAccount ? 'Save Changes' : 'Add Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
