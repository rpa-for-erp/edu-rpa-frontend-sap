// User interface
export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
}

// Workspace interfaces
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: number;
  owner: User;
  members: WorkspaceMember[];
  teams: Team[];
  createdAt: string;
  updatedAt: string;
}

export interface SimpleWorkspace {
  id: string;
  name: string;
  description?: string;
  ownerId: number;
  owner: User;
  createdAt: string;
  updatedAt: string;
}

// Team interfaces
export interface Team {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  roles: Role[];
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface SimpleTeam {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

// Role interfaces
export interface Role {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  isDefault: boolean;
  permissions: Permission[];
  activityTemplates?: ActivityTemplate[];
  createdAt: string;
  updatedAt: string;
}

// Permission interface
export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

// Activity Template interface
export interface ActivityTemplate {
  id: string;
  keyword: string;
  displayName: string;
  description?: string;
  packageId: string;
}

// Member interfaces
export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: number;
  user: User;
  role: WorkspaceMemberRole;
  joinedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: number;
  user: User;
  roleId: string;
  role: Role;
  joinedAt: string;
}

// Invitation interfaces
export interface TeamInvitation {
  id: string;
  teamId: string;
  team: SimpleTeam & {
    workspace: SimpleWorkspace;
  };
  invitedEmail: string;
  invitedUserId?: number;
  roleId: string;
  role: Role;
  invitedById: number;
  invitedBy: User;
  status: InvitationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspace: SimpleWorkspace;
  invitedEmail: string;
  invitedUserId?: number;
  role: WorkspaceMemberRole;
  invitedById: number;
  invitedBy: User;
  status: InvitationStatus;
  createdAt: string;
}

export interface InvitationResponse {
  teamInvitations: TeamInvitation[];
  workspaceInvitations: WorkspaceInvitation[];
}

// Enums
export enum WorkspaceVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum TeamVisibility {
  VISIBLE = 'VISIBLE',
  SECRET = 'SECRET',
}

export enum WorkspaceMemberRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum PermissionCategory {
  GOOGLE_DRIVE = 'Google Drive',
  ERPNEXT = 'ERPNext',
  DOCUMENT = 'Document',
}
