import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { storageService } from '@/lib/storage';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, contentType, directory = 'general' } = await req.json();

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'Missing fileName or contentType' }, { status: 400 });
    }

    // Generate a unique, safe filename to prevent overwrites and directory traversal
    const extension = fileName.split('.').pop() || '';
    const safeBaseName = crypto.randomBytes(16).toString('hex');
    const uniqueFileName = `${directory}/${safeBaseName}.${extension}`;

    const { uploadUrl, publicUrl } = await storageService.getSignedUploadUrl(uniqueFileName, contentType);

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error) {
    console.error('Presign URL generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
