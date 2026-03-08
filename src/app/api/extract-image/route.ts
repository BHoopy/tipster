import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Feature coming soon' });
  } catch (error: any) {
    console.error('Error processing prediction:', error);
    return NextResponse.json({ error: error.message || 'Failed to process text' }, { status: 500 });
  }
}
