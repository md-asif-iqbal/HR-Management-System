import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import {
  ApiValidationError,
  optionalString,
  requireBodyObject,
  requireString,
} from '@/lib/validation';

/**
 * POST /api/device/register
 * Register the current device for attendance tracking.
 * Once a device is registered, only that device can mark attendance.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = requireBodyObject(await req.json());
    const fingerprint = requireString(body.fingerprint, 'Device fingerprint', { minLength: 8, maxLength: 300 });
    const browser = optionalString(body.browser, 'Browser', { maxLength: 120 }) ?? '';
    const os = optionalString(body.os, 'OS', { maxLength: 120 }) ?? '';
    const screenResolution = optionalString(body.screenResolution, 'Screen Resolution', { maxLength: 40 }) ?? '';
    const language = optionalString(body.language, 'Language', { maxLength: 30 }) ?? '';
    const timezone = optionalString(body.timezone, 'Timezone', { maxLength: 80 }) ?? '';

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If device is already registered, reject (HR must reset first)
    if (user.registeredDevice?.fingerprint) {
      return NextResponse.json(
        { error: 'A device is already registered. Contact HR to reset your device.' },
        { status: 409 }
      );
    }

    const deviceData = {
      fingerprint,
      browser,
      os,
      screenResolution,
      language,
      timezone,
      registeredAt: new Date(),
    };

    await User.findByIdAndUpdate(session.user.id, { $set: { registeredDevice: deviceData } });

    return NextResponse.json({
      message: 'Device registered successfully',
      device: {
        browser: deviceData.browser,
        os: deviceData.os,
        screenResolution: deviceData.screenResolution,
        registeredAt: deviceData.registeredAt,
      },
    });
  } catch (error: any) {
    if (error instanceof ApiValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/device/register
 * Check if current user has a registered device and its status.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select('registeredDevice deviceTrackingEnabled').lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasDevice = !!user.registeredDevice?.fingerprint;

    return NextResponse.json({
      hasDevice,
      deviceTrackingEnabled: user.deviceTrackingEnabled ?? true,
      device: hasDevice
        ? {
            fingerprint: user.registeredDevice!.fingerprint,
            browser: user.registeredDevice!.browser,
            os: user.registeredDevice!.os,
            screenResolution: user.registeredDevice!.screenResolution,
            language: user.registeredDevice!.language,
            timezone: user.registeredDevice!.timezone,
            registeredAt: user.registeredDevice!.registeredAt,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
