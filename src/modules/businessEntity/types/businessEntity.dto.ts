// Business Entity DTOs
export interface CreateBusinessEntityDto {
  tenantId: string;
  name: string;
  taxId?: string;
  legalAddress?: string;
}
export interface UpdateBusinessEntityDto extends Partial<CreateBusinessEntityDto> {}

export interface BusinessEntityDto {
  id: string;
  tenantId: string;
  name: string;
  taxId?: string;
  legalAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}