export interface LoginDto {
  email: string;
  password: string;
}
export interface RequestResetDto {
  email: string;
}
export interface ResetPasswordDto {
  token: string;
  password: string;
}
export interface InviteUserDto {
  tenantId: string;
  email: string;
  name?: string;
  roleId?: string;
}
export interface ActivateUserDto {
  inviteToken: string;
  password: string;
  name?: string;
}
export interface RefreshTokenDto {
  refreshToken: string;
}
export interface LogoutDto {
  refreshToken: string;
}
export interface RequestPasswordResetDto {
  email: string;
}

