import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../hooks/use-app-store';
import { getParties, createParty, updateParty, deleteParty } from '../lib/api';
import type { Party, PartyType } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const PARTY_TYPES: PartyType[] = ['customer', 'vendor', 'employee', 'contractor'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value);

const partyTypeColors: Record<PartyType, string> = {
  customer: 'border-blue-500/30 text-blue-400',
  vendor: 'border-amber-500/30 text-amber-400',
  employee: 'border-emerald-500/30 text-emerald-400',
  contractor: 'border-purple-500/30 text-purple-400',
};

interface PartyForm {
  name: string;
  party_type: PartyType | '';
  pan: string;
  gstin: string;
  contact: string;
  email: string;
  address: string;
  credit_limit: string;
}

const emptyForm: PartyForm = { name: '', party_type: '', pan: '', gstin: '', contact: '', email: '', address: '', credit_limit: '0' };

export default function Parties() {
  const { company } = useAppStore();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PartyForm>(emptyForm);

  const loadParties = useCallback(async () => {
    if (!company) return;
    try {
      const data = await getParties(company.id);
      setParties(data);
    } catch (err) { console.error('Failed to load parties:', err); }
    finally { setLoading(false); }
  }, [company]);

  useEffect(() => { loadParties(); }, [loadParties]);

  const openCreateDialog = () => {
    setEditingParty(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (party: Party) => {
    setEditingParty(party);
    setForm({
      name: party.name,
      party_type: party.party_type,
      pan: party.pan || '',
      gstin: party.gstin || '',
      contact: party.contact || '',
      email: party.email || '',
      address: party.address || '',
      credit_limit: String(party.credit_limit),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!company || !form.name || !form.party_type) return;
    setSaving(true);
    try {
      const payload = {
        company_id: company.id,
        name: form.name,
        party_type: form.party_type as PartyType,
        pan: form.pan || null,
        gstin: form.gstin || null,
        contact: form.contact || null,
        email: form.email || null,
        address: form.address || null,
        credit_limit: Number(form.credit_limit),
        outstanding_balance: 0,
      };
      if (editingParty) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { company_id, outstanding_balance, ...updates } = payload;
        await updateParty(editingParty.id, updates);
      } else {
        await createParty(payload);
      }
      await loadParties();
      setDialogOpen(false);
    } catch (err) { console.error('Save failed:', err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this party? This action cannot be undone.')) return;
    try { await deleteParty(id); await loadParties(); }
    catch (err) { console.error('Delete failed:', err); }
  };

  const filtered = parties.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.party_type.toLowerCase().includes(search.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parties</h1>
          <p className="text-zinc-500 text-sm mt-1">Customers, vendors, employees, and contractors.</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Add Party
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Search parties..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Users className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No parties found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Type</TableHead>
                <TableHead className="text-zinc-400">Contact</TableHead>
                <TableHead className="text-zinc-400">GSTIN</TableHead>
                <TableHead className="text-zinc-400 text-right">Outstanding</TableHead>
                <TableHead className="text-zinc-400 text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((party) => (
                <TableRow key={party.id} className="border-zinc-800 hover:bg-zinc-900/60">
                  <TableCell className="font-medium text-zinc-200">{party.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('capitalize', partyTypeColors[party.party_type])}>
                      {party.party_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{party.contact || '—'}</TableCell>
                  <TableCell className="text-zinc-400 font-mono text-xs">{party.gstin || '—'}</TableCell>
                  <TableCell className={cn('text-right font-semibold', party.outstanding_balance > 0 ? 'text-amber-400' : 'text-zinc-400')}>
                    {formatCurrency(party.outstanding_balance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(party)} className="h-8 w-8 text-zinc-400 hover:text-white">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(party.id)} className="h-8 w-8 text-zinc-400 hover:text-red-400">
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
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingParty ? 'Edit Party' : 'Add New Party'}</DialogTitle>
            <DialogDescription className="text-zinc-400">Fill in the party details below.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label className="text-zinc-300">Name *</Label>
              <Input value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Type *</Label>
              <Select value={form.party_type} onValueChange={(v) => setForm({ ...form, party_type: v as PartyType })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {PARTY_TYPES.map((t) => <SelectItem key={t} value={t} className="text-zinc-200 focus:bg-zinc-700 focus:text-white capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Contact</Label>
              <Input value={form.contact} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, contact: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Email</Label>
              <Input type="email" value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">PAN</Label>
              <Input value={form.pan} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, pan: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">GSTIN</Label>
              <Input value={form.gstin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, gstin: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Credit Limit (₹)</Label>
              <Input type="number" value={form.credit_limit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, credit_limit: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label className="text-zinc-300">Address</Label>
              <Input value={form.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, address: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700 text-zinc-300">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.party_type} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingParty ? 'Save Changes' : 'Create Party'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
