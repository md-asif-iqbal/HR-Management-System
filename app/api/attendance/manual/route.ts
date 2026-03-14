import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import AttendanceRecord from '@/models/AttendanceRecord';
import {
  ApiValidationError,
  optionalString,
  requireBodyObject,
  requireEnum,
  requireMongoId,
  requireString,
} from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const body = requireBodyObject(await req.json());
    const userId = requireMongoId(body.userId, 'User ID');
    const date = requireString(body.date, 'Date');
    const status = requireEnum(body.status, 'Status', ['present', 'late', 'absent', 'on-leave']);
    const checkInTime = optionalString(body.checkInTime, 'Check In Time');
    const checkOutTime = optionalString(body.checkOutTime, 'Check Out Time');
    const notes = optionalString(body.notes, 'Notes', { maxLength: 500 });

    const existing = await AttendanceRecord.findOne({ userId, date });

    if (existing) {
      // Update existing record
      existing.status = status;
      if (notes !== undefined) existing.notes = notes;
      existing.markedBy = session.user.id as any;

      // Only set times for statuses that have check-in
      if (status === 'absent' || status === 'on-leave') {
        existing.checkInTime = null as any;
        existing.checkOutTime = null as any;
        existing.isLate = false;
        existing.minutesLate = 0;
        existing.workingHours = null as any;
      } else {
        if (checkInTime) {
          existing.checkInTime = new Date(checkInTime);
          const cin = new Date(checkInTime);
          const grace = new Date(cin);
          grace.setHours(10, 2, 0, 0);
          existing.isLate = cin > grace;
          existing.minutesLate = existing.isLate
            ? Math.floor((cin.getTime() - grace.getTime()) / 60000)
            : 0;
          // Auto-detect late status only if HR chose present
          if (status === 'present' && existing.isLate) {
            existing.status = 'late';
          }
        }
        if (checkOutTime) {
          existing.checkOutTime = new Date(checkOutTime);
          if (existing.checkInTime) {
            existing.workingHours = parseFloat(
              ((new Date(checkOutTime).getTime() - existing.checkInTime.getTime()) / 3600000).toFixed(2)
            );
          }
        }
      }

      await existing.save();
      return NextResponse.json({ record: existing });
    }

    // Create new manual record
    const newRecord: any = {
      userId,
      date,
      status,
      markedBy: session.user.id,
      notes: notes || 'Manually marked by HR',
      isLate: false,
      minutesLate: 0,
    };

    // Only set check-in for statuses that need it
    if (status === 'absent' || status === 'on-leave') {
      newRecord.checkInTime = null;
      newRecord.checkOutTime = null;
      newRecord.workingHours = null;
    } else {
      if (checkInTime) {
        newRecord.checkInTime = new Date(checkInTime);
        const cin = new Date(checkInTime);
        const grace = new Date(cin);
        grace.setHours(10, 2, 0, 0);
        newRecord.isLate = cin > grace;
        newRecord.minutesLate = newRecord.isLate
          ? Math.floor((cin.getTime() - grace.getTime()) / 60000)
          : 0;
        if (status === 'present' && newRecord.isLate) {
          newRecord.status = 'late';
        }
      }

      if (checkOutTime && newRecord.checkInTime) {
        newRecord.checkOutTime = new Date(checkOutTime);
        newRecord.workingHours = parseFloat(
          ((new Date(checkOutTime).getTime() - newRecord.checkInTime.getTime()) / 3600000).toFixed(2)
        );
      }
    }

    const record = await AttendanceRecord.create(newRecord);
    return NextResponse.json({ record });
  } catch (error: any) {
    if (error instanceof ApiValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
