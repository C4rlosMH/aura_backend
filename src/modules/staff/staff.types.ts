import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { staff, auraHandoverLogs } from './staff.model';

export type Staff = InferSelectModel<typeof staff>;
export type NewStaff = InferInsertModel<typeof staff>;

export type AuraHandoverLog = InferSelectModel<typeof auraHandoverLogs>;
export type NewAuraHandoverLog = InferInsertModel<typeof auraHandoverLogs>;

export interface StaffPaginationParams {
  skip: number;
  take?: number;
  search?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}
