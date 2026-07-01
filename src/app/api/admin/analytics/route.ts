import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await getAdminAuth().verifyIdToken(token);

    const userDoc = await getAdminDb().collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userEmail = userDoc.data()?.email || '';
    const isSuperAdmin = userEmail === 'wormz4490@gmail.com';

    const [txSnap, usersSnap, freeSnap, vipSnap] = await Promise.all([
      getAdminDb().collection('transactions').orderBy('createdAt', 'desc').get(),
      getAdminDb().collection('users').get(),
      getAdminDb().collection('free_tips').get(),
      getAdminDb().collection('vip_tickets').get(),
    ]);

    const allTransactions = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const users = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    const freeTips = freeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const vipTickets = vipSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const transactions = isSuperAdmin ? allTransactions : [];

    return NextResponse.json({
      transactions,
      users,
      freeTips,
      vipTickets,
      isSuperAdmin,
      currentUid: decoded.uid,
      currentEmail: userEmail,
    });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
