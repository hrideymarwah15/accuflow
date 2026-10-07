import { useEffect, useState } from 'react';
import { getAuditLogs } from '../lib/api';
import type { AuditLog } from '../lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const actionColors: Record<string, string> = {
  create: 'border-emerald-500/30 text-emerald-400',
  update: 'border-blue-500/30 text-blue-400',
  delete: 'border-red-500/30 text-red-400',
  approve: 'border-amber-500/30 text-amber-400',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAuditLogs(200);
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-zinc-500 text-sm mt-1">Complete history of all actions performed in the system.</p>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No audit log entries yet.</p>
          <p className="text-xs text-zinc-600 mt-1">Actions will be recorded here automatically.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Timestamp</TableHead>
                <TableHead className="text-zinc-400">Action</TableHead>
                <TableHead className="text-zinc-400">Table</TableHead>
                <TableHead className="text-zinc-400">Target ID</TableHead>
                <TableHead className="text-zinc-400">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="border-zinc-800 hover:bg-zinc-900/60">
                  <TableCell className="text-zinc-400 text-sm font-mono">
                    {new Date(log.created_at).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('capitalize', actionColors[log.action] || 'border-zinc-600 text-zinc-400')}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-300 capitalize">{log.target_table.replace(/_/g, ' ')}</TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500">{log.target_id?.slice(0, 8) || '—'}...</TableCell>
                  <TableCell className="text-zinc-500 text-xs max-w-[200px] truncate">
                    {log.new_value ? JSON.stringify(log.new_value).slice(0, 60) + '...' : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
