import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { sites, departments, areas } from './organization.model';

export type Site = InferSelectModel<typeof sites>;
export type NewSite = InferInsertModel<typeof sites>;

export type Department = InferSelectModel<typeof departments>;
export type NewDepartment = InferInsertModel<typeof departments>;

export type Area = InferSelectModel<typeof areas>;
export type NewArea = InferInsertModel<typeof areas>;

export interface AuthUser {
  id: number;
  rol: string;
  siteId?: number | null;
  sites?: { id: number }[];
}

export interface PaginationParams {
  skip: number;
  take: number;
  sortBy?: string;
  order?: "asc" | "desc";
}
