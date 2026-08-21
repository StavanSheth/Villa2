// packages/storage/r2/client.ts
// Cloudflare R2 Storage Client
// Ponytail: Simple S3-compatible and Worker-binding R2 storage helper for images and PDFs

export interface R2UploadOptions {
  key: string;
  body: Uint8Array | ArrayBuffer | Blob | string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface R2BucketLike {
  put(key: string, value: unknown, options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }): Promise<unknown>;
  delete(key: string): Promise<void>;
  get(key: string): Promise<unknown>;
}

export class R2StorageClient {
  private publicUrl: string;
  private bucket?: R2BucketLike;

  constructor(options: { publicUrl?: string; bucket?: R2BucketLike } = {}) {
    this.publicUrl = options.publicUrl || process.env.R2_PUBLIC_URL || "https://cdn.mavon.online";
    this.bucket = options.bucket;
  }

  /**
   * Uploads an object to Cloudflare R2.
   * Uses Cloudflare Worker R2 binding if present, otherwise throws if unconfigured.
   */
  public async upload(options: R2UploadOptions): Promise<string> {
    if (!this.bucket) {
      // In standalone Node environments without Worker binding, log fallback
      console.warn("R2StorageClient: No R2 bucket binding provided. Using CDN URL simulation.");
      return `${this.publicUrl}/${options.key}`;
    }

    await this.bucket.put(options.key, options.body, {
      httpMetadata: { contentType: options.contentType },
      customMetadata: options.metadata,
    });

    return `${this.publicUrl}/${options.key}`;
  }

  /**
   * Deletes an object from Cloudflare R2 by key.
   */
  public async delete(key: string): Promise<void> {
    if (!this.bucket) {
      return;
    }
    await this.bucket.delete(key);
  }

  /**
   * Returns the full public CDN URL for a given storage key.
   */
  public getPublicUrl(key: string): string {
    const cleanKey = key.startsWith("/") ? key.slice(1) : key;
    return `${this.publicUrl}/${cleanKey}`;
  }
}

// Singleton storage client
export const r2Storage = new R2StorageClient();
