import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
        return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    try {
        const data = await verifyTransaction(reference);

        if (data.status === 'success') {
            const { userId, email } = data.metadata;
            const amount = data.amount ? data.amount / 100 : 0;

            if (userId) {
                await getAdminDb().collection('users').doc(userId).update({
                    is_vip: true,
                    vip_purchased_at: new Date(),
                    last_transaction_ref: reference
                });

                await getAdminDb().collection('transactions').add({
                    userId,
                    email: email || '',
                    amount,
                    reference,
                    status: 'success',
                    createdAt: new Date()
                });

                return NextResponse.json({ success: true, message: 'VIP status updated' });
            }
        }

        return NextResponse.json({ success: false, message: 'Transaction not successful' });
    } catch (error: any) {
        console.error('Paystack verification error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
