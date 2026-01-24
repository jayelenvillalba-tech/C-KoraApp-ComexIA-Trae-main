import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema-sqlite.ts",
  out: "./database/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./comexia_v2.db"
  },
});
