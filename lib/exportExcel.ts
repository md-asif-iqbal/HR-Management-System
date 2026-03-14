import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface AttendanceExportRecord {
  date: string;
  checkInTime?: string | Date;
  checkOutTime?: string | Date;
  workingHours?: number;
  status: string;
  minutesLate?: number;
  notes?: string;
  userId?: string;
}

export function exportEmployeeMonthlyAttendance(
  employeeName: string,
  employeeId: string,
  month: string,
  records: AttendanceExportRecord[]
) {
  const data = records.map((r) => ({
    'Date': r.date,
    'Check In': r.checkInTime
      ? format(new Date(r.checkInTime), 'hh:mm a')
      : '-',
    'Check Out': r.checkOutTime
      ? format(new Date(r.checkOutTime), 'hh:mm a')
      : '-',
    'Working Hours': r.workingHours ?? '-',
    'Status': r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : '-',
    'Late By (mins)': r.minutesLate ?? 0,
    'Notes': r.notes ?? '',
  }));

  const present = records.filter((r) => r.status === 'present').length;
  const late = records.filter((r) => r.status === 'late').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const onLeave = records.filter((r) => r.status === 'on-leave').length;

  data.push({} as any);
  data.push({
    'Date': 'SUMMARY',
    'Check In': `Present: ${present}`,
    'Check Out': `Late: ${late}`,
    'Working Hours': `Absent: ${absent}` as any,
    'Status': `On Leave: ${onLeave}`,
    'Late By (mins)': '' as any,
    'Notes': '',
  });

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 14 }, { wch: 12 }, { wch: 12 },
    { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
  XLSX.writeFile(wb, `${employeeId}_${employeeName.replace(/\s+/g, '_')}_${month.replace(/\s+/g, '_')}_Attendance.xlsx`);
}

export function exportAllEmployeesMonthlyAttendance(
  employees: { employeeId: string; employeeName: string; records: AttendanceExportRecord[] }[],
  month: number,
  year: number
) {
  const monthLabel = `${format(new Date(year, month - 1), 'MMMM_yyyy')}`;
  const wb = XLSX.utils.book_new();

  const summaryData = employees.map((emp) => {
    const present = emp.records.filter((r) => r.status === 'present').length;
    const late = emp.records.filter((r) => r.status === 'late').length;
    const absent = emp.records.filter((r) => r.status === 'absent').length;
    const onLeave = emp.records.filter((r) => r.status === 'on-leave').length;
    const totalHours = emp.records
      .reduce((sum, r) => sum + (r.workingHours ?? 0), 0)
      .toFixed(1);

    return {
      'Employee ID': emp.employeeId,
      'Employee Name': emp.employeeName,
      'Present Days': present,
      'Late Days': late,
      'Absent Days': absent,
      'Leave Days': onLeave,
      'Total Working Hours': totalHours,
    };
  });

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { wch: 14 }, { wch: 22 },
    { wch: 14 }, { wch: 12 }, { wch: 14 },
    { wch: 12 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  employees.forEach((emp) => {
    const sortedRecords = [...emp.records].sort((a, b) => a.date.localeCompare(b.date));

    const sheetData = sortedRecords.map((r) => ({
      'Date': r.date,
      'Check In': r.checkInTime
        ? format(new Date(r.checkInTime), 'hh:mm a')
        : '-',
      'Check Out': r.checkOutTime
        ? format(new Date(r.checkOutTime), 'hh:mm a')
        : '-',
      'Working Hours': r.workingHours ?? '-',
      'Status': r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : '-',
      'Late By (mins)': r.minutesLate ?? 0,
    }));

    const ws = XLSX.utils.json_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 14 }, { wch: 12 }, { wch: 12 },
      { wch: 16 }, { wch: 12 }, { wch: 16 },
    ];

    const sheetName = emp.employeeName.substring(0, 28);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  XLSX.writeFile(wb, `All_Employees_Attendance_${monthLabel}.xlsx`);
}

export function exportLateArrivalsReport(
  lateRecords: { employeeName: string; employeeId?: string; date: string; checkInTime?: string | Date; minutesLate?: number }[],
  month: number,
  year: number
) {
  const monthLabel = `${format(new Date(year, month - 1), 'MMMM_yyyy')}`;
  const data = lateRecords
    .sort((a, b) => (b.minutesLate ?? 0) - (a.minutesLate ?? 0))
    .map((r) => ({
      'Employee Name': r.employeeName,
      'Date': r.date,
      'Check In Time': r.checkInTime
        ? format(new Date(r.checkInTime), 'hh:mm a')
        : '-',
      'Late By (mins)': r.minutesLate ?? 0,
    }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 22 }, { wch: 14 },
    { wch: 14 }, { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Late Arrivals');
  XLSX.writeFile(wb, `Late_Arrivals_${monthLabel}.xlsx`);
}

export function exportSummaryOnly(
  employees: { employeeId: string; employeeName: string; presentDays?: number; lateDays?: number; absentDays?: number; leaveDays?: number; totalWorkingHours?: number }[],
  month: number,
  year: number
) {
  const monthLabel = `${format(new Date(year, month - 1), 'MMMM_yyyy')}`;
  const summaryData = employees.map((emp) => ({
    'Employee ID': emp.employeeId,
    'Employee Name': emp.employeeName,
    'Present Days': emp.presentDays ?? 0,
    'Late Days': emp.lateDays ?? 0,
    'Absent Days': emp.absentDays ?? 0,
    'Leave Days': emp.leaveDays ?? 0,
    'Total Working Hours': (emp.totalWorkingHours ?? 0).toFixed(1),
  }));

  const ws = XLSX.utils.json_to_sheet(summaryData);
  ws['!cols'] = [
    { wch: 14 }, { wch: 22 },
    { wch: 14 }, { wch: 12 }, { wch: 14 },
    { wch: 12 }, { wch: 22 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Summary');
  XLSX.writeFile(wb, `Attendance_Summary_${monthLabel}.xlsx`);
}
