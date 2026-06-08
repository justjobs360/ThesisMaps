'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FolderOpen, BookOpen,
  MessageSquare, Flag, BarChart2, Settings, ArrowLeft,
  type LucideIcon
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
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
    <aside className="fixed top-0 left-0 h-screen w-[220px] bg-white border-r-2 border-black flex flex-col z-30">
      <div className="px-6 py-6 border-b-2 border-black flex flex-col gap-1">
        <span className="font-serif text-2xl font-black text-black tracking-tighter uppercase leading-none">Admin</span>
        <span className="text-[9px] font-sans font-black text-accent uppercase tracking-[0.2em]">Command Center</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-6" aria-label="Admin navigation">
        <ul className="space-y-2 px-3">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    'flex items-center gap-3 px-4 py-3 border-2 transition-all duration-200 uppercase tracking-widest font-black text-[10px]',
                    active
                      ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-black border-transparent hover:border-black hover:bg-black hover:text-white',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={16} strokeWidth={active ? 3 : 2} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t-2 border-black p-4">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-black bg-white hover:bg-red-600 hover:text-white transition-all duration-200 text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} strokeWidth={3} />
          Exit Unit
        </Link>
      </div>
    </aside>
  );
}
