import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import EmployeeUpdateLog from '@/models/EmployeeUpdateLog';

// GET update history for an employee
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const section = searchParams.get('section');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const filter: any = { employeeId: params.id };
    if (section && section !== 'all') {
      filter.section = section;
    }

    const [logs, total] = await Promise.all([
      EmployeeUpdateLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('updatedBy', 'name employeeId avatar')
        .lean(),
      EmployeeUpdateLog.countDocuments(filter),
    ]);

    return NextResponse.json({ logs, total });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
