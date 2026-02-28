import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config is automatically picked up from CLOUDINARY_URL env var,
// keeping things simple and secure without exposing explicit keys in the config step.

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert the file to a buffer for Cloudinary's upload stream
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary using a Promise to wrap the upload_stream callback
        const uploadResult: any = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'mxtips/predictions' },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            // end the stream with the file buffer
            uploadStream.end(buffer);
        });

        // Return the response containing the Cloudinary secure URL
        return NextResponse.json({ secure_url: uploadResult.secure_url });
    } catch (error: any) {
        console.error('Error uploading to Cloudinary:', error);
        return NextResponse.json({ error: error.message || 'Failed to upload' }, { status: 500 });
    }
}
