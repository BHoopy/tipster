import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  uid: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, uid } = schema.parse(body);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await getAdminDb().collection('verification_otps').doc(uid).set({
      email,
      otp,
      expiresAt,
      createdAt: new Date(),
    });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Tipster <noreply@findaroom.app>',
        to: email,
        subject: 'Your verification code',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
            <h2>Verify your email</h2>
            <p>Use this code to complete your registration:</p>
            <div style="font-size: 2rem; font-weight: 700; letter-spacing: 0.25em; text-align: center; padding: 1rem; background: #f5f5f5; border-radius: 8px; margin: 1.5rem 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 0.875rem;">This code expires in 10 minutes.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend send error:', err);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('send-otp error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
