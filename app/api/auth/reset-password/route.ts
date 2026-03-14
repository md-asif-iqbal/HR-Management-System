import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import {
  ApiValidationError,
  requireBodyObject,
  requireString,
} from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = requireBodyObject(await req.json());
    const token = requireString(body.token, 'Token', { minLength: 10, maxLength: 300 });
    const newPassword = requireString(body.password, 'New Password', { minLength: 6, maxLength: 128 });

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Reset link is invalid or expired' }, { status: 400 });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = '';
    user.resetPasswordExpires = null as any;
    await user.save();

    return NextResponse.json({ message: 'Password reset successful. You can now sign in.' });
  } catch (error: any) {
    if (error instanceof ApiValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 });
  }
}
