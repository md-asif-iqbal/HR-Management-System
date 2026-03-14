'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import PageWrapper from '@/components/layout/PageWrapper';
import { StaggeredStatsCentered } from '@/components/ui/StaggeredStats';
import { fadeInUp } from '@/lib/animations';

export default function HRDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    lateToday: 0,
    pendingLeaves: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');

        const [attRes, leaveRes, empRes] = await Promise.all([
          fetch(`/api/attendance/all?date=${today}`),
          fetch('/api/leaves/all?status=pending'),
          fetch('/api/employees'),
        ]);

        const attData = await attRes.json();
        const leaveData = await leaveRes.json();
        const empData = await empRes.json();

        const records = attData.records || [];
        const totalEmployees = empData.employees?.length || 0;
        const presentToday = records.filter((r: any) => r.status === 'present' || r.status === 'late').length;
        const lateToday = records.filter((r: any) => r.isLate).length;
        const onLeaveToday = records.filter((r: any) => r.status === 'on-leave').length;
        const absentToday = totalEmployees - presentToday - onLeaveToday;

        setStats({
          totalEmployees,
          presentToday,
          absentToday: absentToday > 0 ? absentToday : 0,
          onLeaveToday,
          lateToday,
          pendingLeaves: leaveData.requests?.length || 0,
        });

        setRecentAttendance(records.slice(0, 10));
        setPendingLeaves((leaveData.requests || []).slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-lg animate-pulse" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Employees', value: stats.totalEmployees, color: 'text-slate-900' },
    { label: 'Present Today', value: stats.presentToday, color: 'text-green-600' },
    { label: 'Absent Today', value: stats.absentToday, color: 'text-red-600' },
    { label: 'On Leave', value: stats.onLeaveToday, color: 'text-blue-600' },
    { label: 'Late Today', value: stats.lateToday, color: 'text-amber-600' },
    { label: 'Pending Leaves', value: stats.pendingLeaves, color: 'text-purple-600' },
  ];

  return (
    <PageWrapper>
    <div className="space-y-4 sm:space-y-6">
      {/* Stat Cards */}
      <StaggeredStatsCentered
        cards={statCards.map((s) => ({ label: s.label, value: s.value, color: s.color }))}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today's Attendance */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base">Today&apos;s Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAttendance.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-4">No attendance records today</p>
            ) : (
              <div className="space-y-2">
                {recentAttendance.map((record: any) => (
                  <div key={record._id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                        {record.userId?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{record.userId?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{record.userId?.employeeId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {record.checkInTime && (
                        <span className="text-xs text-slate-500">{format(new Date(record.checkInTime), 'hh:mm a')}</span>
                      )}
                      <Badge className={
                        record.status === 'present' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                        record.status === 'late' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' :
                        record.status === 'on-leave' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                        'bg-red-100 text-red-800 hover:bg-red-100'
                      }>
                        {record.isLate ? 'Late' : record.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>

        {/* Pending Leave Requests */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base">Pending Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingLeaves.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-4">No pending leave requests</p>
            ) : (
              <div className="space-y-2">
                {pendingLeaves.map((leave: any) => (
                  <div key={leave._id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{leave.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">
                        {leave.leaveType} · {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {format(new Date(leave.startDate), 'dd MMM')} - {format(new Date(leave.endDate), 'dd MMM')}
                      </p>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs">Pending</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
    </PageWrapper>
  );
}
