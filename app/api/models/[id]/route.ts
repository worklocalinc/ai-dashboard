import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role === 'pending') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const modelId = decodeURIComponent(id);

  // Fetch all models and find the specific one
  const modelsRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/models`, {
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
  });

  if (!modelsRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }

  const { models } = await modelsRes.json();
  const model = models.find((m: { id: string }) => m.id === modelId);

  if (!model) {
    return NextResponse.json({ error: 'Model not found' }, { status: 404 });
  }

  return NextResponse.json({ model });
}
