import { container } from './container';

// 1. Define Interfaces for replaceable implementations
export interface FileStorage {
  getUploadUrl(key: string, mime: string): Promise<string>;
  getDownloadUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

export interface EmailSender {
  send(to: string, subject: string, html: string): Promise<void>;
}

export interface QueueService {
  enqueue(jobName: string, data: any): Promise<void>;
}

// 2. We can export tokens to use for resolving dependencies
export const TOKENS = {
  FileStorage: Symbol.for('FileStorage'),
  EmailSender: Symbol.for('EmailSender'),
  QueueService: Symbol.for('QueueService'),
};

// Re-export container for manual resolution
export { container };
