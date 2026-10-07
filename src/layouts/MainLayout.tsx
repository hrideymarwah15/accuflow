import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { useAppStore } from '../hooks/use-app-store';
import { getOrCreateCompany, getUserProfile } from '../lib/api';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeftRight,
  Landmark,
  FileBarChart2,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Ledgers', icon: BookOpen, path: '/ledgers' },
  { label: 'Parties', icon: Users, path: '/parties' },
  { label: 'Transactions', icon: ArrowLeftRight, path: '/transactions' },
  { label: 'Bank Accounts', icon: Landmark, path: '/bank-accounts' },
  { label: 'Reports', icon: FileBarChart2, path: '/reports' },
  { label: 'Audit Log', icon: ClipboardList, path: '/audit-log' },
];

export default function MainLayout() {
  const { user, signOut } = useAuth();
  const { setCompany, setProfile } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const company = await getOrCreateCompany(user.id);
        setCompany(company);
        const profile = await getUserProfile(user.id);
        setProfile(profile);
      } catch (err) {
        console.error('Failed to load company/profile:', err);
      } finally {
        setReady(true);
      }
    })();
  }, [user, setCompany, setProfile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-zinc-800/80 bg-zinc-950 transition-all duration-300 ease-in-out shrink-0',
          collapsed ? 'w-[68px]' : 'w-[240px]'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-zinc-800/80 gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            A
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent whitespace-nowrap">
              AccuFlow
            </span>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="flex flex-col gap-1 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator className="bg-zinc-800/80" />

        {/* Bottom Controls */}
        <div className="p-2 flex flex-col gap-1">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center rounded-lg px-3 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all duration-150"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
