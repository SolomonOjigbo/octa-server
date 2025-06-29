
// Create User DTO
export interface CreateUserDto {
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  storeId?: string;
  isRoot?: boolean;
  isActive?: boolean;
  roles?: string[]; // Array of role IDs
  createdBy?: string; // ID of the user who created this user
  updatedBy?: string; // ID of the user who updated this user
}

// Update User DTO
export interface UpdateUserDto extends Partial<CreateUserDto> {
  currentPassword?: string;
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




