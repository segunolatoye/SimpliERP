export interface StorageProvider {
  /**
   * Generates a pre-signed URL for direct-to-cloud uploads.
   * @param fileName The desired name/path of the file in the bucket
   * @param contentType The MIME type of the file
   * @returns An object containing the upload URL and the final public URL where the file will reside
   */
  getSignedUploadUrl(fileName: string, contentType: string): Promise<{ uploadUrl: string; publicUrl: string }>;

  /**
   * Uploads a file directly from the server buffer (useful for backend-generated files like PDFs).
   * @param fileName The desired name/path of the file in the bucket
   * @param fileBuffer The binary data of the file
   * @param contentType The MIME type of the file
   * @returns The public URL of the uploaded file
   */
  uploadFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string>;

  /**
   * Deletes a file from the storage bucket.
   * @param fileUrl The full URL or key of the file to delete
   */
  deleteFile(fileUrl: string): Promise<void>;
}
