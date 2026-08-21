// packages/database/prisma.config.ts
// Prisma v7 configuration — connection strings moved here from schema.prisma
// See: https://pris.ly/d/config-datasource

import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),

  migrate: {
    async url() {
      const url = process.env.DATABASE_URL;
      if (!url) throw new Error('DATABASE_URL environment variable is required for migrations');
      return url;
    },
    async shadowUrl() {
      return process.env.DIRECT_URL || process.env.DATABASE_URL || (() => { throw new Error('DIRECT_URL or DATABASE_URL required for shadow database'); })();
    },
  },
});
