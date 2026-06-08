import { SidebarProvider } from '@/context/SidebarContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { AppFooter } from '@/components/layout/AppFooter';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="min-h-screen bg-white">
          <Sidebar />
          <Topbar />
          <main className="lg:pl-[220px] pt-[64px] min-h-screen flex flex-col">
            <div className="max-w-6xl w-full mx-auto p-6 md:p-12 flex-1 min-h-[calc(100vh-136px)]">
              {children}
            </div>
            <div className="w-full">
              <AppFooter />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
