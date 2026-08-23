import { NextResponse } from 'next/server';
import { createPresignedUploadUrl } from '@villa-platform/storage/signed-urls';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const filename = file.name;
    const contentType = file.type;

    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `bookings/id-proofs/${Date.now()}-${sanitizedFilename}`;
    
    // Check if R2 credentials are real or placeholders
    const accountId = process.env.R2_ACCOUNT_ID || "demo-account-id";
    if (accountId === "..." || accountId === "demo-account-id") {
      console.warn("Using local fallback for upload because R2_ACCOUNT_ID is placeholder.");
      
      const fs = require('fs');
      const path = require('path');
      
      // Save locally to public directory so it can be served
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const localFilePath = path.join(uploadDir, sanitizedFilename);
      const arrayBuffer = await file.arrayBuffer();
      fs.writeFileSync(localFilePath, Buffer.from(arrayBuffer));
      
      // Return the local URL
      const mockPublicUrl = `/uploads/${sanitizedFilename}`;
      return NextResponse.json({ publicUrl: mockPublicUrl, success: true });
    }

    // Get presigned URL
    const { uploadUrl, publicUrl } = await createPresignedUploadUrl({
      key,
      contentType,
    });

    // Upload directly from server to bypass CORS issues on localhost:3003
    const arrayBuffer = await file.arrayBuffer();
    const r2Res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: arrayBuffer,
    });

    if (!r2Res.ok) {
      throw new Error(`Failed to upload to R2: ${r2Res.statusText}`);
    }

    return NextResponse.json({ publicUrl, success: true });
  } catch (error: any) {
    console.error('Error in direct upload:', error);
    return NextResponse.json({ error: error.message || error.toString() || 'Failed to upload file directly' }, { status: 500 });
  }
}
