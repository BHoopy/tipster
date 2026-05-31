import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        if (!adminMessaging) {
            return NextResponse.json(
                { error: 'Firebase Admin not initialized' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { title, body: messageBody, type, data } = body;

        if (!title || !messageBody) {
            return NextResponse.json(
                { error: 'Title and body are required' },
                { status: 400 }
            );
        }

        // Get all users who have FCM tokens stored
        const tokensSnapshot = await adminDb.collection('fcm_tokens').get();
        
        if (tokensSnapshot.empty) {
            return NextResponse.json(
                { message: 'No notification tokens found', sent: 0 },
                { status: 200 }
            );
        }

        const tokens = tokensSnapshot.docs.map(doc => doc.id);
        
        // Split tokens into chunks of 500 (Firebase limit)
        const chunks = [];
        for (let i = 0; i < tokens.length; i += 500) {
            chunks.push(tokens.slice(i, i + 500));
        }

        let successCount = 0;
        let failureCount = 0;

        for (const chunk of chunks) {
            try {
                const response = await adminMessaging.sendEachForMulticast({
                    tokens: chunk,
                    notification: {
                        title,
                        body: messageBody,
                    },
                    data: {
                        type: type || 'new_tip',
                        ...data
                    },
                    webpush: {
                        notification: {
                            icon: '/logo.png',
                            badge: '/logo.png',
                            tag: 'tipster-notification',
                            renotify: true,
                        },
                        fcmOptions: {
                            link: '/'
                        }
                    }
                });

                successCount += response.successCount;
                failureCount += response.failureCount;

                // Clean up invalid tokens
                if (response.failureCount > 0) {
                    const invalidTokens: string[] = [];
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            invalidTokens.push(chunk[idx]);
                        }
                    });
                    
                    // Remove invalid tokens
                    const invalidTokenPromises = invalidTokens.map(token => 
                        adminDb.collection('fcm_tokens').doc(token).delete()
                    );
                    await Promise.all(invalidTokenPromises);
                }
            } catch (error) {
                console.error('Error sending chunk:', error);
                failureCount += chunk.length;
            }
        }

        return NextResponse.json({
            success: true,
            sent: successCount,
            failed: failureCount,
            total: tokens.length
        });

    } catch (error: any) {
        console.error('Error sending notifications:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send notifications' },
            { status: 500 }
        );
    }
}
