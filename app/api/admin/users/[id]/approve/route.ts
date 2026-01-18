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
    // Find the user
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'pending') {
      return NextResponse.json({ error: 'User is not pending approval' }, { status: 400 });
    }

    // Approve the user
    await db
      .update(users)
      .set({
        role: 'user',
        approvedBy: adminUser.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
