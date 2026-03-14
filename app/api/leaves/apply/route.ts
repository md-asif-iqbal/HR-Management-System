import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import LeaveRequest from '@/models/LeaveRequest';
import User from '@/models/User';
import { countWorkingDays } from '@/lib/helpers';
import {
  ApiValidationError,
  requireBodyObject,
  requireEnum,
  requireString,
} from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = requireBodyObject(await req.json());
    const leaveType = requireEnum(body.leaveType, 'Leave Type', ['sick', 'casual', 'earned', 'maternity', 'paternity', 'unpaid', 'emergency']);
    const startDate = requireString(body.startDate, 'Start Date');
    const endDate = requireString(body.endDate, 'End Date');
    const reason = requireString(body.reason, 'Reason', { minLength: 3, maxLength: 500 });

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Cannot apply for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return NextResponse.json({ error: 'Cannot apply leave for past dates' }, { status: 400 });
    }

    if (end < start) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    const totalDays = countWorkingDays(start, end);

    if (totalDays === 0) {
      return NextResponse.json({ error: 'Selected dates contain only weekends' }, { status: 400 });
    }

    // Check balance
    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const remainingLeaves = user.totalLeaves - user.usedLeaves;
    if (totalDays > remainingLeaves) {
      return NextResponse.json(
        { error: `Insufficient leave balance. You have ${remainingLeaves} leaves remaining.` },
        { status: 400 }
      );
    }

    // Check for overlapping leave requests
    const overlapping = await LeaveRequest.findOne({
      userId: session.user.id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (overlapping) {
      return NextResponse.json(
        { error: 'You already have a leave request for overlapping dates' },
        { status: 400 }
      );
    }

    const leaveRequest = await LeaveRequest.create({
      userId: session.user.id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
    });

    return NextResponse.json({ request: leaveRequest });
  } catch (error: any) {
    if (error instanceof ApiValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
