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
    const date = searchParams.get('date');
    const department = searchParams.get('department');
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // Build user filter
    const userFilter: any = { role: 'employee', status: 'active' };
    if (department && department !== 'all') {
      userFilter.department = department;
    }

    const users = await User.find(userFilter)
      .select('name employeeId department designation avatar')
      .lean();

    const userIds = users.map((u) => u._id);

    // Build attendance filter
    let dateFilter: any;
    if (date) {
      dateFilter = { date };
    } else {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(
        new Date(year, month, 0).getDate()
      ).padStart(2, '0')}`;
      dateFilter = { date: { $gte: startDate, $lte: endDate } };
    }

    const records = await AttendanceRecord.find({
      userId: { $in: userIds },
      ...dateFilter,
    })
      .populate('userId', 'name employeeId department designation avatar')
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ records, users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
