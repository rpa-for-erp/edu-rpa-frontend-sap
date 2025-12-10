import {
  TeamVisibility,
  WorkspaceVisibility,
  InvitationStatus,
} from '@/interfaces/workspace';

// Workspace DTOs
export interface CreateWorkspaceDto {
  name: string;
  contactEmail: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
  description?: string;
}

// Team DTOs
export interface CreateTeamDto {
  name: string;
  description?: string;
  visibility?: TeamVisibility;
  activityPackageIds?: string[];
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
  activityPackageIds?: string[];
}

// Role DTOs
export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds: string[];
  templateIds?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: string[];
  templateIds?: string[];
}

// Member DTOs
export interface InviteMemberDto {
  email: string;
  roleId: string;
}

export interface UpdateMemberRoleDto {
  roleId: string;
}

// Activity Package DTOs
export interface AddPackageToTeamDto {
  packageId: string;
}

// Invitation DTOs
export interface RespondInvitationDto {
  invitationId: string;
  status: InvitationStatus.ACCEPTED | InvitationStatus.REJECTED;
}
