import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import {
  ApiValidationError,
  optionalDate,
  optionalString,
  requireBodyObject,
  requireEmail,
  requireEnum,
  requireString,
} from '@/lib/validation';

// GET all employees (HR only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const filter: any = {};
    if (department && department !== 'all') filter.department = department;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await User.find(filter)
      .select('-password -salary')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ employees });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new employee (HR only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const body = requireBodyObject(await req.json());
    const name = requireString(body.name, 'Name', { minLength: 2, maxLength: 120 });
    const email = requireEmail(body.email, 'Email');
    const password = requireString(body.password, 'Password', { minLength: 6, maxLength: 128 });
    const department = optionalString(body.department, 'Department', { maxLength: 120 }) ?? '';
    const designation = optionalString(body.designation, 'Designation', { maxLength: 120 }) ?? '';
    const employmentType = body.employmentType
      ? requireEnum(body.employmentType, 'Employment Type', ['full-time', 'part-time', 'contractual', 'intern'])
      : 'full-time';
    const role = body.role
      ? requireEnum(body.role, 'Role', ['employee', 'hr'])
      : 'employee';
    const joiningDate = optionalDate(body.joiningDate, 'Joining Date');

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      designation,
      employmentType,
      joiningDate: joiningDate || new Date(),
    });

    const userObj = user.toObject();
    delete (userObj as any).password;
    delete (userObj as any).salary;

    return NextResponse.json({ employee: userObj }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ApiValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
