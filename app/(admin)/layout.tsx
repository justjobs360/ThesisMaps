import type { Metadata } from 'next';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-admin-bg">
      <AdminSidebar />
      <AdminTopbar />
      <main
        className="ml-[220px] pt-[52px] min-h-screen"
        style={{ width: 'calc(100vw - 220px)' }}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
