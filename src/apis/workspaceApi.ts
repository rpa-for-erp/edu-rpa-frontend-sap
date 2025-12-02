import apiBase from './config';
import {
  Workspace,
  Team,
  Role,
  WorkspaceMember,
  TeamMember,
  Permission,
  TeamInvitation,
} from '@/interfaces/workspace';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  CreateTeamDto,
  UpdateTeamDto,
  CreateRoleDto,
  UpdateRoleDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  RespondInvitationDto,
} from '@/dtos/workspaceDto';

// ==================== Workspace APIs ====================
const getAllWorkspaces = async (): Promise<Workspace[]> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/workspace`)
    .then((res: any) => res.data);
};

const getWorkspaceById = async (workspaceId: string): Promise<Workspace> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}`)
    .then((res: any) => res.data);
};

const createWorkspace = async (
  payload: CreateWorkspaceDto
): Promise<Workspace> => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_DEV_API}/workspace`, payload)
    .then((res: any) => res.data);
};

const updateWorkspace = async (
  workspaceId: string,
  payload: UpdateWorkspaceDto
): Promise<Workspace> => {
  return await apiBase
    .patch(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}`,
      payload
    )
    .then((res: any) => res.data);
};

const deleteWorkspace = async (workspaceId: string): Promise<void> => {
  return await apiBase
    .delete(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}`)
    .then((res: any) => res.data);
};

const leaveWorkspace = async (workspaceId: string): Promise<void> => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/leave`)
    .then((res: any) => res.data);
};

// ==================== Team APIs ====================
const getTeamsByWorkspace = async (workspaceId: string): Promise<Team[]> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/team`)
    .then((res: any) => res.data);
};

const getTeamById = async (
  workspaceId: string,
  teamId: string
): Promise<Team> => {
  return await apiBase
    .get(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/team/${teamId}`
    )
    .then((res: any) => res.data);
};

const createTeam = async (
  workspaceId: string,
  payload: CreateTeamDto
): Promise<Team> => {
  return await apiBase
    .post(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/team`,
      payload
    )
    .then((res: any) => res.data);
};

const updateTeam = async (
  workspaceId: string,
  teamId: string,
  payload: UpdateTeamDto
): Promise<Team> => {
  return await apiBase
    .patch(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/team/${teamId}`,
      payload
    )
    .then((res: any) => res.data);
};

const deleteTeam = async (
  workspaceId: string,
  teamId: string
): Promise<void> => {
  return await apiBase
    .delete(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/team/${teamId}`
    )
    .then((res: any) => res.data);
};

// ==================== Role APIs ====================
const getRolesByTeam = async (
  workspaceId: string,
  teamId: string
): Promise<Role[]> => {
  return await apiBase
    .get(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/team/${teamId}/role`
    )
    .then((res: any) => res.data);
};

const createRole = async (
  workspaceId: string,
  teamId: string,
  payload: CreateRoleDto
): Promise<Role> => {
  return await apiBase
    .post(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/team/${teamId}/role`,
      payload
    )
    .then((res: any) => res.data);
};

const updateRole = async (
  workspaceId: string,
  teamId: string,
  roleId: string,
  payload: UpdateRoleDto
): Promise<Role> => {
  return await apiBase
    .patch(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/team/${teamId}/role/${roleId}`,
      payload
    )
    .then((res: any) => res.data);
};

const deleteRole = async (
  workspaceId: string,
  teamId: string,
  roleId: string
): Promise<void> => {
  return await apiBase
    .delete(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/team/${teamId}/role/${roleId}`
    )
    .then((res: any) => res.data);
};

// ==================== Permission APIs ====================
const getAllPermissions = async (): Promise<Permission[]> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/permission`)
    .then((res: any) => res.data);
};

// ==================== Member APIs ====================
const getWorkspaceMembers = async (
  workspaceId: string
): Promise<WorkspaceMember[]> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/member`)
    .then((res: any) => res.data);
};

const getTeamMembers = async (
  workspaceId: string,
  teamId: string
): Promise<TeamMember[]> => {
  return await apiBase
    .get(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/team/${teamId}/member`
    )
    .then((res: any) => res.data);
};

const inviteTeamMember = async (
  workspaceId: string,
  teamId: string,
  payload: InviteMemberDto
): Promise<void> => {
  return await apiBase
    .post(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/team/${teamId}/invite`,
      payload
    )
    .then((res: any) => res.data);
};

const updateTeamMemberRole = async (
  workspaceId: string,
  teamId: string,
  memberId: string,
  payload: UpdateMemberRoleDto
): Promise<void> => {
  return await apiBase
    .patch(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/team/${teamId}/member/${memberId}`,
      payload
    )
    .then((res: any) => res.data);
};

const removeTeamMember = async (
  workspaceId: string,
  teamId: string,
  memberId: string
): Promise<void> => {
  return await apiBase
    .delete(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/team/${teamId}/member/${memberId}`
    )
    .then((res: any) => res.data);
};

// ==================== Invitation APIs ====================
const getMyInvitations = async (): Promise<TeamInvitation[]> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/invitation`)
    .then((res: any) => res.data);
};

const respondToInvitation = async (
  payload: RespondInvitationDto
): Promise<void> => {
  return await apiBase
    .post(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/invitation/respond`,
      payload
    )
    .then((res: any) => res.data);
};

const workspaceApi = {
  // Workspace
  getAllWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  leaveWorkspace,

  // Team
  getTeamsByWorkspace,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,

  // Role
  getRolesByTeam,
  createRole,
  updateRole,
  deleteRole,

  // Permission
  getAllPermissions,

  // Member
  getWorkspaceMembers,
  getTeamMembers,
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,

  // Invitation
  getMyInvitations,
  respondToInvitation,
};

export default workspaceApi;
