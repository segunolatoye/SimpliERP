import { StorageProvider } from '../types';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    // Store files in the public/uploads directory during local dev
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Ensure directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async getSignedUploadUrl(fileName: string, contentType: string): Promise<{ uploadUrl: string; publicUrl: string }> {
    // For local dev, we simulate a pre-signed URL by pointing to a special local API route
    // that accepts uploads, OR we just let the client handle it differently.
    // For maximum compatibility, the frontend should just PUT to this local API.
    const publicUrl = `${this.baseUrl}/uploads/${fileName}`;
    const uploadUrl = `${this.baseUrl}/api/storage/local-upload?filename=${encodeURIComponent(fileName)}`;
    
    return { uploadUrl, publicUrl };
  }

  async uploadFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    const filePath = path.join(this.uploadDir, fileName);
    
    // Ensure nested directories exist if fileName includes paths like 'org-1/logo.png'
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(filePath, fileBuffer);
    return `${this.baseUrl}/uploads/${fileName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const url = new URL(fileUrl);
      // Remove '/uploads/' prefix from pathname to get the file name
      const fileName = url.pathname.replace('/uploads/', '');
      const filePath = path.join(this.uploadDir, fileName);
      
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      console.error('Failed to delete local file:', error);
    }
  }
}
