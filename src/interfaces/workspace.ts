export interface Workspace {
  id: string;
  name: string;
  contactEmail: string;
  visibility: WorkspaceVisibility;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  teamCount: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  visibility: TeamVisibility;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  roleCount: number;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: number;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  role: MemberRole;
  joinedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: number;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  roleId?: string;
  roleName?: string;
  joinedAt: Date;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  inviterName: string;
  invitedEmail: string;
  status: InvitationStatus;
  createdAt: Date;
}

export enum WorkspaceVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum TeamVisibility {
  VISIBLE = 'VISIBLE',
  SECRET = 'SECRET',
}

export enum MemberRole {
  OWNER = 'Owner',
  MEMBER = 'Member',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum PermissionCategory {
  GOOGLE_DRIVE = 'Google Drive',
  ERPNEXT = 'ERPNext',
  DOCUMENT = 'Document',
}
