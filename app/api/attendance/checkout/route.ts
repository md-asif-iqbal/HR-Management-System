import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import AttendanceRecord from '@/models/AttendanceRecord';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // ── Device / password verification ──────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const { deviceFingerprint, fingerprintUnavailable, password } = body;

    const user = await User.findById(session.user.id)
      .select('registeredDevice deviceTrackingEnabled password')
      .lean();

    if (user?.deviceTrackingEnabled !== false) {
      if (fingerprintUnavailable) {
        // Fingerprint not available on this browser → require password confirmation
        if (!password) {
          return NextResponse.json(
            { error: 'Your browser does not support device fingerprinting. Please enter your password to confirm your identity.' },
            { status: 400 }
          );
        }
        const passwordValid = await bcrypt.compare(password, (user as any).password);
        if (!passwordValid) {
          return NextResponse.json(
            { error: 'Incorrect password. Identity verification failed.' },
            { status: 403 }
          );
        }
      } else if (user?.registeredDevice?.fingerprint) {
        // Normal device fingerprint flow (only if device is already registered)
        if (!deviceFingerprint) {
          return NextResponse.json(
            { error: 'Device fingerprint is required for attendance.' },
            { status: 400 }
          );
        }
        if (user.registeredDevice.fingerprint !== deviceFingerprint) {
          return NextResponse.json(
            { error: 'Attendance must be marked from your registered device. Contact HR if you changed your device.' },
            { status: 403 }
          );
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    // Use local date to avoid timezone issues
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const record = await AttendanceRecord.findOne({
      userId: session.user.id,
      date: today,
    });

    if (!record) {
      return NextResponse.json({ error: 'No check-in found for today' }, { status: 400 });
    }

    if (record.checkOutTime) {
      return NextResponse.json({ error: 'Already checked out today' }, { status: 400 });
    }

    // Server time only
    const checkOutTime = new Date();
    const workingHours = parseFloat(
      ((checkOutTime.getTime() - record.checkInTime.getTime()) / 3600000).toFixed(2)
    );

    record.checkOutTime = checkOutTime;
    record.workingHours = workingHours;
    await record.save();

    return NextResponse.json({ record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
