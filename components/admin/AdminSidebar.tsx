'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FolderOpen, BookOpen,
  MessageSquare, Flag, BarChart2, Settings, ArrowLeft,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/projects', label: 'Projects', icon: FolderOpen },
  { href: '/admin/papers', label: 'Papers', icon: BookOpen },
  { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/admin/flags', label: 'Flag Queue', icon: Flag },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-screen w-[220px] bg-admin-bg border-r border-border flex flex-col z-30">
      <div className="px-4 py-5 border-b border-border flex items-center gap-2">
        <span className="font-serif text-xl text-text-primary">ThesisMaps</span>
        <span className="text-xs font-sans font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded">Admin</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3" aria-label="Admin navigation">
        <ul className="space-y-0.5 px-2">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    'flex items-center gap-3 px-3 py-2 rounded text-sm font-sans transition-colors duration-150',
                    active
                      ? 'bg-accent/8 text-text-primary border-l-2 border-accent font-medium'
                      : 'text-text-muted hover:text-text-primary hover:bg-background border-l-2 border-transparent',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded text-sm font-sans text-text-muted hover:text-text-primary hover:bg-background transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Exit Admin
        </Link>
      </div>
    </aside>
  );
}
