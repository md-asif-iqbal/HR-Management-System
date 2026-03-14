'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmLogout(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setConfirmLogout(false);
  }, [pathname]);

  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Dashboard';
    const last = segments[segments.length - 1];
    if (/^[0-9a-f]{24}$/i.test(last)) return 'Employee Details';
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
  };

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((seg, i) => ({
      label: /^[0-9a-f]{24}$/i.test(seg) ? 'Details' : seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      href: '/' + segments.slice(0, i + 1).join('/'),
    }));
  };

  const crumbs = getBreadcrumbs();
  const roleBadge = session?.user?.role === 'hr' ? 'HR Admin' : 'Employee';
  const profileHref = session?.user?.role === 'hr' ? '/hr/employees' : '/employee/profile';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 md:px-5 lg:px-6 py-2.5 md:py-3">
      <div className="flex items-center justify-between gap-2">
        {/* Left: title + breadcrumbs */}
        <div className="min-w-0 flex-1 pl-12 md:pl-0">
          <h1 className="text-base md:text-lg font-semibold text-slate-900 truncate">{getPageTitle()}</h1>
          <nav className="hidden md:flex items-center gap-1 text-xs text-slate-500 truncate">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              const showOnTablet = i >= crumbs.length - 2;
              return (
                <span key={crumb.href} className={`flex items-center gap-1 ${showOnTablet ? '' : 'hidden lg:flex'}`}>
                  {i > 0 && <span className={showOnTablet ? '' : 'hidden lg:inline'}>/</span>}
                  <span className={isLast ? 'text-slate-700' : ''}>{crumb.label}</span>
                </span>
              );
            })}
          </nav>
        </div>

        {/* Right: user menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => { setMenuOpen((o) => !o); setConfirmLogout(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-700 overflow-hidden flex-shrink-0">
              {session?.user?.avatar ? (
                <img src={session.user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                session?.user?.name?.charAt(0) || 'U'
              )}
            </div>
            {/* Name: desktop only */}
            <span className="hidden md:block text-sm font-medium text-slate-900 max-w-[120px] truncate">
              {session?.user?.name}
            </span>
            {/* Chevron */}
            <motion.svg
              animate={{ rotate: menuOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-4 h-4 text-slate-500 flex-shrink-0"
              fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </motion.svg>
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 overflow-hidden flex-shrink-0">
                      {session?.user?.avatar ? (
                        <img src={session.user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        session?.user?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{session?.user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-600">{roleBadge}</span>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    href={profileHref}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    My Profile
                  </Link>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    {!confirmLogout ? (
                      <button
                        onClick={() => setConfirmLogout(true)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                        </svg>
                        Sign Out
                      </button>
                    ) : (
                      <div className="px-4 py-3">
                        <p className="text-xs text-slate-600 mb-2 font-medium">Sign out of your account?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                          >
                            Yes, sign out
                          </button>
                          <button
                            onClick={() => setConfirmLogout(false)}
                            className="flex-1 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
