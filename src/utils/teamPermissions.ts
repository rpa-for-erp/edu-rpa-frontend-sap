import { TeamMember, TeamPermission } from '@/types/team';

/**
 * Check if user has a specific permission in the team
 */
export const hasTeamPermission = (
  teamMember: TeamMember | null | undefined,
  permission: TeamPermission
): boolean => {
  if (!teamMember?.role?.permissions) return false;
  
  return teamMember.role.permissions.some(p => p.name === permission);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyTeamPermission = (
  teamMember: TeamMember | null | undefined,
  permissions: TeamPermission[]
): boolean => {
  if (!teamMember?.role?.permissions) return false;
  
  return permissions.some(permission =>
    teamMember.role.permissions.some(p => p.name === permission)
  );
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllTeamPermissions = (
  teamMember: TeamMember | null | undefined,
  permissions: TeamPermission[]
): boolean => {
  if (!teamMember?.role?.permissions) return false;
  
  return permissions.every(permission =>
    teamMember.role.permissions.some(p => p.name === permission)
  );
};

/**
 * Get all permissions for a team member
 */
export const getTeamPermissions = (
  teamMember: TeamMember | null | undefined
): TeamPermission[] => {
  if (!teamMember?.role?.permissions) return [];
  
  return teamMember.role.permissions.map(p => p.name);
};
