import { z } from "zod";
import { 
  b2bConnectionStatuses, 
  b2bConnectionTypes 
} from "./types/b2bConnection.dto";



export const connectionActionSchema = z.object({
  reason: z.string().optional(),
});
 

export const createB2BConnectionSchema = z.object({
  // tenantAId is set by your controller from auth context
  tenantBId:    z.string().cuid(),
  type:         z.enum(b2bConnectionTypes),         // enforce B2BConnectionType
  settings:     z.record(z.unknown()).optional(),
  status:       z.enum(b2bConnectionStatuses).default('pending'),
  isActive:     z.boolean().default(true),          // if you add activation
});

export const updateB2BConnectionSchema = z.object({
  id:         z.string().cuid(),
  type:       z.enum(b2bConnectionTypes).optional(),
  settings:   z.record(z.unknown()).optional(),
  status:     z.enum(b2bConnectionStatuses).optional(),
  isActive:   z.boolean().optional(),
});


export const approveB2BConnectionSchema = z.object({
  approvedBy: z.string().cuid().optional(), // Will be set from auth context
  notes: z.string().max(500).optional()
});

export const rejectB2BConnectionSchema = z.object({
  rejectedBy: z.string().cuid().optional(), // Will be set from auth context
  notes: z.string().max(500).optional()
});

export const revokeB2BConnectionSchema = z.object({
  revokedBy: z.string().cuid().optional(), // Will be set from auth context
  notes: z.string().max(500).optional()
});

export const listB2BConnectionsSchema = z.object({
  tenantId: z.string().cuid(),
  status: z.enum(b2bConnectionStatuses).optional(),
  type: z.enum(b2bConnectionTypes).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

// validation for the new status check endpoint.
export const checkConnectionStatusSchema = z.object({
  partnerTenantId: z.string().cuid({ message: "Invalid partner tenant ID." })
});