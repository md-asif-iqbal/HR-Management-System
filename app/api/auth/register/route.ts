import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import {
  ApiValidationError,
  requireBodyObject,
  requireEmail,
  requireString,
} from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = requireBodyObject(await req.json());
    const name = requireString(body.name, 'Name', { minLength: 2, maxLength: 120 });
    const email = requireEmail(body.email, 'Email');
    const password = requireString(body.password, 'Password', { minLength: 6, maxLength: 128 });

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ error: 'An account already exists with this email' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'employee',
      status: 'active',
      employmentType: 'full-time',
      joiningDate: new Date(),
      totalLeaves: 12,
      usedLeaves: 0,
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ApiValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error?.code === 11000 && error?.keyPattern?.email) {
      return NextResponse.json({ error: 'An account already exists with this email' }, { status: 409 });
    }

    return NextResponse.json({ error: error.message || 'Failed to create account' }, { status: 500 });
  }
}
