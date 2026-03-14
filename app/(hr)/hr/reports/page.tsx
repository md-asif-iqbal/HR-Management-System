'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportAllEmployeesMonthlyAttendance, exportLateArrivalsReport, exportSummaryOnly } from '@/lib/exportExcel';
import PageWrapper from '@/components/layout/PageWrapper';
import { StaggeredStatsCentered } from '@/components/ui/StaggeredStats';

export default function HRReportsPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/monthly?month=${month}&year=${year}`);
        const data = await res.json();
        setReport(data.employees ? data : null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [month, year]);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) return <div className="h-96 bg-white rounded-lg animate-pulse" />;

  return (
    <PageWrapper>
    <div className="space-y-4 sm:space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex gap-3">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-full sm:w-40 min-h-[44px] sm:min-h-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28 min-h-[44px] sm:min-h-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 sm:ml-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] sm:min-h-0 flex-1 sm:flex-none text-xs sm:text-sm"
            onClick={() => {
              if (!report) return;
              const data = report.employees.map((emp: any) => ({
                employeeId: emp.employeeId,
                employeeName: emp.name,
                records: emp.dailyRecords || [],
              }));
              exportAllEmployeesMonthlyAttendance(data, month, year);
              toast.success('Full report exported');
            }}
            disabled={!report}
          >
            Export Full Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] sm:min-h-0 flex-1 sm:flex-none text-xs sm:text-sm"
            onClick={() => {
              if (!report) return;
              const records: any[] = [];
              report.employees.forEach((emp: any) => {
                (emp.dailyRecords || []).forEach((r: any) => {
                  if (r.isLate) {
                    records.push({
                      employeeId: emp.employeeId,
                      employeeName: emp.name,
                      date: r.date,
                      checkInTime: r.checkInTime,
                      minutesLate: r.minutesLate,
                    });
                  }
                });
              });
              exportLateArrivalsReport(records, month, year);
              toast.success('Late report exported');
            }}
            disabled={!report}
          >
            Export Late Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] sm:min-h-0 flex-1 sm:flex-none text-xs sm:text-sm"
            onClick={() => {
              if (!report) return;
              const data = report.employees.map((emp: any) => ({
                employeeId: emp.employeeId,
                employeeName: emp.name,
                presentDays: emp.summary?.present || 0,
                lateDays: emp.summary?.late || 0,
                absentDays: emp.summary?.absent || 0,
                leaveDays: emp.summary?.onLeave || 0,
                totalWorkingHours: emp.summary?.totalWorkingHours || 0,
              }));
              exportSummaryOnly(data, month, year);
              toast.success('Summary exported');
            }}
            disabled={!report}
          >
            Export Summary
          </Button>
        </div>
      </div>

      {/* Totals */}
      {report && (
        <StaggeredStatsCentered
          cards={[
            { label: 'Total Present', value: report.totals?.totalPresent || 0, color: 'text-green-600' },
            { label: 'Total Late', value: report.totals?.totalLate || 0, color: 'text-amber-600' },
            { label: 'Total Absent', value: report.totals?.totalAbsent || 0, color: 'text-red-600' },
            { label: 'Total Leave', value: report.totals?.totalOnLeave || 0, color: 'text-blue-600' },
            { label: 'Total Hours', value: parseFloat(report.employees?.reduce((s: number, e: any) => s + (e.summary?.totalWorkingHours || 0), 0).toFixed(1) || '0'), color: 'text-slate-900' },
          ]}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4"
        />
      )}

      {/* Per-Employee Summary */}
      {report && (
        <>
          {/* Mobile card view */}
          <div className="sm:hidden space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Employee Summary — {months[month - 1]} {year}</h3>
            {(report.employees || []).length === 0 ? (
              <p className="text-center py-8 text-slate-500">No data</p>
            ) : (report.employees || []).map((emp: any) => (
              <Card key={emp.employeeId}>
                <CardContent className="p-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs text-slate-500">{emp.employeeId} · {emp.department || '—'}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm font-bold text-green-600">{emp.summary?.present || 0}</p>
                      <p className="text-[10px] text-slate-500">Present</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-600">{emp.summary?.late || 0}</p>
                      <p className="text-[10px] text-slate-500">Late</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-600">{emp.summary?.absent || 0}</p>
                      <p className="text-[10px] text-slate-500">Absent</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm font-bold text-blue-600">{emp.summary?.onLeave || 0}</p>
                      <p className="text-[10px] text-slate-500">Leave</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{(emp.summary?.totalWorkingHours || 0).toFixed(1)}</p>
                      <p className="text-[10px] text-slate-500">Hours</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        {emp.summary?.present > 0
                          ? (emp.summary.totalWorkingHours / emp.summary.present).toFixed(1)
                          : '—'}
                      </p>
                      <p className="text-[10px] text-slate-500">Avg Hrs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden sm:block">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-sm sm:text-base">Employee Summary — {months[month - 1]} {year}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Late</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Leave</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Hours</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Avg Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(report.employees || []).length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No data</TableCell></TableRow>
                  ) : (report.employees || []).map((emp: any) => (
                    <TableRow key={emp.employeeId}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{emp.name}</p>
                          <p className="text-xs text-slate-500">{emp.employeeId} · {emp.department || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{emp.summary?.present || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{emp.summary?.late || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{emp.summary?.absent || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{emp.summary?.onLeave || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium hidden md:table-cell">{(emp.summary?.totalWorkingHours || 0).toFixed(1)}</TableCell>
                      <TableCell className="text-center text-sm hidden md:table-cell">
                        {emp.summary?.present > 0
                          ? (emp.summary.totalWorkingHours / emp.summary.present).toFixed(1)
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
    </PageWrapper>
  );
}
