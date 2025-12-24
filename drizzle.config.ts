import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema-sqlite.ts",
  out: "./database/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || process.env.SQLITE_DB_PATH || "./comexia.db",
    authToken: process.env.TURSO_AUTH_TOKEN
  },
});
