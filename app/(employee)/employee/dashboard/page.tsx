'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LiveClock from '@/components/attendance/LiveClock';
import CheckInButton from '@/components/attendance/CheckInButton';
import AttendanceTable from '@/components/attendance/AttendanceTable';
import LeaveBalanceCard from '@/components/leaves/LeaveBalanceCard';
import PageWrapper from '@/components/layout/PageWrapper';
import { StaggeredStats } from '@/components/ui/StaggeredStats';
import { fadeInUp } from '@/lib/animations';

export default function EmployeeDashboard() {
  useSession();
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [balance, setBalance] = useState({ totalLeaves: 12, usedLeaves: 0, remainingLeaves: 12 });
  const [summary, setSummary] = useState({ present: 0, late: 0, absent: 0, onLeave: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [todayRes, historyRes, balanceRes] = await Promise.all([
        fetch('/api/attendance/today'),
        fetch(`/api/attendance/history?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`),
        fetch('/api/leaves/balance'),
      ]);

      const todayData = await todayRes.json();
      const historyData = await historyRes.json();
      const balanceData = await balanceRes.json();

      setTodayRecord(todayData.record);
      setRecords(historyData.records || []);
      setBalance(balanceData);

      // Calculate summary — present includes late (late = still came in)
      const recs = historyData.records || [];
      setSummary({
        present: recs.filter((r: any) => r.status === 'present' || r.status === 'late').length,
        late: recs.filter((r: any) => r.status === 'late').length,
        absent: recs.filter((r: any) => r.status === 'absent').length,
        onLeave: recs.filter((r: any) => r.status === 'on-leave').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const statCards = [
    { label: 'Present', value: summary.present, color: 'text-green-700' },
    { label: 'Late', value: summary.late, color: 'text-red-700' },
    { label: 'Absent', value: summary.absent, color: 'text-red-500' },
    { label: 'On Leave', value: summary.onLeave, color: 'text-blue-700' },
  ];

  return (
    <PageWrapper>
      <div className="space-y-4 sm:space-y-6">
        {/* Clock and Check-in */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Card>
              <CardContent className="pt-6">
                <LiveClock />
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Today&apos;s Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <CheckInButton todayRecord={todayRecord} onUpdate={fetchData} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Summary Cards */}
        <StaggeredStats cards={statCards} className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4" />

        {/* Leave Balance */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <LeaveBalanceCard total={balance.totalLeaves} used={balance.usedLeaves} />
        </motion.div>

        {/* Recent Attendance */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-base sm:text-lg">This Month&apos;s Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceTable records={records} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
