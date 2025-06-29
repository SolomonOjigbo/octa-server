import { z } from "zod";
import { b2bConnectionStatuses } from "./types/b2bConnection.dto";


export const b2bConnectionSchema = z.object({
  tenantAId: z.string().cuid(),
  tenantBId: z.string().cuid(),
  status: z.enum(b2bConnectionStatuses).default("pending"),
  settings: z.record(z.unknown()).optional(),
});

export const createB2BConnectionSchema = z.object({
  tenantAId: z.string().cuid(),
  tenantBId: z.string().cuid(),
  status: z.enum(b2bConnectionStatuses).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const updateB2BConnectionSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(b2bConnectionStatuses).optional(),
  settings: z.record(z.unknown()).optional(),
});