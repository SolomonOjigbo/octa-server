export interface AssignRoleDto {
  userId: string;
  roleId: string;
  assignedBy?: string;
}

export interface RemoveRoleDto {
  userId: string;
  roleId: string;
}
