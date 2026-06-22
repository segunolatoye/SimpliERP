import { StorageProvider } from './types';
import { LocalStorageProvider } from './providers/local';
import { S3StorageProvider } from './providers/s3';

// Determine which provider to use based on env variables
// Defaults to local if not explicitly configured to avoid breaking dev setup
const providerType = process.env.STORAGE_PROVIDER?.toLowerCase() || 'local';

let storageService: StorageProvider;

if (providerType === 's3' || providerType === 'r2') {
  if (!process.env.S3_BUCKET_NAME || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
    console.warn('⚠️ S3 storage is selected but credentials are not fully configured. Expect failures.');
  }
  storageService = new S3StorageProvider();
} else {
  // Local storage fallback for development
  storageService = new LocalStorageProvider();
}

export { storageService };
