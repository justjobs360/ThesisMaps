'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Search, GitFork, AlignLeft,
  Clock, Layers, Lightbulb, Shield, Users, Settings, X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/context/SidebarContext';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/graph', label: 'Knowledge Graph', icon: GitFork },
  { href: '/outline', label: 'Outline Builder', icon: AlignLeft },
  { href: '/timeline', label: 'Timeline', icon: Clock },
  { href: '/seeds', label: 'Seed Maps', icon: Layers },
  { href: '/gaps', label: 'Research Gaps', icon: Lightbulb },
  { href: '/defence', label: 'Defence Ready', icon: Shield },
  { href: '/collaborate', label: 'Collaborate', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={close}
        />
      )}

      <aside
        className={[
          'fixed top-0 lg:left-0 h-screen w-[220px] bg-white border-r-2 border-black flex flex-col z-50 transition-all duration-300',
          isOpen ? 'left-0' : '-left-[220px]',
        ].join(' ')}
      >
        <div className="h-[64px] flex items-center justify-between px-5 border-b-2 border-black">
          <span className="font-serif text-2xl font-black text-black tracking-tighter uppercase whitespace-nowrap">
            Thesismaps<span className="text-accent">.</span>
          </span>
          <button
            onClick={close}
            className="lg:hidden p-1 border border-transparent hover:border-black transition-colors"
            aria-label="Close menu"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6" aria-label="Main navigation">
          <ul className="space-y-1 px-3">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => { if (window.innerWidth < 1024) close(); }}
                    className={[
                      'flex items-center gap-3 px-3 py-2.5 text-xs font-sans font-bold uppercase tracking-wider transition-all duration-200',
                      active
                        ? 'bg-black text-white'
                        : 'text-black/60 hover:text-black hover:bg-black/5',
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

        <div className="h-[72px] border-t-2 border-black px-4 flex items-center">
          <Link
            href="/settings"
            onClick={() => { if (window.innerWidth < 1024) close(); }}
            className="flex-1 flex items-center gap-3 p-1 hover:bg-black group transition-all duration-200 border border-transparent hover:border-black"
          >
            <div className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center text-[10px] font-black text-black font-sans group-hover:bg-accent group-hover:text-white transition-colors">
              {(user?.displayName?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate text-black font-black text-[10px] uppercase tracking-tighter group-hover:text-white">{user?.displayName ?? 'Researcher'}</p>
              <p className="truncate text-black/60 text-[9px] uppercase tracking-tighter group-hover:text-white/60">{user?.email ?? ''}</p>
            </div>
            <Settings size={14} strokeWidth={2} className="text-black group-hover:text-white transition-colors" />
          </Link>
        </div>
      </aside>
    </>
  );
}
