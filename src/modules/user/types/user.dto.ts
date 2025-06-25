// User DTOs
export interface CreateUserDto {
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  storeId?: string;
  isRoot?: boolean;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {}



