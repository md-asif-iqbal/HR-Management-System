import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToImgBB } from '@/lib/imgbb';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Max 10MB' }, { status: 400 });
    }

    const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/webp'];
    const isImage = ALLOWED_IMAGES.includes(file.type);
    const isPDF = file.type === 'application/pdf';

    if (!isImage && !isPDF) {
      return NextResponse.json({ error: 'Only images and PDFs allowed' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (isImage) {
      const result = await uploadToImgBB(buffer, file.name);
      return NextResponse.json({
        url: result.url,
        deleteUrl: result.deleteUrl,
        fileType: file.type,
        fileSize: file.size,
        storageType: 'imgbb',
      });
    }

    if (isPDF) {
      const base64 = buffer.toString('base64');
      const dataUrl = `data:application/pdf;base64,${base64}`;
      return NextResponse.json({
        url: dataUrl,
        deleteUrl: null,
        fileType: file.type,
        fileSize: file.size,
        storageType: 'base64',
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
