'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { format, getDaysInMonth as fnsGetDaysInMonth } from 'date-fns';
import PageWrapper from '@/components/layout/PageWrapper';

export default function HRAttendancePage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual entry state
  const [manualOpen, setManualOpen] = useState(false);
  const [manualData, setManualData] = useState({ userId: '', date: '', checkInTime: '', checkOutTime: '', status: 'present', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const daysInMonth = fnsGetDaysInMonth(new Date(year, month - 1));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [empRes, attRes] = await Promise.all([
          fetch('/api/employees'),
          fetch(`/api/attendance/all?month=${month}&year=${year}`),
        ]);
        const empData = await empRes.json();
        const attData = await attRes.json();
        // Filter out HR users from employees list - attendance API only returns employee records
        setEmployees((empData.employees || []).filter((e: any) => e.role !== 'hr'));
        setAttendance(attData.records || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [month, year]);

  const getRecord = (userId: string, day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendance.find((a: any) => {
      const uid = a.userId?._id || a.userId;
      return uid === userId && a.date === dateStr;
    });
  };

  const getCellColor = (status: string | undefined, isLate?: boolean) => {
    if (!status) return 'bg-slate-50 text-slate-300';
    if (isLate) return 'bg-amber-100 text-amber-800';
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-amber-100 text-amber-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'on-leave': return 'bg-blue-100 text-blue-800';
      case 'half-day': return 'bg-purple-100 text-purple-800';
      case 'holiday': return 'bg-slate-200 text-slate-600';
      default: return 'bg-slate-50 text-slate-300';
    }
  };

  const getCellLabel = (status: string | undefined, isLate?: boolean) => {
    if (!status) return '—';
    if (isLate) return 'L';
    switch (status) {
      case 'present': return 'P';
      case 'late': return 'L';
      case 'absent': return 'A';
      case 'on-leave': return 'LV';
      case 'half-day': return 'H';
      case 'holiday': return 'HD';
      default: return '—';
    }
  };

  // BD weekends: Friday (5) and Saturday (6)
  const isWeekend = (day: number) => {
    const date = new Date(year, month - 1, day);
    return date.getDay() === 5 || date.getDay() === 6;
  };

  const getHoliday = (day: number): string | null => {
    const date = new Date(year, month - 1, day);
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const FIXED: Record<string, string> = {
      '2-21': 'Mother Language Day', '3-17': "Bangabandhu's Birthday",
      '3-26': 'Independence Day', '4-14': 'Pohela Boishakh',
      '5-1': 'Labour Day', '8-15': 'National Mourning Day',
      '12-16': 'Victory Day', '12-25': 'Christmas',
    };
    return FIXED[`${m}-${d}`] || null;
  };

  const submitManualEntry = async () => {
    setSubmitting(true);
    try {
      const body: any = {
        userId: manualData.userId,
        date: manualData.date,
        status: manualData.status,
        notes: manualData.notes,
      };
      if (manualData.checkInTime) body.checkInTime = new Date(`${manualData.date}T${manualData.checkInTime}`).toISOString();
      if (manualData.checkOutTime) body.checkOutTime = new Date(`${manualData.date}T${manualData.checkOutTime}`).toISOString();

      const res = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Attendance record saved');
      setManualOpen(false);
      setManualData({ userId: '', date: '', checkInTime: '', checkOutTime: '', status: 'present', notes: '' });

      // Refetch
      const attRes = await fetch(`/api/attendance/all?month=${month}&year=${year}`);
      const attData = await attRes.json();
      setAttendance(attData.records || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return <div className="h-96 bg-white rounded-lg animate-pulse" />;
  }

  return (
    <PageWrapper>
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-full sm:w-40 min-h-[44px] sm:min-h-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-full sm:w-28 min-h-[44px] sm:min-h-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2023, 2024, 2025, 2026].map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={manualOpen} onOpenChange={setManualOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-700 text-white sm:ml-auto min-h-[44px] sm:min-h-0">+ Manual Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manual Attendance Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select value={manualData.userId} onValueChange={(v) => setManualData({ ...manualData, userId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={manualData.date} onChange={(e) => setManualData({ ...manualData, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check-in Time</Label>
                  <Input type="time" value={manualData.checkInTime} onChange={(e) => setManualData({ ...manualData, checkInTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Check-out Time</Label>
                  <Input type="time" value={manualData.checkOutTime} onChange={(e) => setManualData({ ...manualData, checkOutTime: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={manualData.status} onValueChange={(v) => setManualData({ ...manualData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="half-day">Half Day</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={manualData.notes} onChange={(e) => setManualData({ ...manualData, notes: e.target.value })} placeholder="Reason..." />
              </div>
              <Button onClick={submitManualEntry} disabled={submitting || !manualData.userId || !manualData.date} className="w-full bg-slate-900 hover:bg-slate-700 text-white">
                {submitting ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-green-100" /> Present</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-amber-100" /> Late</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-100" /> Absent</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-blue-100" /> Leave</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-purple-100" /> Half Day</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-slate-100" /> Weekend (Fri/Sat)</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-orange-100" /> Public Holiday</span>
      </div>

      {/* Matrix - Mobile card view */}
      <div className="md:hidden space-y-3">
        {employees.map((emp: any) => {
          const empRecords = attendance.filter((a: any) => {
            const uid = a.userId?._id || a.userId;
            return uid === emp._id;
          });
          const pCount = empRecords.filter((r: any) => r.status === 'present' || r.status === 'late').length;
          const lCount = empRecords.filter((r: any) => r.isLate).length;
          const aCount = empRecords.filter((r: any) => r.status === 'absent').length;
          return (
            <Card key={emp._id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold flex-shrink-0">{emp.name?.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{emp.name}</p>
                    <p className="text-xs text-slate-400">{emp.employeeId}</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100" /><b className="text-green-700">{pCount}</b> P</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100" /><b className="text-amber-700">{lCount}</b> L</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100" /><b className="text-red-700">{aCount}</b> A</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Matrix - Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <TooltipProvider>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 sticky left-0 bg-white z-10 min-w-[160px]">Employee</th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const wknd = isWeekend(day);
                    const hday = getHoliday(day);
                    return (
                      <th key={day} title={hday || (wknd ? 'Weekend (Fri/Sat)' : undefined)} className={`p-1 text-center min-w-[28px] ${hday ? 'bg-orange-50 text-orange-600' : wknd ? 'bg-slate-50 text-slate-400' : ''}`}>
                        {day}
                      </th>
                    );
                  })}
                  <th className="p-2 text-center min-w-[32px]">P</th>
                  <th className="p-2 text-center min-w-[32px]">L</th>
                  <th className="p-2 text-center min-w-[32px]">A</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp: any) => {
                  let pCount = 0, lCount = 0, aCount = 0;
                  return (
                    <tr key={emp._id} className="border-b hover:bg-slate-50/50">
                      <td className="p-2 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {emp.name?.charAt(0)}
                          </div>
                          <div className="truncate">
                            <p className="font-medium truncate">{emp.name}</p>
                            <p className="text-slate-400">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const record = getRecord(emp._id, day);
                        const weekend = isWeekend(day);
                        const hday = getHoliday(day);
                        const today = new Date();
                        const cellDate = new Date(year, month - 1, day);
                        const isFuture = cellDate > today;

                        if (record?.status === 'present' || record?.status === 'late') pCount++;
                        if (record?.isLate) lCount++;
                        if (record?.status === 'absent') aCount++;

                        return (
                          <td key={day} title={hday || undefined} className={`p-0.5 text-center ${hday && !record ? 'bg-orange-50' : weekend ? 'bg-slate-50' : ''}`}>
                            {isFuture ? (
                              <span className="text-slate-200">—</span>
                            ) : hday && !record ? (
                              <span className="inline-block w-5 h-5 leading-5 rounded text-[10px] bg-orange-100 text-orange-600" title={hday}>PH</span>
                            ) : weekend && !record ? (
                              <span className="inline-block w-5 h-5 leading-5 rounded text-[10px] bg-slate-100 text-slate-400">W</span>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className={`inline-block w-5 h-5 leading-5 rounded text-[10px] font-medium cursor-default ${getCellColor(record?.status, record?.isLate)}`}>
                                    {getCellLabel(record?.status, record?.isLate)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <p className="font-medium">{emp.name} - {format(cellDate, 'dd MMM yyyy')}</p>
                                    {record ? (
                                      <>
                                        <p>Status: {record.status}{record.isLate ? ' (Late)' : ''}</p>
                                        {record.checkInTime && <p>In: {format(new Date(record.checkInTime), 'hh:mm a')}</p>}
                                        {record.checkOutTime && <p>Out: {format(new Date(record.checkOutTime), 'hh:mm a')}</p>}
                                        {record.workingHours > 0 && <p>Hours: {record.workingHours.toFixed(1)}</p>}
                                      </>
                                    ) : (
                                      <p>No record</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-1 text-center font-medium text-green-700">{pCount}</td>
                      <td className="p-1 text-center font-medium text-amber-700">{lCount}</td>
                      <td className="p-1 text-center font-medium text-red-700">{aCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
    </PageWrapper>
  );
}
