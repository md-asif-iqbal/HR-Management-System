'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/animations';

const employeeLinks = [
  { href: '/employee/dashboard', label: 'Dashboard' },
  { href: '/employee/attendance', label: 'Attendance' },
  { href: '/employee/leaves', label: 'Leaves' },
  { href: '/employee/profile', label: 'Profile' },
];

const hrLinks = [
  { href: '/hr/dashboard', label: 'Dashboard' },
  { href: '/hr/attendance', label: 'Attendance' },
  { href: '/hr/employees', label: 'Employees' },
  { href: '/hr/leaves', label: 'Leaves' },
  { href: '/hr/reports', label: 'Reports' },
];

export default function Footer() {
  const { data: session } = useSession();
  const isHR = session?.user?.role === 'hr';
  const links = isHR ? hrLinks : employeeLinks;

  return (
    <motion.footer
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.4 }}
      className="bg-slate-900 text-slate-400 mt-auto"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Branding */}
          <div>
            <h2 className="text-white text-lg font-bold tracking-tight">AttendX</h2>
            <p className="text-sm mt-2 leading-relaxed">
              Streamlined HR & attendance management for modern teams.
            </p>
            <p className="text-xs text-slate-500 mt-3">
              &copy; {new Date().getFullYear()} AttendX. All rights reserved.
            </p>
          </div>

          {/* Middle: Quick Links (desktop only) */}
          <div className="hidden md:block">
            <h3 className="text-slate-300 text-sm font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Office Info */}
          <div>
            <h3 className="text-slate-300 text-sm font-semibold mb-3">Office Info</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Mon – Fri, 10:00 AM – 7:00 PM
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                support@attendx.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-slate-800">
        <p className="text-center text-xs text-slate-600 py-3 px-4">
          Built with Next.js &bull; MongoDB &bull; Tailwind CSS
        </p>
      </div>
    </motion.footer>
  );
}
