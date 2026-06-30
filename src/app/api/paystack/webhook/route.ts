import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;

export async function POST(request: Request) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-paystack-signature');

        if (!WEBHOOK_SECRET || !signature) {
            return NextResponse.json({ error: 'Missing webhook secret or signature' }, { status: 400 });
        }

        const expectedSignature = crypto
            .createHmac('sha512', WEBHOOK_SECRET)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(body);

        if (event.event === 'charge.success') {
            const { metadata, reference } = event.data;
            const userId = metadata?.userId;

            if (userId) {
                await getAdminDb().collection('users').doc(userId).update({
                    is_vip: true,
                    vip_purchased_at: new Date(),
                    last_transaction_ref: reference,
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Paystack webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
