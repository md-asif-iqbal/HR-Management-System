import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import {
  ApiValidationError,
  requireBodyObject,
  requireEmail,
} from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = requireBodyObject(await req.json());
    const email = requireEmail(body.email, 'Email');

    const user = await User.findOne({ email });
    const genericMessage = 'If an account exists, a password reset link has been generated.';

    if (!user) {
      return NextResponse.json({ message: genericMessage });
    }

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    const appBaseUrl = (process.env.NEXTAUTH_URL || new URL(req.url).origin).replace(/\/$/, '');
    const resetUrl = `${appBaseUrl}/reset-password?token=${rawToken}`;

    return NextResponse.json({
      message: genericMessage,
      resetUrl,
      expiresAt,
    });
  } catch (error: any) {
    if (error instanceof ApiValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 });
  }
}
