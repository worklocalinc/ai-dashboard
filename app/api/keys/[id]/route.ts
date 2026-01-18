import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, apiKeys } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role === 'pending') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Find the key and verify ownership
    const key = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.id, id),
        eq(apiKeys.userId, session.user.id)
      ),
    });

    if (!key) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    // Soft delete - mark as inactive
    await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role === 'pending') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const key = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.id, id),
        eq(apiKeys.userId, session.user.id)
      ),
    });

    if (!key) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    return NextResponse.json({
      key: {
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        isActive: key.isActive,
        permissions: key.permissions,
        rateLimit: key.rateLimit,
        monthlyBudget: key.monthlyBudget,
        lastUsedAt: key.lastUsedAt?.toISOString() || null,
        createdAt: key.createdAt.toISOString(),
        expiresAt: key.expiresAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Error fetching key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
