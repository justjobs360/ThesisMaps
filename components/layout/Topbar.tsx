'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, ChevronRight, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/context/SidebarContext';
import { Dropdown } from '@/components/ui/Dropdown';
import { ProjectSwitcher } from '@/components/layout/ProjectSwitcher';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/search': 'Search Papers',
  '/graph': 'Knowledge Graph',
  '/outline': 'Outline Builder',
  '/timeline': 'Literature Timeline',
  '/seeds': 'Seed Maps',
  '/gaps': 'Research Gaps',
  '/defence': 'Defence Readiness',
  '/collaborate': 'Collaborate',
  '/settings': 'Settings',
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { toggle } = useSidebar();

  const pageLabel = ROUTE_LABELS[pathname] ?? 'ThesisMaps';
  const initials = (user?.displayName?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 lg:left-[220px] right-0 h-[64px] bg-white border-b-2 border-black z-20">
      {/* max-w-6xl to match the content wrapper in app/(app)/layout.tsx — it was
          max-w-5xl, which left the topbar narrower than the page beneath it and
          crowded the project switcher. */}
      <div className="max-w-6xl mx-auto h-full flex items-center px-4 md:px-6 gap-3 md:gap-4">
        <button
          onClick={toggle}
          className="lg:hidden p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={20} strokeWidth={2.5} />
        </button>

        {/* Active project + switcher, then the current page. */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <ProjectSwitcher />
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-[10px] md:text-xs font-sans font-bold uppercase tracking-wider text-text-muted min-w-0"
          >
            <ChevronRight size={14} strokeWidth={2.5} className="text-black hidden sm:inline flex-shrink-0" />
            <span className="text-accent underline underline-offset-4 truncate">{pageLabel}</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/search')}
            aria-label="Search papers"
            title="Search papers"
            className="p-2 border border-transparent hover:border-black transition-colors"
          >
            <Search size={18} strokeWidth={2} />
          </button>
          <button
            aria-label="Notifications"
            className="p-2 border border-transparent hover:border-black transition-colors"
          >
            <Bell size={18} strokeWidth={2} />
          </button>

          <Dropdown
            align="end"
            trigger={
              <button
                aria-label="User menu"
                className="w-9 h-9 border-2 border-black bg-white flex items-center justify-center text-xs font-bold text-black font-sans hover:bg-black hover:text-white transition-colors"
              >
                {initials}
              </button>
            }
            items={[
              { label: 'Settings', onClick: () => { window.location.href = '/settings'; } },
              { label: 'Sign out', onClick: handleSignOut, danger: true },
            ]}
          />
        </div>
      </div>
    </header>
);
}
