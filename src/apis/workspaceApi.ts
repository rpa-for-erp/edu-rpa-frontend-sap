import apiBase from './config';
import {
  Workspace,
  Team,
  Role,
  WorkspaceMember,
  WorkspaceMemberRole,
  TeamMember,
  Permission,
  TeamInvitation,
  WorkspaceInvitation,
  InvitationResponse,
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
    .then((res: any) => res.data.data);
};

const getWorkspaceById = async (workspaceId: string): Promise<Workspace> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}`)
    .then((res: any) => res.data.data);
};

const createWorkspace = async (
  payload: CreateWorkspaceDto
): Promise<Workspace> => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_DEV_API}/workspace`, payload)
    .then((res: any) => res.data.data);
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
    .then((res: any) => res.data.data);
};

const deleteWorkspace = async (workspaceId: string): Promise<void> => {
  return await apiBase
    .delete(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}`)
    .then((res: any) => res.data.data);
};

const leaveWorkspace = async (workspaceId: string): Promise<void> => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/leave`)
    .then((res: any) => res.data.data);
};

// ==================== Team APIs ====================
const getTeamsByWorkspace = async (workspaceId: string): Promise<Team[]> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/team`)
    .then((res: any) => res.data.data);
};

const getTeamById = async (teamId: string): Promise<Team> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/team/${teamId}`)
    .then((res: any) => res.data.data);
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
    .then((res: any) => res.data.data);
};

const updateTeam = async (
  teamId: string,
  payload: UpdateTeamDto
): Promise<Team> => {
  return await apiBase
    .patch(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/team/${teamId}`,
      payload
    )
    .then((res: any) => res.data.data);
};

const deleteTeam = async (teamId: string): Promise<void> => {
  return await apiBase
    .delete(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/team/${teamId}`)
    .then((res: any) => res.data.data);
};

const addPackageToTeam = async (
  teamId: string,
  packageId: string
): Promise<void> => {
  return await apiBase
    .post(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/team/${teamId}/package`,
      { packageId }
    )
    .then((res: any) => res.data.data);
};

const removePackageFromTeam = async (
  teamId: string,
  packageId: string
): Promise<void> => {
  return await apiBase
    .delete(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/team/${teamId}/package/${packageId}`
    )
    .then((res: any) => res.data.data);
};

// ==================== Role APIs ====================
const getRolesByTeam = async (teamId: string): Promise<Role[]> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/team/${teamId}/role`)
    .then((res: any) => res.data.data);
};

const createRole = async (
  teamId: string,
  payload: CreateRoleDto
): Promise<Role> => {
  return await apiBase
    .post(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/team/${teamId}/role`,
      payload
    )
    .then((res: any) => res.data.data);
};

const updateRole = async (
  teamId: string,
  roleId: string,
  payload: UpdateRoleDto
): Promise<Role> => {
  return await apiBase
    .patch(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/team/${teamId}/role/${roleId}`,
      payload
    )
    .then((res: any) => res.data.data);
};

const deleteRole = async (teamId: string, roleId: string): Promise<void> => {
  return await apiBase
    .delete(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/team/${teamId}/role/${roleId}`
    )
    .then((res: any) => res.data.data);
};

// ==================== Permission APIs ====================
const getAllPermissions = async (): Promise<Permission[]> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/permissions`)
    .then((res: any) => res.data.data);
};

// ==================== Member APIs ====================
const getWorkspaceMembers = async (
  workspaceId: string
): Promise<WorkspaceMember[]> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/member`)
    .then((res: any) => res.data.data);
};

const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/team/${teamId}/member`)
    .then((res: any) => res.data.data);
};

const inviteTeamMember = async (
  teamId: string,
  payload: InviteMemberDto
): Promise<TeamInvitation> => {
  return await apiBase
    .post(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/team/${teamId}/member/invitation`,
      payload
    )
    .then((res: any) => res.data.data);
};

const updateTeamMemberRole = async (
  teamId: string,
  memberId: string,
  payload: UpdateMemberRoleDto
): Promise<TeamMember> => {
  return await apiBase
    .patch(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/team/${teamId}/member/${memberId}/role`,
      payload
    )
    .then((res: any) => res.data.data);
};

const removeTeamMember = async (
  teamId: string,
  memberId: string
): Promise<void> => {
  return await apiBase
    .delete(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/team/${teamId}/member/${memberId}`
    )
    .then((res: any) => res.data.data);
};

const inviteWorkspaceMember = async (
  workspaceId: string,
  payload: { email: string; role: WorkspaceMemberRole }
): Promise<WorkspaceInvitation> => {
  return await apiBase
    .post(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/member/invitation`,
      payload
    )
    .then((res: any) => res.data.data);
};

const updateWorkspaceMemberRole = async (
  workspaceId: string,
  memberId: number,
  payload: { role: WorkspaceMemberRole }
): Promise<WorkspaceMember> => {
  return await apiBase
    .patch(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/member/${memberId}/role`,
      payload
    )
    .then((res: any) => res.data.data);
};

const removeWorkspaceMember = async (
  workspaceId: string,
  memberId: number
): Promise<void> => {
  return await apiBase
    .delete(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/${workspaceId}/member/${memberId}`
    )
    .then((res: any) => res.data.data);
};

// ==================== Invitation APIs ====================
const getMyInvitations = async (): Promise<InvitationResponse> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/workspace/invitation/me`)
    .then((res: any) => res.data.data);
};

const respondToInvitation = async (
  payload: RespondInvitationDto
): Promise<void> => {
  return await apiBase
    .post(
      `${process.env.NEXT_PUBLIC_DEV_API}/workspace/invitation/response`,
      payload
    )
    .then((res: any) => res.data.data);
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
  addPackageToTeam,
  removePackageFromTeam,

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
  inviteWorkspaceMember,
  inviteTeamMember,
  updateWorkspaceMemberRole,
  updateTeamMemberRole,
  removeWorkspaceMember,
  removeTeamMember,

  // Invitation
  getMyInvitations,
  respondToInvitation,
};

export default workspaceApi;
