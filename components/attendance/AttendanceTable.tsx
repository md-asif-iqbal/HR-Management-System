'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface AttendanceTableProps {
  records: any[];
  showEmployee?: boolean;
}

export default function AttendanceTable({ records, showEmployee = false }: AttendanceTableProps) {
  const getStatusBadge = (record: any) => {
    switch (record.status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">On Time</Badge>;
      case 'late':
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">Late {record.minutesLate}m</Badge>;
      case 'absent':
        return <Badge className="bg-red-50 text-red-600 hover:bg-red-50">Absent</Badge>;
      case 'on-leave':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">On Leave</Badge>;
      case 'half-day':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Half Day</Badge>;
      default:
        return <Badge variant="secondary">{record.status}</Badge>;
    }
  };

  const getRowBorder = (status: string) => {
    switch (status) {
      case 'present': return 'border-l-4 border-l-green-500';
      case 'late': return 'border-l-4 border-l-red-500';
      case 'absent': return 'border-l-4 border-l-red-300 border-dashed';
      case 'on-leave': return 'border-l-4 border-l-blue-500';
      default: return '';
    }
  };

  const formatTime = (time: string | Date | null) => {
    if (!time) return '-';
    return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No attendance records found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {showEmployee && <TableHead>Employee</TableHead>}
            <TableHead>Check In</TableHead>
            <TableHead className="hidden sm:table-cell">Check Out</TableHead>
            <TableHead className="hidden md:table-cell">Working Hours</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record: any) => (
            <TableRow key={record._id} className={cn(getRowBorder(record.status))}>
              <TableCell className="font-medium">
                <div>
                  <p>{record.date}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                </div>
              </TableCell>
              {showEmployee && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">
                      {record.userId?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{record.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{record.userId?.employeeId}</p>
                    </div>
                  </div>
                </TableCell>
              )}
              <TableCell>{formatTime(record.checkInTime)}</TableCell>
              <TableCell className="hidden sm:table-cell">{formatTime(record.checkOutTime)}</TableCell>
              <TableCell className="hidden md:table-cell">{record.workingHours ? `${record.workingHours}h` : '-'}</TableCell>
              <TableCell>{getStatusBadge(record)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
