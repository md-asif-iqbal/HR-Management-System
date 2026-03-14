import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import LeaveRequest from '@/models/LeaveRequest';
import User from '@/models/User';
import AttendanceRecord from '@/models/AttendanceRecord';
import {
  ApiValidationError,
  optionalString,
  requireBodyObject,
  requireEnum,
} from '@/lib/validation';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const body = requireBodyObject(await req.json());
    const status = requireEnum(body.status, 'Status', ['approved', 'rejected']);
    const hrComment = optionalString(body.hrComment, 'HR Comment', { maxLength: 500 }) ?? '';

    const leaveRequest = await LeaveRequest.findById(params.id);
    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (leaveRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Leave request already reviewed' }, { status: 400 });
    }

    leaveRequest.status = status;
    leaveRequest.hrComment = hrComment;
    leaveRequest.reviewedBy = session.user.id as any;
    leaveRequest.reviewedAt = new Date();
    await leaveRequest.save();

    if (status === 'approved') {
      // Deduct leaves from user balance
      await User.findByIdAndUpdate(leaveRequest.userId, {
        $inc: { usedLeaves: leaveRequest.totalDays },
      });

      // Create attendance records for approved leave days
      const start = new Date(leaveRequest.startDate);
      const end = new Date(leaveRequest.endDate);
      const current = new Date(start);

      while (current <= end) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) {
          const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
          await AttendanceRecord.findOneAndUpdate(
            { userId: leaveRequest.userId, date: dateStr },
            {
              userId: leaveRequest.userId,
              date: dateStr,
              checkInTime: null,
              checkOutTime: null,
              status: 'on-leave',
              isLate: false,
              minutesLate: 0,
              workingHours: null,
              markedBy: session.user.id,
              notes: `${leaveRequest.leaveType} leave - approved`,
            },
            { upsert: true, new: true }
          );
        }
        current.setDate(current.getDate() + 1);
      }
    }

    return NextResponse.json({ request: leaveRequest });
  } catch (error: any) {
    if (error instanceof ApiValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
