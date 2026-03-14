import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import LeaveRequest from '@/models/LeaveRequest';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const department = searchParams.get('department');

    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    let requests = await LeaveRequest.find(filter)
      .populate('userId', 'name employeeId department designation avatar')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Filter by department (from populated user)
    if (department && department !== 'all') {
      requests = requests.filter(
        (r: any) => r.userId?.department === department
      );
    }

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
