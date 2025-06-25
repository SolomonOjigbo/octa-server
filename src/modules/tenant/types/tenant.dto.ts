// Tenant DTOs
export interface CreateTenantDto {
  name: string;
  slug: string;
  legalName?: string;
  contactEmail?: string;
  branding?: any;
  settings?: any;
}
export interface UpdateTenantDto extends Partial<CreateTenantDto> {}