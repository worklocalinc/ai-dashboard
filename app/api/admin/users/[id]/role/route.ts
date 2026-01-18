import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let adminUser;
  try {
    adminUser = await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { role } = body;

    if (!role || !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Find the user
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent removing your own admin status
    if (user.id === adminUser.id && role !== 'admin') {
      return NextResponse.json({ error: 'Cannot remove your own admin status' }, { status: 400 });
    }

    // Update the role
    await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error changing role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
