import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../hooks/use-app-store';
import { getTransactions, getLedgers } from '../lib/api';
import type { Transaction, Ledger } from '../lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileBarChart2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value);

export default function Reports() {
  const { company } = useAppStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!company) return;
    try {
      const [txns, ldgrs] = await Promise.all([
        getTransactions(company.id),
        getLedgers(company.id),
      ]);
      setTransactions(txns);
      setLedgers(ldgrs);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  const approved = transactions.filter(t => t.status === 'approved');
  const totalRevenue = approved
    .filter(t => ['receipt', 'sales', 'income'].includes(t.voucher_type))
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = approved
    .filter(t => ['payment', 'purchase', 'expense'].includes(t.voucher_type))
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const grossProfit = totalRevenue - totalExpenses;

  // Group transactions by ledger for trial balance
  const ledgerBalances = ledgers.map(ledger => {
    const debits = transactions
      .filter(t => t.debit_account_id === ledger.id)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const credits = transactions
      .filter(t => t.credit_account_id === ledger.id)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      ...ledger,
      totalDebits: debits,
      totalCredits: credits,
      netBalance: ledger.opening_balance + debits - credits,
    };
  });

  // Cash book: filter transactions related to cash
  const cashTransactions = transactions.filter(
    t => t.payment_mode === 'cash' || t.voucher_type === 'contra'
  );

  const handleExport = (reportName: string) => {
    // CSV export
    let csvContent = '';
    if (reportName === 'pnl') {
      csvContent = `Profit & Loss Statement\n\nTotal Revenue,${totalRevenue}\nTotal Expenses,${totalExpenses}\nGross Profit,${grossProfit}\n`;
    } else if (reportName === 'trial-balance') {
      csvContent = `Trial Balance\n\nLedger,Type,Opening Balance,Debits,Credits,Net Balance\n`;
      ledgerBalances.forEach(l => {
        csvContent += `${l.name},${l.ledger_type},${l.opening_balance},${l.totalDebits},${l.totalCredits},${l.netBalance}\n`;
      });
    }
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-zinc-500 text-sm mt-1">Financial statements and reports.</p>
      </div>

      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="pnl" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-white">Profit & Loss</TabsTrigger>
          <TabsTrigger value="trial-balance" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-white">Trial Balance</TabsTrigger>
          <TabsTrigger value="cash-book" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-white">Cash Book</TabsTrigger>
          <TabsTrigger value="ledger-report" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-white">Ledger Report</TabsTrigger>
        </TabsList>

        {/* Profit & Loss */}
        <TabsContent value="pnl" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExport('pnl')} className="border-zinc-700 text-zinc-300 gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <div className="bg-zinc-900/80 p-6 space-y-6">
              <h3 className="text-lg font-semibold text-zinc-200 border-b border-zinc-800 pb-3">Profit & Loss Statement</h3>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Revenue</h4>
                {approved.filter(t => ['receipt', 'sales', 'income'].includes(t.voucher_type)).length === 0 ? (
                  <p className="text-zinc-500 text-sm pl-4">No revenue entries</p>
                ) : (
                  <div className="pl-4 space-y-1">
                    {['receipt', 'sales', 'income'].map(type => {
                      const total = approved.filter(t => t.voucher_type === type).reduce((s, t) => s + Number(t.amount), 0);
                      if (total === 0) return null;
                      return (
                        <div key={type} className="flex justify-between text-sm">
                          <span className="text-zinc-400 capitalize">{type}</span>
                          <span className="text-zinc-200">{formatCurrency(total)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t border-zinc-800 pt-2">
                  <span className="text-emerald-400">Total Revenue</span>
                  <span className="text-emerald-400">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-red-400 uppercase tracking-wider">Expenses</h4>
                {approved.filter(t => ['payment', 'purchase', 'expense'].includes(t.voucher_type)).length === 0 ? (
                  <p className="text-zinc-500 text-sm pl-4">No expense entries</p>
                ) : (
                  <div className="pl-4 space-y-1">
                    {['payment', 'purchase', 'expense'].map(type => {
                      const total = approved.filter(t => t.voucher_type === type).reduce((s, t) => s + Number(t.amount), 0);
                      if (total === 0) return null;
                      return (
                        <div key={type} className="flex justify-between text-sm">
                          <span className="text-zinc-400 capitalize">{type}</span>
                          <span className="text-zinc-200">{formatCurrency(total)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t border-zinc-800 pt-2">
                  <span className="text-red-400">Total Expenses</span>
                  <span className="text-red-400">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold border-t-2 border-zinc-700 pt-4">
                <span className={grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {grossProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                </span>
                <span className={grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {formatCurrency(Math.abs(grossProfit))}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Trial Balance */}
        <TabsContent value="trial-balance" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExport('trial-balance')} className="border-zinc-700 text-zinc-300 gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
          {ledgerBalances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <FileBarChart2 className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No ledger data available.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Ledger</TableHead>
                    <TableHead className="text-zinc-400">Type</TableHead>
                    <TableHead className="text-zinc-400 text-right">Opening</TableHead>
                    <TableHead className="text-zinc-400 text-right">Debits</TableHead>
                    <TableHead className="text-zinc-400 text-right">Credits</TableHead>
                    <TableHead className="text-zinc-400 text-right">Net Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerBalances.map((l) => (
                    <TableRow key={l.id} className="border-zinc-800 hover:bg-zinc-900/60">
                      <TableCell className="font-medium text-zinc-200">{l.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400 capitalize">{l.ledger_type}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-zinc-400">{formatCurrency(l.opening_balance)}</TableCell>
                      <TableCell className="text-right text-blue-400">{formatCurrency(l.totalDebits)}</TableCell>
                      <TableCell className="text-right text-amber-400">{formatCurrency(l.totalCredits)}</TableCell>
                      <TableCell className={cn('text-right font-semibold', l.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {formatCurrency(l.netBalance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Cash Book */}
        <TabsContent value="cash-book" className="space-y-4">
          {cashTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <FileBarChart2 className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No cash transactions found.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Date</TableHead>
                    <TableHead className="text-zinc-400">Voucher</TableHead>
                    <TableHead className="text-zinc-400">Type</TableHead>
                    <TableHead className="text-zinc-400 text-right">Receipt</TableHead>
                    <TableHead className="text-zinc-400 text-right">Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashTransactions.map((t) => (
                    <TableRow key={t.id} className="border-zinc-800 hover:bg-zinc-900/60">
                      <TableCell className="text-zinc-400 text-sm">{t.transaction_date}</TableCell>
                      <TableCell className="font-mono text-sm text-zinc-200">{t.voucher_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400 capitalize">{t.voucher_type}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-emerald-400">
                        {['receipt', 'sales', 'income'].includes(t.voucher_type) ? formatCurrency(t.amount) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-red-400">
                        {['payment', 'purchase', 'expense'].includes(t.voucher_type) ? formatCurrency(t.amount) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Ledger Report */}
        <TabsContent value="ledger-report" className="space-y-4">
          {ledgers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <FileBarChart2 className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No ledgers created yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ledgers.map((ledger) => {
                const ledgerTxns = transactions.filter(
                  t => t.debit_account_id === ledger.id || t.credit_account_id === ledger.id
                );
                return (
                  <div key={ledger.id} className="rounded-xl border border-zinc-800 overflow-hidden">
                    <div className="bg-zinc-900/80 p-4 border-b border-zinc-800 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-zinc-200">{ledger.name}</h4>
                        <p className="text-xs text-zinc-500 capitalize">{ledger.ledger_type} · Opening: {formatCurrency(ledger.opening_balance)}</p>
                      </div>
                      <span className={cn('font-bold', ledger.current_balance >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {formatCurrency(ledger.current_balance)}
                      </span>
                    </div>
                    {ledgerTxns.length > 0 && (
                      <Table>
                        <TableBody>
                          {ledgerTxns.slice(0, 5).map(t => (
                            <TableRow key={t.id} className="border-zinc-800 hover:bg-zinc-900/60">
                              <TableCell className="text-zinc-400 text-sm">{t.transaction_date}</TableCell>
                              <TableCell className="font-mono text-xs text-zinc-300">{t.voucher_number}</TableCell>
                              <TableCell className="text-right">
                                {t.debit_account_id === ledger.id && <span className="text-blue-400">{formatCurrency(t.amount)} Dr</span>}
                                {t.credit_account_id === ledger.id && <span className="text-amber-400">{formatCurrency(t.amount)} Cr</span>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
