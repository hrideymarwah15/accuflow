import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../hooks/use-app-store';
import { getLedgers, createLedger, updateLedger, deleteLedger } from '../lib/api';
import type { Ledger } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Search, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEDGER_TYPES = [
  'Sales', 'Purchase', 'Salary', 'Rent', 'GST', 'TDS', 'Fuel',
  'Electricity', 'Marketing', 'Capital', 'Cash', 'Bank', 'Other',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value);

export default function Ledgers() {
  const { company } = useAppStore();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState<Ledger | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('');
  const [formOpeningBalance, setFormOpeningBalance] = useState('0');

  const loadLedgers = useCallback(async () => {
    if (!company) return;
    try {
      const data = await getLedgers(company.id);
      setLedgers(data);
    } catch (err) {
      console.error('Failed to load ledgers:', err);
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { loadLedgers(); }, [loadLedgers]);

  const openCreateDialog = () => {
    setEditingLedger(null);
    setFormName('');
    setFormType('');
    setFormOpeningBalance('0');
    setDialogOpen(true);
  };

  const openEditDialog = (ledger: Ledger) => {
    setEditingLedger(ledger);
    setFormName(ledger.name);
    setFormType(ledger.ledger_type);
    setFormOpeningBalance(String(ledger.opening_balance));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!company || !formName || !formType) return;
    setSaving(true);
    try {
      if (editingLedger) {
        await updateLedger(editingLedger.id, {
          name: formName,
          ledger_type: formType,
          opening_balance: Number(formOpeningBalance),
        });
      } else {
        await createLedger({
          company_id: company.id,
          name: formName,
          ledger_type: formType,
          opening_balance: Number(formOpeningBalance),
        });
      }
      await loadLedgers();
      setDialogOpen(false);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ledger?')) return;
    try {
      await deleteLedger(id);
      await loadLedgers();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const filtered = ledgers.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.ledger_type.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ledgers</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your ledger accounts for bookkeeping.</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Add Ledger
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Search ledgers..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <BookOpen className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No ledgers found. Create one to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Type</TableHead>
                <TableHead className="text-zinc-400 text-right">Opening Balance</TableHead>
                <TableHead className="text-zinc-400 text-right">Current Balance</TableHead>
                <TableHead className="text-zinc-400 text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ledger) => (
                <TableRow key={ledger.id} className="border-zinc-800 hover:bg-zinc-900/60">
                  <TableCell className="font-medium text-zinc-200">{ledger.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400 capitalize">
                      {ledger.ledger_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-zinc-300">{formatCurrency(ledger.opening_balance)}</TableCell>
                  <TableCell className={cn('text-right font-semibold', ledger.current_balance >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {formatCurrency(ledger.current_balance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(ledger)} className="h-8 w-8 text-zinc-400 hover:text-white">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ledger.id)} className="h-8 w-8 text-zinc-400 hover:text-red-400">
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>{editingLedger ? 'Edit Ledger' : 'Add New Ledger'}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editingLedger ? 'Update ledger information.' : 'Create a new ledger account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Name</Label>
              <Input
                value={formName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)}
                placeholder="e.g. Sales, Purchase, Rent"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Type</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v ?? '')}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {LEDGER_TYPES.map((t) => (
                    <SelectItem key={t} value={t.toLowerCase()} className="text-zinc-200 focus:bg-zinc-700 focus:text-white">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Opening Balance (₹)</Label>
              <Input
                type="number"
                value={formOpeningBalance}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormOpeningBalance(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700 text-zinc-300">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formName || !formType} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingLedger ? 'Save Changes' : 'Create Ledger'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
