import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db, users } from '@/lib/db';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
    });

    return NextResponse.json({
      users: allUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        approvedAt: user.approvedAt?.toISOString() || null,
        approvedBy: user.approvedBy,
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
