'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LeaveRequestForm from '@/components/leaves/LeaveRequestForm';
import LeaveBalanceCard from '@/components/leaves/LeaveBalanceCard';
import LeaveStatusBadge from '@/components/leaves/LeaveStatusBadge';
import { Badge } from '@/components/ui/badge';
import PageWrapper from '@/components/layout/PageWrapper';
import { fadeInUp } from '@/lib/animations';

export default function EmployeeLeaves() {
  const [requests, setRequests] = useState<any[]>([]);
  const [balance, setBalance] = useState({ totalLeaves: 12, usedLeaves: 0, remainingLeaves: 12 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, balRes] = await Promise.all([
        fetch('/api/leaves/my'),
        fetch('/api/leaves/balance'),
      ]);
      const reqData = await reqRes.json();
      const balData = await balRes.json();
      setRequests(reqData.requests || []);
      setBalance(balData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getLeaveTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      sick: 'bg-red-100 text-red-800',
      casual: 'bg-blue-100 text-blue-800',
      earned: 'bg-green-100 text-green-800',
      emergency: 'bg-amber-100 text-amber-800',
    };
    return <Badge className={`${colors[type] || 'bg-slate-100 text-slate-800'} hover:${colors[type]}`}>{type}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <PageWrapper>
    <div className="space-y-4 sm:space-y-6">
      <motion.div variants={fadeInUp} initial="hidden" animate="visible">
        <LeaveBalanceCard total={balance.totalLeaves} used={balance.usedLeaves} />
      </motion.div>
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
        <LeaveRequestForm balance={balance} onSuccess={fetchData} />
      </motion.div>

      <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
      <Card>
        <CardHeader className="px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Leave History</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {requests.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No leave requests found.</p>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="sm:hidden space-y-3">
                {requests.map((req: any) => (
                  <div key={req._id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      {getLeaveTypeBadge(req.leaveType)}
                      <LeaveStatusBadge status={req.status} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</span>
                      <span className="font-medium">{req.totalDays} day{req.totalDays > 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{req.reason}</p>
                    {req.hrComment && <p className="text-xs text-slate-400 italic">HR: {req.hrComment}</p>}
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead className="hidden md:table-cell">Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">HR Comment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req: any) => (
                      <TableRow key={req._id}>
                        <TableCell>{getLeaveTypeBadge(req.leaveType)}</TableCell>
                        <TableCell className="text-sm">{new Date(req.startDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm">{new Date(req.endDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{req.totalDays}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">{req.reason}</TableCell>
                        <TableCell><LeaveStatusBadge status={req.status} /></TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-slate-500">{req.hrComment || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </div>
    </PageWrapper>
  );
}
