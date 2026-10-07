import { useEffect, useState } from 'react';
import { useAppStore } from '../hooks/use-app-store';
import { getDashboardData } from '../lib/api';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  TrendingUp,
  IndianRupee,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DashboardData {
  bankBalance: number;
  todayReceipts: number;
  todayPayments: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  pendingApprovals: number;
  recentTransactions: Array<{
    id: string;
    voucher_number: string;
    voucher_type: string;
    amount: number;
    status: string;
    transaction_date: string;
    party?: { name: string } | null;
  }>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);
};

// Sample chart data for initial render
const sampleChartData = [
  { name: 'Jan', revenue: 0, expenses: 0 },
  { name: 'Feb', revenue: 0, expenses: 0 },
  { name: 'Mar', revenue: 0, expenses: 0 },
  { name: 'Apr', revenue: 0, expenses: 0 },
  { name: 'May', revenue: 0, expenses: 0 },
  { name: 'Jun', revenue: 0, expenses: 0 },
];

export default function Dashboard() {
  const { company } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    (async () => {
      try {
        const result = await getDashboardData(company.id);
        setData(result);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [company]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const stats = [
    {
      label: "Today's Receipts",
      value: formatCurrency(data?.todayReceipts ?? 0),
      icon: ArrowDownLeft,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: "Today's Payments",
      value: formatCurrency(data?.todayPayments ?? 0),
      icon: ArrowUpRight,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    {
      label: 'Bank Balance',
      value: formatCurrency(data?.bankBalance ?? 0),
      icon: Landmark,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(data?.monthlyRevenue ?? 0),
      icon: IndianRupee,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Monthly Expenses',
      value: formatCurrency(data?.monthlyExpenses ?? 0),
      icon: ArrowUpRight,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
    },
    {
      label: 'Net Profit',
      value: formatCurrency(data?.netProfit ?? 0),
      icon: TrendingUp,
      color: (data?.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
      bg: (data?.netProfit ?? 0) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      border: (data?.netProfit ?? 0) >= 0 ? 'border-emerald-500/20' : 'border-red-500/20',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Welcome back. Here's your financial overview.</p>
        </div>
        {(data?.pendingApprovals ?? 0) > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            {data?.pendingApprovals} pending approval{(data?.pendingApprovals ?? 0) > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'rounded-xl border p-5 transition-all duration-200 hover:scale-[1.02]',
              'bg-zinc-900/60 backdrop-blur',
              stat.border
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-zinc-400 text-sm font-medium">{stat.label}</span>
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('h-4 w-4', stat.color)} />
              </div>
            </div>
            <p className={cn('text-2xl font-semibold tracking-tight', stat.color)}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Revenue vs Expenses Chart */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Revenue vs Expenses Trend</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sampleChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Recent Transactions</h3>
          {(data?.recentTransactions?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center h-[250px] text-zinc-500">
              <Clock className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {data?.recentTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-zinc-800"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{txn.voucher_number}</p>
                    <p className="text-xs text-zinc-500">
                      {txn.party?.name ?? txn.voucher_type} · {txn.transaction_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'text-sm font-semibold',
                      ['receipt', 'sales', 'income'].includes(txn.voucher_type)
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    )}>
                      {formatCurrency(txn.amount)}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs capitalize',
                        txn.status === 'approved' && 'border-emerald-500/30 text-emerald-400',
                        txn.status === 'pending' && 'border-amber-500/30 text-amber-400',
                        txn.status === 'rejected' && 'border-red-500/30 text-red-400'
                      )}
                    >
                      {txn.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
