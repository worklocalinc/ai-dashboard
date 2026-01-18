import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, arenaSessions } from '@/lib/db';
import { chatCompletion } from '@/lib/litellm';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role === 'pending') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { models, prompt, systemPrompt } = body;

    if (!models || !Array.isArray(models) || models.length !== 2) {
      return NextResponse.json({ error: 'Two models are required' }, { status: 400 });
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Create arena session
    const sessionId = nanoid();

    // Build messages
    const messages: { role: string; content: string }[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    // Run both completions in parallel
    const results = await Promise.allSettled(
      models.map(async (model: string) => {
        const startTime = Date.now();
        try {
          const response = await chatCompletion(model, messages, {
            maxTokens: 2048,
            temperature: 0.7,
          });
          const latencyMs = Date.now() - startTime;

          return {
            model,
            content: response.choices[0]?.message?.content || '',
            latencyMs,
          };
        } catch (error) {
          const latencyMs = Date.now() - startTime;
          return {
            model,
            error: error instanceof Error ? error.message : 'Request failed',
            latencyMs,
          };
        }
      })
    );

    // Process results
    const responses: Record<string, { content?: string; error?: string; latencyMs?: number }> = {};

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { model, content, error, latencyMs } = result.value;
        responses[model] = { content, error, latencyMs };
      } else {
        // This shouldn't happen since we catch errors above, but just in case
        const model = models[results.indexOf(result)];
        responses[model] = { error: 'Request failed' };
      }
    }

    // Save session to database
    await db.insert(arenaSessions).values({
      id: sessionId,
      userId: session.user.id,
      prompt,
      systemPrompt: systemPrompt || null,
      models,
      responses,
    });

    return NextResponse.json({
      sessionId,
      responses,
    });
  } catch (error) {
    console.error('Arena comparison error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();

  if (!session || session.user.role === 'pending') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's arena history
    const sessions = await db.query.arenaSessions.findMany({
      where: (arenaSessions, { eq }) => eq(arenaSessions.userId, session.user.id),
      orderBy: (arenaSessions, { desc }) => [desc(arenaSessions.createdAt)],
      limit: 50,
    });

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        prompt: s.prompt,
        models: s.models,
        winner: s.winner,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching arena history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
