'use client';

import { useState, useRef } from 'react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { UploadCloud, Loader2, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';

interface ImageUploaderProps {
  name: string;
  defaultValue?: string;
  directory?: string;
  className?: string;
}

export function ImageUploader({ name, defaultValue = '', directory = 'general', className = '' }: ImageUploaderProps) {
  const [url, setUrl] = useState<string>(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // 1. Get presigned URL
      const presignRes = await fetch('/api/storage/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          directory,
        }),
      });

      if (!presignRes.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, publicUrl } = await presignRes.json();

      // 2. Upload file directly to the cloud / local endpoint
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file');
      }

      // 3. Set the resulting public URL
      setUrl(publicUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Something went wrong during upload.');
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = () => {
    setUrl('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input type="hidden" name={name} value={url} />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png, image/jpeg, image/webp, image/svg+xml"
        className="hidden"
      />

      {error && <div className="text-red-400 text-sm font-medium">{error}</div>}

      {url ? (
        <div className="relative group w-32 h-32 rounded-xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
          <Image src={url} alt="Uploaded logo" fill className="object-contain p-2" unoptimized />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="text-white hover:bg-white/20 hover:text-white h-8 w-8 rounded-full"
              disabled={isUploading}
            >
              <UploadCloud className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={removeImage}
              className="text-red-400 hover:bg-red-400/20 hover:text-red-300 h-8 w-8 rounded-full"
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex flex-col items-center justify-center w-full max-w-sm h-32 border-2 border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-indigo-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-medium">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-slate-300 transition-colors">
              <div className="p-3 rounded-full bg-white/5 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors">
                <ImageIcon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">Click to upload logo</span>
            </div>
          )}
        </button>
      )}
    </div>
  );
}
