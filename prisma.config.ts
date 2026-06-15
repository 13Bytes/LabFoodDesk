import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const databaseUrl = env("DATABASE_URL");
const resolvedDatabaseUrl = databaseUrl.startsWith("file:./")
  ? `file:./prisma/${databaseUrl.slice("file:./".length)}`
  : databaseUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: resolvedDatabaseUrl,
  },
});
