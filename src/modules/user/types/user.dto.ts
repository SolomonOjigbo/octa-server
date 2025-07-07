export interface CreateUserDto {
  tenantId: string;
  storeId?: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  isRoot?: boolean;
}

export interface UpdateUserDto extends Partial<Omit<CreateUserDto, 'tenantId'>> {
  // We forbid changing tenantId after creation
}


// Response DTO
export interface UserResponseDto {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  storeId?: string;
  isRoot?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles?: RoleDto[];
  store?: StoreDto;
}

interface RoleDto {
  id: string;
  name: string;
  permissions: string[];
}

interface StoreDto {
  id: string;
  name: string;
  type: string;
}




