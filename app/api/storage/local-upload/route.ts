import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);

export async function PUT(req: Request) {
  try {
    // Basic auth check
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow in local environment for security
    if (process.env.STORAGE_PROVIDER && process.env.STORAGE_PROVIDER !== 'local') {
      return NextResponse.json({ error: 'Local storage is not enabled' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('filename');

    if (!fileName) {
      return NextResponse.json({ error: 'Missing filename parameter' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, fileName);
    
    // Ensure nested directories exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const buffer = Buffer.from(await req.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/uploads/${fileName}` });
  } catch (error) {
    console.error('Local file upload failed:', error);
    return NextResponse.json({ error: 'Failed to upload file locally' }, { status: 500 });
  }
}
