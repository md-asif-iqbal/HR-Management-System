import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import EmployeeDocument from '@/models/EmployeeDocument';

// PATCH verify a document (HR only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const document = await EmployeeDocument.findOneAndUpdate(
      { _id: params.docId, userId: params.id },
      {
        isVerified: true,
        verifiedBy: session.user.id,
        verifiedAt: new Date(),
      },
      { new: true }
    )
      .populate('verifiedBy', 'name')
      .lean();

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
