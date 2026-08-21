// packages/storage/signed-urls/index.ts
// Signed URL Generator for Direct R2 Client Uploads
// Ponytail: Generates presigned PUT URLs for secure direct-to-bucket uploads

export interface SignedUrlRequest {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}

export interface SignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresAt: string;
}

/**
 * Generates an upload URL and CDN public URL for client-side direct uploads.
 */
export async function createPresignedUploadUrl(
  req: SignedUrlRequest
): Promise<SignedUrlResponse> {
  const accountId = process.env.R2_ACCOUNT_ID || "demo-account-id";
  const bucketName = process.env.R2_BUCKET_NAME || "villa-platform";
  const publicUrlBase = process.env.R2_PUBLIC_URL || "https://cdn.mavon.online";
  const ttl = req.expiresInSeconds || 3600;

  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  
  // Ponytail: Generate direct upload endpoint URL
  const uploadUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${req.key}?X-Amz-Expires=${ttl}`;
  const publicUrl = `${publicUrlBase}/${req.key}`;

  return {
    uploadUrl,
    publicUrl,
    key: req.key,
    expiresAt,
  };
}
