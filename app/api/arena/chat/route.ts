import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { chatCompletion } from '@/lib/litellm';

export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role === 'pending') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { model, messages } = body;

    if (!model || typeof model !== 'string') {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const startTime = Date.now();
    const response = await chatCompletion(model, messages, {
      maxTokens: 2048,
      temperature: 0.7,
    });
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      content: response.choices[0]?.message?.content || '',
      usage: response.usage,
      latencyMs,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Request failed' },
      { status: 500 }
    );
  }
}
