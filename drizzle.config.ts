import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: [
    "./src/modules/organization/organization.model.ts",
    "./src/modules/auth/auth.model.ts",
    "./src/modules/staff/staff.model.ts",
    "./src/modules/inventory/inventory.model.ts",
    "./src/modules/audit/audit.model.ts",
    "./src/modules/maintenance/maintenance.model.ts",
    "./src/core/security/license.model.ts",
    "./src/modules/inventory/invoices.model.ts",
  ],
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
