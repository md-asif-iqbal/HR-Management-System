'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from './SidebarContext';

const employeeLinks = [
  { href: '/employee/dashboard', label: 'Dashboard', icon: 'H' },
  { href: '/employee/attendance', label: 'Attendance', icon: 'A' },
  { href: '/employee/leaves', label: 'Leaves', icon: 'L' },
  { href: '/employee/profile', label: 'Profile', icon: 'P' },
];

const hrLinks = [
  { href: '/hr/dashboard', label: 'Dashboard', icon: 'D' },
  { href: '/hr/attendance', label: 'Attendance', icon: 'A' },
  { href: '/hr/employees', label: 'Employees', icon: 'E' },
  { href: '/hr/leaves', label: 'Leave Requests', icon: 'L' },
  { href: '/hr/reports', label: 'Reports', icon: 'R' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isHR = session?.user?.role === 'hr';
  const links = isHR ? hrLinks : employeeLinks;
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  const navIcon = (label: string) => {
    const icons: Record<string, React.ReactNode> = {
      Dashboard: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
      Attendance: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>,
      Leaves: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>,
      'Leave Requests': <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>,
      Profile: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>,
      Employees: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>,
      Reports: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>,
    };
    return icons[label] || <span className="w-5 h-5 flex items-center justify-center text-xs font-bold">{label.charAt(0)}</span>;
  };

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      <div className="p-4 lg:p-5 border-b border-slate-700 flex items-center justify-between min-h-[56px]">
        {(isMobile || !collapsed) ? (
          <div><h1 className="text-lg font-bold leading-tight">HR System</h1><p className="text-xs text-slate-400 mt-0.5">{isHR ? 'Admin Panel' : 'Employee Portal'}</p></div>
        ) : (
          <div className="w-full flex justify-center"><span className="text-lg font-bold">HR</span></div>
        )}
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="w-11 h-11 flex items-center justify-center rounded-md hover:bg-slate-700 text-slate-400 hover:text-white" aria-label="Close sidebar">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {links.map((link) => {
            const isActive = pathname === link.href;
            const el = (
              <Link href={link.href} onClick={() => isMobile && setMobileOpen(false)}
                className={cn('relative flex items-center gap-3 rounded-md text-sm transition-colors duration-200 min-h-[44px]', (!isMobile && collapsed) ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5', isActive ? 'text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white')}>
                {isActive && (
                  <motion.div
                    layoutId={isMobile ? 'activeLinkMobile' : 'activeLink'}
                    className="absolute inset-0 bg-slate-700 rounded-md"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="flex-shrink-0 relative z-10">{navIcon(link.label)}</span>
                <AnimatePresence mode="wait">
                  {(isMobile || !collapsed) && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative z-10 overflow-hidden whitespace-nowrap"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
            if (!isMobile && collapsed) {
              return (<Tooltip key={link.href}><TooltipTrigger asChild>{el}</TooltipTrigger><TooltipContent side="right" className="z-[60]">{link.label}</TooltipContent></Tooltip>);
            }
            return <div key={link.href}>{el}</div>;
          })}
        </TooltipProvider>
      </nav>
      <div className="p-3 border-t border-slate-700">
        {(isMobile || !collapsed) ? (
          <>
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-medium flex-shrink-0">{session?.user?.name?.charAt(0) || 'U'}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{session?.user?.name}</p><p className="text-xs text-slate-400 truncate">{session?.user?.employeeId}</p></div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 min-h-[44px]" onClick={() => signOut({ callbackUrl: '/login' })}>
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
              Sign Out
            </Button>
          </>
        ) : (
          <TooltipProvider delayDuration={0}><Tooltip><TooltipTrigger asChild>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full flex justify-center py-2.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 min-h-[44px]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
            </button>
          </TooltipTrigger><TooltipContent side="right" className="z-[60]">Sign Out</TooltipContent></Tooltip></TooltipProvider>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)} className="md:hidden fixed top-3 left-3 z-40 w-11 h-11 flex items-center justify-center rounded-lg bg-white shadow-md border border-slate-200" aria-label="Open menu">
        <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
      </button>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-[280px]"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop/Tablet sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 z-50"
      >
        {sidebarContent(false)}
        <button onClick={toggleCollapsed} className="absolute -right-3 top-16 w-6 h-6 bg-slate-900 border-2 border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 z-[60]" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <motion.svg
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.25 }}
            className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></motion.svg>
        </button>
      </motion.aside>
    </>
  );
}
