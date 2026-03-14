'use client';

import AuthProvider from '@/components/providers/AuthProvider';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { cn } from '@/lib/utils';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div className={cn('transition-all duration-200 min-h-screen', collapsed ? 'md:ml-16' : 'md:ml-[220px] lg:ml-[240px]')}>
      <Header />
      <main className="p-3 sm:p-4 md:p-5 lg:p-6">{children}</main>
    </div>
  );
}

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-slate-50">
          <Sidebar />
          <LayoutContent>{children}</LayoutContent>
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
}
