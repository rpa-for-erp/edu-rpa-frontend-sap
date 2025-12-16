import {
  Version,
  VersionListItem,
  VersionListResponse,
  VersionDetailResponse,
  CreateVersionDto,
  UpdateVersionDto,
  ApiResponse,
} from "@/interfaces/version";
import apiBase from "./config";

/**
 * Get all versions for a process
 * GET /processes/{processId}/versions
 */
const getAllVersions = async (
  processId: string,
  page: number = 1,
  limit: number = 20
): Promise<VersionListResponse> => {
  const response = await apiBase.get<ApiResponse<VersionListItem[]>>(
    `${process.env.NEXT_PUBLIC_DEV_API}/processes/${processId}/versions`
  );

  const versions = response.data.data || [];

  return {
    versions,
    total: versions.length,
    page,
    limit,
  };
};

/**
 * Get a single version by ID (with full details including xml)
 * GET /processes/{processId}/versions/{versionId}
 */
const getVersionById = async (
  processId: string,
  versionId: string
): Promise<Version> => {
  const response = await apiBase.get<ApiResponse<VersionDetailResponse>>(
    `${process.env.NEXT_PUBLIC_DEV_API}/processes/${processId}/versions/${versionId}`
  );

  const data = response.data.data;

  // Merge processVersion info with xml, variables, activities
  return {
    ...data.processVersion,
    xml: data.xml,
    variables: data.variables,
    activities: data.activities,
  };
};

/**
 * Create a new version
 * POST /processes/{processId}/versions
 */
const createVersion = async (
  processId: string,
  payload: CreateVersionDto
): Promise<Version> => {
  const response = await apiBase.post<ApiResponse<VersionListItem>>(
    `${process.env.NEXT_PUBLIC_DEV_API}/processes/${processId}/versions`,
    payload
  );

  const data = response.data.data;

  // Return with payload data since API might not return full details
  return {
    ...data,
    xml: payload.xml,
    variables: payload.variables,
    activities: payload.activities,
  };
};

/**
 * Update version metadata
 * PUT /processes/{processId}/versions/{versionId}
 */
const updateVersion = async (
  processId: string,
  versionId: string,
  payload: UpdateVersionDto
): Promise<VersionListItem> => {
  const response = await apiBase.put<ApiResponse<VersionListItem>>(
    `${process.env.NEXT_PUBLIC_DEV_API}/processes/${processId}/versions/${versionId}`,
    payload
  );

  return response.data.data;
};

/**
 * Delete a version
 * DELETE /processes/{processId}/versions/{versionId}
 */
const deleteVersion = async (
  processId: string,
  versionId: string
): Promise<void> => {
  await apiBase.delete(
    `${process.env.NEXT_PUBLIC_DEV_API}/processes/${processId}/versions/${versionId}`
  );
};

/**
 * Revert/Restore a version as the current
 * POST /processes/{processId}/versions/{versionId}/revert
 */
const restoreVersion = async (
  processId: string,
  versionId: string
): Promise<{ message: string; restoredVersion: VersionListItem }> => {
  const response = await apiBase.post<VersionListItem>(
    `${process.env.NEXT_PUBLIC_DEV_API}/processes/${processId}/versions/${versionId}/revert`
  );

  return {
    message: "Version restored successfully",
    restoredVersion: response.data,
  };
};

/**
 * Download version as BPMN file
 * Gets version detail and returns xml as blob
 */
const downloadVersion = async (
  processId: string,
  versionId: string
): Promise<Blob> => {
  const version = await getVersionById(processId, versionId);
  return new Blob([version.xml], { type: "application/xml" });
};

const versionApi = {
  getAllVersions,
  getVersionById,
  createVersion,
  updateVersion,
  deleteVersion,
  restoreVersion,
  downloadVersion,
};

export default versionApi;
