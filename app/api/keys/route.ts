import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, apiKeys } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';
import { generateApiKey as litellmGenerateKey } from '@/lib/litellm';

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function GET() {
  const session = await auth();

  if (!session || session.user.role === 'pending') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const keys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, session.user.id),
      orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)],
    });

    return NextResponse.json({
      keys: keys.map(key => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt?.toISOString() || null,
        createdAt: key.createdAt.toISOString(),
        expiresAt: key.expiresAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role === 'pending') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 });
    }

    // Generate key via LiteLLM
    let fullKey: string;
    try {
      const litellmResult = await litellmGenerateKey(session.user.id, name, {
        duration: '365d',
      });
      fullKey = litellmResult.key;
    } catch (error) {
      // Fallback to local key generation if LiteLLM fails
      console.error('LiteLLM key generation failed, using local:', error);
      fullKey = `sk-ai-${nanoid(32)}`;
    }

    const keyPrefix = fullKey.substring(0, 12);
    const keyHash = hashKey(fullKey);
    const keyId = nanoid();

    // Store key in database
    await db.insert(apiKeys).values({
      id: keyId,
      userId: session.user.id,
      name,
      keyHash,
      keyPrefix,
      isActive: true,
    });

    return NextResponse.json({
      key: fullKey,
      id: keyId,
      name,
      keyPrefix,
    });
  } catch (error) {
    console.error('Error creating key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
