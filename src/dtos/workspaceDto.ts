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
  contactEmail?: string;
  visibility?: WorkspaceVisibility;
}

// Team DTOs
export interface CreateTeamDto {
  name: string;
  description?: string;
  visibility: TeamVisibility;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
  visibility?: TeamVisibility;
}

// Role DTOs
export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

// Member DTOs
export interface InviteMemberDto {
  email: string;
  roleId?: string;
}

export interface UpdateMemberRoleDto {
  roleId: string;
}

export interface RespondInvitationDto {
  invitationId: string;
  status: InvitationStatus;
}
