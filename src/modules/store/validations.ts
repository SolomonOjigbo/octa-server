import { z } from "zod";

const storeTypeEnum = z.enum(["wholesale", "retail", "clinic", "warehouse"]);
const storeStatusEnum = z.enum(["active", "inactive", "under_maintenance", "closed"]);

const openingHourSchema = z.object({
  day: z.string(),
  open: z.string().regex(/^\d{2}:\d{2}$/),    // "HH:MM"
  close: z.string().regex(/^\d{2}:\d{2}$/),
});

export const createStoreSchema = z.object({
  tenantId: z.string().cuid(),
  name: z.string().min(2),
  code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  type: storeTypeEnum.optional(),
  status: storeStatusEnum.optional(),
  isMain: z.boolean().optional(),
  managerId: z.string().cuid().optional(),
  openingHours: z.array(openingHourSchema).optional(),
  branding: z.any().optional(),
  settings: z.any().optional(),
});

export const updateStoreSchema = createStoreSchema.partial();
