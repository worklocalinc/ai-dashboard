import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db, users, apiKeys, usageLogs } from '@/lib/db';
import { eq, count, sum } from 'drizzle-orm';

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user counts
    const userCounts = await db
      .select({
        role: users.role,
        count: count(),
      })
      .from(users)
      .groupBy(users.role);

    const totalUsers = userCounts.reduce((sum, r) => sum + r.count, 0);
    const pendingUsers = userCounts.find(r => r.role === 'pending')?.count || 0;
    const activeUsers = userCounts.filter(r => r.role !== 'pending').reduce((sum, r) => sum + r.count, 0);

    // Get API key count
    const [keyCount] = await db
      .select({ count: count() })
      .from(apiKeys)
      .where(eq(apiKeys.isActive, true));

    // Get usage stats
    const [usageStats] = await db
      .select({
        count: count(),
        totalCost: sum(usageLogs.cost),
      })
      .from(usageLogs);

    return NextResponse.json({
      totalUsers,
      pendingUsers,
      activeUsers,
      totalApiKeys: keyCount?.count || 0,
      totalRequests: usageStats?.count || 0,
      totalCost: (Number(usageStats?.totalCost) || 0) / 1000000, // Convert from microdollars
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
