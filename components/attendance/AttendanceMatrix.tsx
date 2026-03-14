'use client';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isWeekend, getHolidayName } from '@/lib/holidays';

interface AttendanceMatrixProps {
  employees: any[];
  daysInMonth: number;
  month: number;
  year: number;
}

export default function AttendanceMatrix({ employees, daysInMonth, month, year }: AttendanceMatrixProps) {
  const getCellContent = (record: any, cellIsWeekend = false, holidayName: string | null = null) => {
    if (!record || !record.status) {
      if (holidayName) {
        return { text: 'PH', className: 'bg-orange-50 text-orange-600', tooltip: holidayName };
      }
      if (cellIsWeekend) {
        return { text: 'W', className: 'bg-slate-100 text-slate-400', tooltip: 'Weekend (Fri/Sat)' };
      }
      return { text: '-', className: 'bg-slate-50 text-slate-300', tooltip: 'No record' };
    }

    switch (record.status) {
      case 'present':
        return { text: 'P', className: 'bg-green-100 text-green-800', tooltip: 'Present' };
      case 'late':
        return { text: 'L', className: 'bg-red-100 text-red-800', tooltip: `Late by ${record.minutesLate}m` };
      case 'absent':
        return { text: 'A', className: 'bg-red-50 text-red-600', tooltip: 'Absent' };
      case 'on-leave':
        return { text: 'OL', className: 'bg-blue-100 text-blue-800', tooltip: 'On Leave' };
      case 'half-day':
        return { text: 'HD', className: 'bg-amber-100 text-amber-800', tooltip: 'Half Day' };
      default:
        return { text: '-', className: 'bg-slate-50 text-slate-300', tooltip: '' };
    }
  };

  // Compute daily totals
  const dailyTotals: Record<number, { present: number; late: number; absent: number; onLeave: number }> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    dailyTotals[d] = { present: 0, late: 0, absent: 0, onLeave: 0 };
    employees.forEach((emp) => {
      const rec = emp.dailyRecords?.find((r: any) => r.day === d);
      if (rec?.status === 'present') dailyTotals[d].present++;
      if (rec?.status === 'late') dailyTotals[d].late++;
      if (rec?.status === 'absent') dailyTotals[d].absent++;
      if (rec?.status === 'on-leave') dailyTotals[d].onLeave++;
    });
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-slate-50">
              <th className="sticky left-0 bg-slate-50 z-10 px-3 py-2 text-left font-medium text-slate-700 min-w-[140px]">
                Employee
              </th>
              <th className="sticky left-[140px] bg-slate-50 z-10 px-2 py-2 text-left font-medium text-slate-700 min-w-[100px]">
                Department
              </th>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const date = new Date(year, month - 1, d);
                const isWknd = isWeekend(date);
                const holiday = getHolidayName(date);
                return (
                  <th
                    key={d}
                    title={holiday || (isWknd ? 'Weekend (Fri/Sat)' : undefined)}
                    className={cn(
                      'px-1 py-2 text-center font-medium min-w-[32px]',
                      holiday ? 'bg-orange-50 text-orange-600' : isWknd ? 'bg-slate-100 text-slate-400' : 'text-slate-700'
                    )}
                  >
                    {d}
                  </th>
                );
              })}
              <th className="px-2 py-2 text-center font-medium text-green-700 bg-green-50 min-w-[36px]">P</th>
              <th className="px-2 py-2 text-center font-medium text-red-700 bg-red-50 min-w-[36px]">L</th>
              <th className="px-2 py-2 text-center font-medium text-red-600 bg-red-50 min-w-[36px]">A</th>
              <th className="px-2 py-2 text-center font-medium text-blue-700 bg-blue-50 min-w-[36px]">OL</th>
              <th className="px-2 py-2 text-center font-medium text-slate-700 min-w-[50px]">Hrs</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="sticky left-0 bg-white z-10 px-3 py-2 font-medium text-slate-900">
                  <div>
                    <p className="truncate">{emp.name}</p>
                    <p className="text-xs text-slate-400">{emp.employeeId}</p>
                  </div>
                </td>
                <td className="sticky left-[140px] bg-white z-10 px-2 py-2 text-slate-600">
                  {emp.department || '-'}
                </td>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const rec = emp.dailyRecords?.find((r: any) => r.day === d);
                  const cellDate = new Date(year, month - 1, d);
                  const cellIsWknd = isWeekend(cellDate);
                  const cellHoliday = getHolidayName(cellDate);
                  const cell = getCellContent(rec, cellIsWknd, cellHoliday);
                  return (
                    <td key={d} className="px-1 py-2 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn('inline-block w-6 h-6 leading-6 rounded text-xs font-medium', cell.className)}>
                            {cell.text}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{cell.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center font-medium text-green-700">{emp.summary?.present || 0}</td>
                <td className="px-2 py-2 text-center font-medium text-red-700">{emp.summary?.late || 0}</td>
                <td className="px-2 py-2 text-center font-medium text-red-600">{emp.summary?.absent || 0}</td>
                <td className="px-2 py-2 text-center font-medium text-blue-700">{emp.summary?.onLeave || 0}</td>
                <td className="px-2 py-2 text-center font-medium text-slate-700">{emp.summary?.totalWorkingHours || 0}</td>
              </tr>
            ))}
            {/* Daily totals row */}
            <tr className="bg-slate-50 border-t-2 border-slate-300 font-medium">
              <td className="sticky left-0 bg-slate-50 z-10 px-3 py-2 text-slate-700">Daily Total</td>
              <td className="sticky left-[140px] bg-slate-50 z-10 px-2 py-2"></td>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <td key={d} className="px-1 py-2 text-center text-slate-600">
                  {dailyTotals[d].present + dailyTotals[d].late > 0
                    ? dailyTotals[d].present + dailyTotals[d].late
                    : '-'}
                </td>
              ))}
              <td className="px-2 py-2 text-center text-green-700">
                {employees.reduce((s, e) => s + (e.summary?.present || 0), 0)}
              </td>
              <td className="px-2 py-2 text-center text-red-700">
                {employees.reduce((s, e) => s + (e.summary?.late || 0), 0)}
              </td>
              <td className="px-2 py-2 text-center text-red-600">
                {employees.reduce((s, e) => s + (e.summary?.absent || 0), 0)}
              </td>
              <td className="px-2 py-2 text-center text-blue-700">
                {employees.reduce((s, e) => s + (e.summary?.onLeave || 0), 0)}
              </td>
              <td className="px-2 py-2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}
