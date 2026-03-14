import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import {
  ApiValidationError,
  requireBodyObject,
  requireBoolean,
  requireMongoId,
} from '@/lib/validation';

/**
 * POST /api/device/reset
 * HR-only: Reset an employee's registered device so they can register a new one.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Forbidden — HR only' }, { status: 403 });
    }

    await dbConnect();
    const body = requireBodyObject(await req.json());
    const employeeId = requireMongoId(body.employeeId, 'Employee ID');

    const user = await User.findById(employeeId);
    if (!user) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    await User.findByIdAndUpdate(employeeId, { $unset: { registeredDevice: '' } });

    return NextResponse.json({ message: `Device reset for ${user.name}. They can now register a new device.` });
  } catch (error: any) {
    if (error instanceof ApiValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/device/reset
 * HR-only: Toggle device tracking on/off for an employee.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Forbidden — HR only' }, { status: 403 });
    }

    await dbConnect();
    const body = requireBodyObject(await req.json());
    const employeeId = requireMongoId(body.employeeId, 'Employee ID');
    const enabled = requireBoolean(body.enabled, 'Enabled');

    const user = await User.findByIdAndUpdate(
      employeeId,
      { deviceTrackingEnabled: enabled },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: `Device tracking ${enabled ? 'enabled' : 'disabled'} for ${user.name}`,
      deviceTrackingEnabled: user.deviceTrackingEnabled,
    });
  } catch (error: any) {
    if (error instanceof ApiValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
