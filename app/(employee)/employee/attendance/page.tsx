'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import AttendanceTable from '@/components/attendance/AttendanceTable';
import AttendanceCalendar from '@/components/attendance/AttendanceCalendar';
import ExportButton from '@/components/export/ExportButton';
import PageWrapper from '@/components/layout/PageWrapper';
import { StaggeredStats } from '@/components/ui/StaggeredStats';
import { fadeInUp } from '@/lib/animations';
import { exportEmployeeMonthlyAttendance } from '@/lib/exportExcel';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function EmployeeAttendance() {
  const { data: session } = useSession();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'calendar'>('table');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/history?month=${month}&year=${year}`);
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = {
    present: records.filter((r) => r.status === 'present' || r.status === 'late').length,
    late: records.filter((r) => r.status === 'late').length,
    absent: records.filter((r) => r.status === 'absent').length,
    onLeave: records.filter((r) => r.status === 'on-leave').length,
    totalHours: records.reduce((s, r) => s + (r.workingHours || 0), 0).toFixed(1),
  };

  const handleExport = () => {
    exportEmployeeMonthlyAttendance(
      session?.user?.name || 'Employee',
      session?.user?.employeeId || '',
      `${months[month - 1]} ${year}`,
      records
    );
  };

  return (
    <PageWrapper>
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
        <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
          <SelectTrigger className="w-full sm:w-[160px] min-h-[44px] sm:min-h-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-full sm:w-[120px] min-h-[44px] sm:min-h-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1 border rounded-md self-start">
          <Button
            variant={view === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('table')}
            className={`min-h-[44px] sm:min-h-0 ${view === 'table' ? 'bg-slate-900 text-white' : ''}`}>
            Table
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('calendar')}
            className={`min-h-[44px] sm:min-h-0 ${view === 'calendar' ? 'bg-slate-900 text-white' : ''}`}>
            Calendar
          </Button>
        </div>

        <div className="sm:ml-auto">
          <ExportButton label="Download Excel" onClick={handleExport} />
        </div>
      </div>

      {/* Summary Cards */}
      <StaggeredStats
        cards={[
          { label: 'Present', value: summary.present, color: 'text-green-700' },
          { label: 'Late', value: summary.late, color: 'text-red-700' },
          { label: 'Absent', value: summary.absent, color: 'text-red-500' },
          { label: 'On Leave', value: summary.onLeave, color: 'text-blue-700' },
          { label: 'Total Hours', value: parseFloat(summary.totalHours), color: 'text-slate-900', suffix: 'h' },
        ]}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4"
      />

      {/* Content */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg">
              {months[month - 1]} {year} Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : view === 'table' ? (
              <AttendanceTable records={records} />
            ) : (
              <AttendanceCalendar records={records} month={month} year={year} />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </PageWrapper>
  );
}
