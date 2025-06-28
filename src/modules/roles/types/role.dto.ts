export interface CreateRoleDto {
  name: string;
  tenantId?: string;
  storeId?: string;
  warehouseId?: string;
  permissionIds: string[]; // assign these permissions to role
}

export interface AssignRoleDto {
  userId: string;
  roleId: string;
  assignedBy?: string;
}

export interface UpdateRoleDto {
  id: string;
  name?: string;
  tenantId?: string;
  storeId?: string;
  warehouseId?: string;
  permissionIds?: string[]; // update permissions for role
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
