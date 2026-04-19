import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { hotels, departments, areas } from './organization.model';

export type Hotel = InferSelectModel<typeof hotels>;
export type NewHotel = InferInsertModel<typeof hotels>;

export type Department = InferSelectModel<typeof departments>;
export type NewDepartment = InferInsertModel<typeof departments>;

export type Area = InferSelectModel<typeof areas>;
export type NewArea = InferInsertModel<typeof areas>;

export interface AuthUser {
  id: number;
  rol: string;
  hotelId?: number | null;
  hotels?: { id: number }[];
}

export interface PaginationParams {
  skip: number;
  take: number;
  sortBy?: string;
  order?: "asc" | "desc";
}
