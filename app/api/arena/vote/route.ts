import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, arenaSessions } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role === 'pending') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { sessionId, winner } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (!winner || typeof winner !== 'string') {
      return NextResponse.json({ error: 'Winner is required' }, { status: 400 });
    }

    // Verify session exists and belongs to user
    const arenaSession = await db.query.arenaSessions.findFirst({
      where: and(
        eq(arenaSessions.id, sessionId),
        eq(arenaSessions.userId, session.user.id)
      ),
    });

    if (!arenaSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify winner is one of the models
    const models = arenaSession.models as string[];
    if (!models.includes(winner)) {
      return NextResponse.json({ error: 'Invalid winner' }, { status: 400 });
    }

    // Update session with winner
    await db
      .update(arenaSessions)
      .set({
        winner,
        votedAt: new Date(),
      })
      .where(eq(arenaSessions.id, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
