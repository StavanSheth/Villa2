import { NextResponse } from 'next/server';
import { createPresignedUploadUrl } from '@villa-platform/storage/signed-urls';

export async function POST(req: Request) {
  try {
    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and contentType are required' }, { status: 400 });
    }

    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `bookings/id-proofs/${Date.now()}-${sanitizedFilename}`;
    
    const signedUrlResponse = await createPresignedUploadUrl({
      key,
      contentType,
    });

    return NextResponse.json(signedUrlResponse);
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
