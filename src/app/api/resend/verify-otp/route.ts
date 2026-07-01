import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { z } from 'zod';

const schema = z.object({
  uid: z.string().min(1),
  otp: z.string().length(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, otp } = schema.parse(body);

    const docRef = getAdminDb().collection('verification_otps').doc(uid);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'No OTP found. Request a new one.' }, { status: 400 });
    }

    const data = doc.data()!;

    if (Date.now() > data.expiresAt) {
      await docRef.delete();
      return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 400 });
    }

    if (data.otp !== otp) {
      return NextResponse.json({ error: 'Invalid code. Try again.' }, { status: 400 });
    }

    await getAdminAuth().updateUser(uid, { emailVerified: true });
    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('verify-otp error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
