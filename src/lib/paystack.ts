const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function initializeTransaction(email: string, amount: number, metadata: any = {}) {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            amount: amount * 100, // Paystack expects amount in pesewas/kobo
            metadata,
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/paystack/callback`,
        }),
    });

    const data = await response.json();
    if (!data.status) {
        throw new Error(data.message || 'Failed to initialize Paystack transaction');
    }

    return data.data;
}

export async function verifyTransaction(reference: string) {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
    });

    const data = await response.json();
    return data.data;
}
