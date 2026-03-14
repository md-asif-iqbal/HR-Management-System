import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import EmployeeDocument from '@/models/EmployeeDocument';
import {
  ApiValidationError,
  optionalNumber,
  optionalString,
  requireBodyObject,
  requireString,
} from '@/lib/validation';

// GET all documents for an employee
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isHR = session.user.role === 'hr';
    const isOwnProfile = session.user.id === params.id;

    if (!isHR && !isOwnProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const documents = await EmployeeDocument.find({ userId: params.id })
      .populate('uploadedBy', 'name')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ documents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST upload new document
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isHR = session.user.role === 'hr';
    const isOwnProfile = session.user.id === params.id;

    if (!isHR && !isOwnProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const body = requireBodyObject(await req.json());
    const documentType = requireString(body.documentType, 'Document Type', { maxLength: 60 });
    const documentName = requireString(body.documentName, 'Document Name', { minLength: 2, maxLength: 160 });
    const fileUrl = requireString(body.fileUrl, 'File URL', { minLength: 5, maxLength: 1000 });
    const deleteUrl = optionalString(body.deleteUrl, 'Delete URL', { maxLength: 1000 });
    const storageType = requireString(body.storageType, 'Storage Type', { maxLength: 40 });
    const fileType = requireString(body.fileType, 'File Type', { maxLength: 120 });
    const fileSize = optionalNumber(body.fileSize, 'File Size', { min: 0 }) || 0;
    const notes = optionalString(body.notes, 'Notes', { maxLength: 500 }) ?? '';

    const document = await EmployeeDocument.create({
      userId: params.id,
      documentType,
      documentName,
      fileUrl,
      deleteUrl,
      storageType,
      fileType,
      fileSize,
      uploadedBy: session.user.id,
      notes,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ApiValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
