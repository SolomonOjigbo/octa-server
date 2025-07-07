export interface CreateRoleDto {
  name: string;
  tenantId?: string;
  storeId?: string;
  warehouseId?: string;
  permissionIds: string[];
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {}


export interface AssignRoleDto {
  userId: string;
  roleId: string;
  assignedBy?: string;
}
export interface RoleResponseDto {
  id: string;
  name: string;
  tenantId?: string;
  storeId?: string;
  warehouseId?: string;
  permissions: {
    id: string;
    name: string;
    description?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
