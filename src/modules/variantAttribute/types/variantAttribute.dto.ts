// src/modules/variantAttribute/types/variantAttribute.dto.ts
import { z } from "zod";

export const VariantAttributeOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

export const CreateVariantAttributeSchema = z.object({
  name: z.string().min(1),
  options: z.array(VariantAttributeOptionSchema).min(1),
  isActive: z.boolean().optional().default(true),
});

export const UpdateVariantAttributeSchema = z.object({
  name: z.string().min(1).optional(),
  options: z.array(VariantAttributeOptionSchema).min(1).optional(),
  isActive: z.boolean().optional(),
});

export type VariantAttributeOptionDto = z.infer<typeof VariantAttributeOptionSchema>;
export type CreateVariantAttributeDto = z.infer<typeof CreateVariantAttributeSchema>;
export type UpdateVariantAttributeDto = z.infer<typeof UpdateVariantAttributeSchema>;

export interface VariantAttributeResponseDto {
  id: string;
  name: string;
  options: VariantAttributeOptionDto[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}