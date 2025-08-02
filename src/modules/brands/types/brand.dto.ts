// src/modules/brand/types/brand.dto.ts
import { z } from "zod";

export const CreateBrandSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateBrandSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export type CreateBrandDto = z.infer<typeof CreateBrandSchema>;
export type UpdateBrandDto = z.infer<typeof UpdateBrandSchema>;

export interface BrandResponseDto {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}