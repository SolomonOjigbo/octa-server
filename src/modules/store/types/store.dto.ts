export type StoreType = "wholesale" | "retail" | "clinic" | "warehouse";
export type StoreStatus = "active" | "inactive" | "under_maintenance" | "closed";

export interface OpeningHour {
  day: string;      // "Mon", "Tue", etc.
  open: string;     // "08:00"
  close: string;    // "18:00"
}

export interface CreateStoreDto {
  tenantId: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  type?: StoreType;
  status?: StoreStatus;
  isMain?: boolean;
  managerId?: string;
  openingHours?: OpeningHour[];
  branding?: any;
  settings?: any;
}

export interface UpdateStoreDto extends Partial<CreateStoreDto> {}


export interface Store {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  code?: string;
  type?: StoreType;
  managerId?: string;  // User ID of the store manager
  openingHours?: OpeningHour[];
  status?: StoreStatus;
  isMain?: boolean;
  branding?: any;  // JSON or object
  settings?: any;  // JSON or object
  createdAt: Date;
  updatedAt: Date;
}
