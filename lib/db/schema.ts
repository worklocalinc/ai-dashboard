import { pgTable, text, timestamp, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  role: text('role').notNull().default('pending'), // pending | user | admin
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_role_idx').on(table.role),
]);

export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
  usageLogs: many(usageLogs),
  arenaSessions: many(arenaSessions),
}));

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(),
  keyPrefix: text('key_prefix').notNull(), // "sk-ai-abc..." (first 12 chars for display)
  permissions: jsonb('permissions').$type<{ models?: string[] }>(),
  rateLimit: integer('rate_limit'), // Requests per minute
  monthlyBudget: integer('monthly_budget'), // In cents
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
}, (table) => [
  index('api_keys_user_id_idx').on(table.userId),
  index('api_keys_key_hash_idx').on(table.keyHash),
]);

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  usageLogs: many(usageLogs),
}));

export const usageLogs = pgTable('usage_logs', {
  id: text('id').primaryKey(),
  apiKeyId: text('api_key_id').references(() => apiKeys.id, { onDelete: 'set null' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  model: text('model').notNull(),
  provider: text('provider').notNull(),
  inputTokens: integer('input_tokens').default(0),
  outputTokens: integer('output_tokens').default(0),
  totalTokens: integer('total_tokens').default(0),
  cost: integer('cost').default(0), // In microdollars (1/1000000 of a dollar)
  latencyMs: integer('latency_ms'),
  success: boolean('success').default(true).notNull(),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('usage_logs_user_id_idx').on(table.userId),
  index('usage_logs_api_key_id_idx').on(table.apiKeyId),
  index('usage_logs_model_idx').on(table.model),
  index('usage_logs_created_at_idx').on(table.createdAt),
]);

export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [usageLogs.apiKeyId],
    references: [apiKeys.id],
  }),
  user: one(users, {
    fields: [usageLogs.userId],
    references: [users.id],
  }),
}));

export const arenaSessions = pgTable('arena_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  systemPrompt: text('system_prompt'),
  models: jsonb('models').notNull().$type<string[]>(),
  responses: jsonb('responses').$type<Record<string, { content?: string; error?: string; latencyMs?: number }>>(),
  winner: text('winner'),
  votedAt: timestamp('voted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('arena_sessions_user_id_idx').on(table.userId),
]);

export const arenaSessionsRelations = relations(arenaSessions, ({ one }) => ({
  user: one(users, {
    fields: [arenaSessions.userId],
    references: [users.id],
  }),
}));

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;
export type ArenaSession = typeof arenaSessions.$inferSelect;
export type NewArenaSession = typeof arenaSessions.$inferInsert;
