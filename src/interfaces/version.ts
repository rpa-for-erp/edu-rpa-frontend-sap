/**
 * Version Interface Definitions
 *
 * These interfaces define the structure of version-related data
 * for the BPMN process versioning feature.
 */

// Version item trong list (không có xml, variables, activities)
export interface VersionListItem {
  id: string;
  processId: string;
  tag: string;
  description: string | null;
  createdBy: number;
  updatedAt: string; // ISO date string
  isCurrent: boolean;
  creator: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  } | null;
}

// Version detail (có đầy đủ thông tin)
export interface Version extends VersionListItem {
  xml: string; // BPMN XML content
  variables: Record<string, any>;
  activities: Activity[];
}

// Activity trong version
export interface Activity {
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

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface VersionDetailResponse {
  processVersion: VersionListItem;
  xml: string;
  variables: Record<string, any>;
  activities: Activity[];
}

// DTOs
export interface CreateVersionDto {
  processId: string;
  xml: string;
  variables: Record<string, any>;
  activities: Activity[];
  tag: string;
  description: string;
}

export interface UpdateVersionDto {
  tag?: string;
  description?: string;
}

// List response
export interface VersionListResponse {
  versions: VersionListItem[];
  total: number;
  page: number;
  limit: number;
}

// For backward compatibility with existing components
export interface VersionChange {
  id: string;
  elementId: string;
  elementName: string;
  changeType: "added" | "changed" | "moved" | "removed";
  details?: string;
}

export interface VersionCompareResult {
  baseVersion: Version;
  compareVersion: Version;
  changes: VersionChange[];
  addedCount: number;
  changedCount: number;
  movedCount: number;
  removedCount: number;
}
