import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import AttendanceRecord from '@/models/AttendanceRecord';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const department = searchParams.get('department');

    const userFilter: any = { role: 'employee', status: 'active' };
    if (department && department !== 'all') {
      userFilter.department = department;
    }

    const users = await User.find(userFilter)
      .select('name employeeId department designation')
      .sort({ employeeId: 1 })
      .lean();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const userIds = users.map((u) => u._id);

    const records = await AttendanceRecord.find({
      userId: { $in: userIds },
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const employees = users.map((user) => {
      const userRecords = records.filter(
        (r) => r.userId.toString() === user._id.toString()
      );

      const present = userRecords.filter((r) => r.status === 'present').length;
      const late = userRecords.filter((r) => r.status === 'late').length;
      const absent = userRecords.filter((r) => r.status === 'absent').length;
      const onLeave = userRecords.filter((r) => r.status === 'on-leave').length;
      const totalWorkingHours = userRecords.reduce(
        (sum, r) => sum + (r.workingHours || 0),
        0
      );

      const dailyRecords = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayRecord = userRecords.find((r) => r.date === dateStr);
        dailyRecords.push({
          date: dateStr,
          day: d,
          status: dayRecord?.status || null,
          checkInTime: dayRecord?.checkInTime || null,
          checkOutTime: dayRecord?.checkOutTime || null,
          workingHours: dayRecord?.workingHours || null,
          minutesLate: dayRecord?.minutesLate || 0,
          isLate: dayRecord?.isLate || false,
          isWeekend: [0, 6].includes(new Date(year, month - 1, d).getDay()),
        });
      }

      return {
        employeeId: user.employeeId,
        name: user.name,
        department: user.department,
        designation: user.designation,
        _id: user._id.toString(),
        summary: {
          present,
          late,
          absent,
          onLeave,
          totalWorkingHours: parseFloat(totalWorkingHours.toFixed(1)),
        },
        dailyRecords,
      };
    });

    const totals = {
      totalPresent: employees.reduce((s, e) => s + e.summary.present, 0),
      totalLate: employees.reduce((s, e) => s + e.summary.late, 0),
      totalAbsent: employees.reduce((s, e) => s + e.summary.absent, 0),
      totalOnLeave: employees.reduce((s, e) => s + e.summary.onLeave, 0),
    };

    return NextResponse.json({
      month: `${monthNames[month - 1]} ${year}`,
      department: department || 'All',
      daysInMonth,
      employees,
      totals,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
