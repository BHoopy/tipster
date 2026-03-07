import { NextResponse } from 'next/server';
import { initializeTransaction } from '@/lib/paystack';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        const { userId, email } = await request.json();

        if (!userId || !email) {
            return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
        }

        // Get VIP price from settings, default to 50
        const settingsDoc = await adminDb.collection('settings').doc('general').get();
        const vipPrice = settingsDoc.exists ? (settingsDoc.data()?.vipPrice || 50) : 50;

        const transaction = await initializeTransaction(email, vipPrice, {
            userId,
            paymentType: 'vip_subscription'
        });

        return NextResponse.json(transaction);
    } catch (error: any) {
        console.error('Paystack initialization error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
