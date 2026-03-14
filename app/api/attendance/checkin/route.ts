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
      } else {
        // Normal device fingerprint flow
        if (!user?.registeredDevice?.fingerprint) {
          return NextResponse.json(
            { error: 'No device registered. Please register your device first from the attendance page.' },
            { status: 403 }
          );
        }
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

    // Use local date to avoid timezone issues (UTC vs local)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Check duplicate
    const existing = await AttendanceRecord.findOne({
      userId: session.user.id,
      date: today,
    });

    if (existing) {
      return NextResponse.json({ error: 'Already checked in today' }, { status: 400 });
    }

    // Server time only — never trust client
    const checkInTime = new Date();

    // Late detection
    const graceDeadline = new Date(checkInTime);
    graceDeadline.setHours(10, 2, 0, 0);

    const isLate = checkInTime > graceDeadline;
    const minutesLate = isLate
      ? Math.floor((checkInTime.getTime() - graceDeadline.getTime()) / 60000)
      : 0;

    const status = isLate ? 'late' : 'present';

    const record = await AttendanceRecord.create({
      userId: session.user.id,
      date: today,
      checkInTime,
      status,
      isLate,
      minutesLate,
    });

    return NextResponse.json({ record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
