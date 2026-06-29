import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import webpush from 'web-push';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@tipster.app',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, body: messageBody, data } = body;

        if (!title || !messageBody) {
            return NextResponse.json(
                { error: 'Title and body are required' },
                { status: 400 }
            );
        }

        const subsSnapshot = await adminDb.collection('push_subscriptions').get();
        
        if (subsSnapshot.empty) {
            return NextResponse.json(
                { message: 'No push subscriptions found', sent: 0 },
                { status: 200 }
            );
        }

        let successCount = 0;
        let failureCount = 0;
        const invalidIds: string[] = [];

        for (const doc of subsSnapshot.docs) {
            try {
                const subData = doc.data().subscription;
                await webpush.sendNotification({
                    endpoint: subData.endpoint,
                    keys: subData.keys,
                } as webpush.PushSubscription, JSON.stringify({
                    title,
                    body: messageBody,
                    data: { type: 'new_tip', ...data },
                }));
                successCount++;
            } catch (error: any) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    invalidIds.push(doc.id);
                }
                failureCount++;
            }
        }

        if (invalidIds.length > 0) {
            const deletePromises = invalidIds.map(id =>
                adminDb.collection('push_subscriptions').doc(id).delete()
            );
            await Promise.all(deletePromises);
        }

        return NextResponse.json({
            success: true,
            sent: successCount,
            failed: failureCount,
            total: subsSnapshot.size,
            cleaned: invalidIds.length,
        });

    } catch (error: any) {
        console.error('Error sending notifications:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send notifications' },
            { status: 500 }
        );
    }
}
