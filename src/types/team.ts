// Team Process Types
export interface TeamProcess {
  id: string;
  name: string;
  description: string;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamProcessDetail extends TeamProcess {
  detail: {
    processId: string;
    versionId: string;
    xml: string;
    variables: Record<string, any>;
    activities: TeamActivity[];
  };
}

export interface TeamActivity {
  activityID: string;
  activityType: string;
  properties: {
    activityPackage: string;
    serviceName: string;
    activityName: string;
    library: string;
    arguments: Record<string, any>;
    return: Record<string, any>;
  };
}

export interface CreateTeamProcessDto {
  id?: string;
  name: string;
  description: string;
  xml?: string;
  activities?: TeamActivity[];
  variables?: Record<string, any>;
}

// Team Robot Types
export interface TeamRobot {
  robotKey: string;
  processId: string;
  processName: string;
  processVersion: number;
  createdBy: string;
  createdAt: string;
}

export interface CreateTeamRobotDto {
  name: string;
  processId: string;
  processVersion: number;
  connections: Array<{
    connectionKey: string;
    isActivate: boolean;
  }>;
}

export interface RobotValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  action: 'run' | 'delete';
  robotKey: string;
  processId: string;
  processName: string;
}

export interface TeamRobotConnection {
  connectionKey: string;
  provider: string;
  name: string;
  isActivate: boolean;
}

// Team Connection Types (Read-Only)
export interface TeamConnection {
  connectionKey: string;
  provider: string;
  name: string;
  email?: string;
  createdAt: string;
}

// Pagination
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// Permission Types
export type TeamPermission =
  | 'view_processes'
  | 'create_process'
  | 'edit_process'
  | 'delete_process'
  | 'view_robots'
  | 'create_robot'
  | 'run_robot'
  | 'delete_robot';

export interface TeamRole {
  id: string;
  name: string;
  permissions: Array<{
    name: TeamPermission;
    description: string;
  }>;
}

export interface TeamMember {
  userId: number;
  teamId: string;
  role: TeamRole;
}
