import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, usageLogs } from '@/lib/db';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { format, eachDayOfInterval, parseISO } from 'date-fns';

export async function GET(request: Request) {
  const session = await auth();

  if (!session || session.user.role === 'pending') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('start');
    const endDate = url.searchParams.get('end');

    const start = startDate ? parseISO(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? parseISO(endDate) : new Date();

    // Fetch usage logs for the user
    const logs = await db.query.usageLogs.findMany({
      where: and(
        eq(usageLogs.userId, session.user.id),
        gte(usageLogs.createdAt, start),
        lte(usageLogs.createdAt, end)
      ),
      orderBy: [desc(usageLogs.createdAt)],
    });

    // Calculate totals
    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0) / 1000000, 0); // Convert from microdollars
    const totalRequests = logs.length;
    const totalTokens = logs.reduce((sum, log) => sum + (log.totalTokens || 0), 0);

    // Generate daily data
    const days = eachDayOfInterval({ start, end });
    const dailyMap = new Map<string, { cost: number; requests: number; tokens: number }>();

    for (const day of days) {
      const dateKey = format(day, 'MMM d');
      dailyMap.set(dateKey, { cost: 0, requests: 0, tokens: 0 });
    }

    for (const log of logs) {
      const dateKey = format(log.createdAt, 'MMM d');
      const existing = dailyMap.get(dateKey) || { cost: 0, requests: 0, tokens: 0 };
      dailyMap.set(dateKey, {
        cost: existing.cost + (log.cost || 0) / 1000000,
        requests: existing.requests + 1,
        tokens: existing.tokens + (log.totalTokens || 0),
      });
    }

    const dailyData = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Calculate model breakdown
    const modelMap = new Map<string, { cost: number; requests: number }>();

    for (const log of logs) {
      const existing = modelMap.get(log.model) || { cost: 0, requests: 0 };
      modelMap.set(log.model, {
        cost: existing.cost + (log.cost || 0) / 1000000,
        requests: existing.requests + 1,
      });
    }

    const modelBreakdown = Array.from(modelMap.entries())
      .map(([model, data]) => ({
        model,
        cost: data.cost,
        requests: data.requests,
        percentage: totalCost > 0 ? (data.cost / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost);

    // Recent requests (last 50)
    const recentRequests = logs.slice(0, 50).map((log) => ({
      id: log.id,
      model: log.model,
      inputTokens: log.inputTokens || 0,
      outputTokens: log.outputTokens || 0,
      cost: (log.cost || 0) / 1000000,
      success: log.success,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      totalCost,
      totalRequests,
      totalTokens,
      dailyData,
      modelBreakdown,
      recentRequests,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
