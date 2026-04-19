import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

import * as orgSchema from '../modules/organization/organization.model';
import * as authSchema from '../modules/auth/auth.model';
import * as staffSchema from '../modules/staff/staff.model';
import * as inventorySchema from '../modules/inventory/inventory.model';
import * as auditSchema from '../modules/audit/audit.model';
import * as maintSchema from '../modules/maintenance/maintenance.model';
import * as licenseSchema from './security/license.model';

const poolConnection = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const db = drizzle(poolConnection, {
  schema: {
    ...orgSchema,
    ...authSchema,
    ...staffSchema,
    ...inventorySchema,
    ...auditSchema,
    ...maintSchema,
    ...licenseSchema
  },
  mode: 'default'
});
