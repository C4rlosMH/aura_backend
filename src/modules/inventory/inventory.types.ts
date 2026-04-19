import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { devices, deviceType, deviceStatus, operatingSystem, auraVLANs } from './inventory.model';

export type Device = InferSelectModel<typeof devices>;
export type NewDevice = InferInsertModel<typeof devices>;

export type DeviceType = InferSelectModel<typeof deviceType>;
export type DeviceStatus = InferSelectModel<typeof deviceStatus>;
export type OperatingSystem = InferSelectModel<typeof operatingSystem>;

export type AuraVLAN = InferSelectModel<typeof auraVLANs>;
export type NewAuraVLAN = InferInsertModel<typeof auraVLANs>;

export interface InventoryPaginationParams {
  skip: number;
  take?: number;
  search?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  filter?: string;
  typeIds?: number[];
}
