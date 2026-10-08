import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const modelState = sqliteTable("model_state", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
});

/**
 * Define your database schema here, then apply it with `bun run db:push`
 * (from packages/web). Re-export any generated schema from this file
 * (e.g. Better Auth's auth-schema.ts) so drizzle generates complete migrations.
 * Table patterns and conventions: skills/app/references/api.md
 */
