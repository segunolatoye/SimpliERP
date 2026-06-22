import { StorageProvider } from '../types';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrlBase: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET_NAME || '';
    
    // Custom domain for Cloudflare R2 or CDN in front of S3
    this.publicUrlBase = process.env.S3_PUBLIC_URL || '';

    this.client = new S3Client({
      region: process.env.S3_REGION || 'auto', // 'auto' is typically used for Cloudflare R2
      endpoint: process.env.S3_ENDPOINT, // E.g., https://<account_id>.r2.cloudflarestorage.com
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
    });
  }

  private getPublicUrl(fileName: string): string {
    if (this.publicUrlBase) {
      // Remove trailing slash if exists, and ensure fileName doesn't start with slash
      const base = this.publicUrlBase.endsWith('/') ? this.publicUrlBase.slice(0, -1) : this.publicUrlBase;
      const cleanFileName = fileName.startsWith('/') ? fileName.substring(1) : fileName;
      return `${base}/${cleanFileName}`;
    }
    
    // Fallback if no custom public URL is provided (not recommended for production)
    const endpoint = process.env.S3_ENDPOINT;
    if (endpoint) {
      return `${endpoint}/${this.bucket}/${fileName}`;
    }
    return `https://${this.bucket}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;
  }

  async getSignedUploadUrl(fileName: string, contentType: string): Promise<{ uploadUrl: string; publicUrl: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
      ContentType: contentType,
      // For R2, ACLs might not be supported depending on configuration, 
      // but S3 often expects public-read for assets. 
      // It's safer to configure the bucket itself as public for the designated paths.
      // ACL: 'public-read', 
    });

    // URL expires in 15 minutes
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 900 });
    const publicUrl = this.getPublicUrl(fileName);

    return { uploadUrl, publicUrl };
  }

  async uploadFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await this.client.send(command);
    return this.getPublicUrl(fileName);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // We need to extract the Key (fileName) from the public URL
      const publicBase = this.publicUrlBase || `https://${this.bucket}.s3.${process.env.S3_REGION}.amazonaws.com`;
      let key = fileUrl;
      
      if (fileUrl.startsWith(publicBase)) {
        key = fileUrl.substring(publicBase.length);
      }
      
      if (key.startsWith('/')) {
        key = key.substring(1);
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Failed to delete file from S3:', error);
    }
  }
}
