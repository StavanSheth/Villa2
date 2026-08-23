import { AwsClient } from 'aws4fetch';

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

  const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 credentials");
  }

  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  
  const aws = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: 's3',
    region: 'auto',
  });

  const rawUrl = new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${req.key}`);

  // Create a signed request using aws4fetch
  const signedRequest = await aws.sign(rawUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': req.contentType
    },
    aws: {
      signQuery: true,
      // @ts-ignore
      expires: ttl
    }
  });

  const uploadUrl = signedRequest.url;
  const publicUrl = `${publicUrlBase}/${req.key}`;

  return {
    uploadUrl,
    publicUrl,
    key: req.key,
    expiresAt,
  };
}
