import apiBase from './config';

// ==================== Team Processes APIs ====================

const getTeamProcesses = async (
  teamId: string,
  page: number = 1,
  limit: number = 10
) => {
  return await apiBase
    .get(
      `${process.env.NEXT_PUBLIC_DEV_API}/team/${teamId}/processes?page=${page}&limit=${limit}`
    )
    .then((res: any) => {
      console.log('📋 [teamApi.getTeamProcesses] Response:', res.data);
      const data = res.data.data;

      // Normalize: backend may use 'processId', frontend expects 'id'
      if (data?.processes) {
        data.processes = data.processes.map((p: any) => ({
          ...p,
          id: p.processId || p.id,
        }));
      }

      return data;
    });
};

const getTeamProcessById = async (teamId: string, processId: string) => {
  const url = `${process.env.NEXT_PUBLIC_DEV_API}/team/${teamId}/processes/${processId}`;
  console.log('🌐 [teamApi.getTeamProcessById] Request:', {
    teamId,
    processId,
    url,
  });

  return await apiBase
    .get(url)
    .then((res: any) => {
      console.log('✅ [teamApi.getTeamProcessById] Full Response:', res.data);
      const processData = res.data;

      // Validate response structure
      if (!processData) {
        console.error('❌ [teamApi.getTeamProcessById] No data in response!');
        throw new Error('Process data not found in response');
      }

      // Log all keys to debug
      console.log(
        '🔍 [teamApi.getTeamProcessById] All keys in processData:',
        Object.keys(processData)
      );
      console.log(
        '🔍 [teamApi.getTeamProcessById] Full processData:',
        processData
      );

      // Check various possible XML field names
      const xmlField =
        processData.xml ||
        processData.XML ||
        processData.content ||
        processData.xmlContent;

      if (!xmlField) {
        console.error(
          '❌ [teamApi.getTeamProcessById] XML missing in response!',
          {
            hasXml: !!processData.xml,
            hasXML: !!processData.XML,
            hasContent: !!processData.content,
            hasXmlContent: !!processData.xmlContent,
            keys: Object.keys(processData),
            firstFewKeys: Object.keys(processData).slice(0, 5),
          }
        );
      } else {
        console.log('✅ [teamApi.getTeamProcessById] XML found:', {
          xmlLength: xmlField?.length,
          hasActivities: !!processData.activities,
          hasVariables: !!processData.variables,
        });
      }

      // Normalize response: backend uses 'processId', frontend expects 'id'
      const normalized = {
        ...processData,
        id: processData.processId || processData.id,
      };

      console.log('✅ [teamApi.getTeamProcessById] Normalized:', {
        id: normalized.id,
        hasXml: !!normalized.xml,
      });

      return normalized;
    })
    .catch((error: any) => {
      console.error('❌ [teamApi.getTeamProcessById] Error:', {
        teamId,
        processId,
        url,
        status: error?.response?.status,
        message: error?.response?.data?.message || error.message,
        data: error?.response?.data,
      });
      throw error;
    });
};

const createTeamProcess = async (teamId: string, payload: any) => {
  return await apiBase
    .post(
      `${process.env.NEXT_PUBLIC_DEV_API}/team/${teamId}/processes`,
      payload
    )
    .then((res: any) => res.data.data);
};

const updateTeamProcess = async (
  teamId: string,
  processId: string,
  payload: any
) => {
  return await apiBase
    .put(
      `${process.env.NEXT_PUBLIC_DEV_API}/team/${teamId}/processes/${processId}`,
      payload
    )
    .then((res: any) => res.data.data);
};

const deleteTeamProcess = async (teamId: string, processId: string) => {
  return await apiBase
    .delete(
      `${process.env.NEXT_PUBLIC_DEV_API}/team/${teamId}/processes/${processId}`
    )
    .then((res: any) => res.data.data);
};

// ==================== Team Robots APIs ====================

const getTeamRobots = async (
  teamId: string,
  page: number = 1,
  limit: number = 10
) => {
  return await apiBase
    .get(
      `${process.env.NEXT_PUBLIC_DEV_API}/team/${teamId}/robots?page=${page}&limit=${limit}`
    )
    .then((res: any) => res.data.data);
};

const getTeamRobotByKey = async (teamId: string, robotKey: string) => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/team/${teamId}/robots/${robotKey}`)
    .then((res: any) => res.data.data);
};

const createTeamRobot = async (teamId: string, payload: any) => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_DEV_API}/team/${teamId}/robots`, payload)
    .then((res: any) => res.data.data);
};

const validateTeamRobot = async (
  teamId: string,
  robotKey: string,
  action: 'run' | 'delete' = 'run'
) => {
  return await apiBase
    .post(
      `${process.env.NEXT_PUBLIC_DEV_API}/team/${teamId}/robots/${robotKey}/validate?action=${action}`
    )
    .then((res: any) => res.data.data);
};

const deleteTeamRobot = async (teamId: string, robotKey: string) => {
  return await apiBase
    .delete(
      `${process.env.NEXT_PUBLIC_DEV_API}/team/${teamId}/robots/${robotKey}`
    )
    .then((res: any) => res.data.data);
};

const getTeamRobotConnections = async (teamId: string, robotKey: string) => {
  return await apiBase
    .get(
      `${process.env.NEXT_PUBLIC_DEV_API}/team/${teamId}/robots/${robotKey}/connections`
    )
    .then((res: any) => res.data.data);
};

// ==================== Team Connections APIs (Read-Only) ====================

const getTeamConnections = async (teamId: string, provider?: string) => {
  const params = provider ? `?provider=${provider}` : '';
  return await apiBase
    .get(
      `${process.env.NEXT_PUBLIC_DEV_API}/team/${teamId}/connections${params}`
    )
    .then((res: any) => res.data.data);
};

const getTeamConnection = async (
  teamId: string,
  provider: string,
  name: string
) => {
  return await apiBase
    .get(
      `${process.env.NEXT_PUBLIC_DEV_API}/team/${teamId}/connections/${encodeURIComponent(provider)}/${encodeURIComponent(name)}`
    )
    .then((res: any) => res.data.data);
};

// ==================== Team Member APIs ====================

const getCurrentTeamMember = async (teamId: string) => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/team/${teamId}/members/me`)
    .then((res: any) => res.data.data);
};

const teamApi = {
  // Processes
  getTeamProcesses,
  getTeamProcessById,
  createTeamProcess,
  updateTeamProcess,
  deleteTeamProcess,

  // Robots
  getTeamRobots,
  getTeamRobotByKey,
  createTeamRobot,
  validateTeamRobot,
  deleteTeamRobot,
  getTeamRobotConnections,

  // Connections (Read-Only)
  getTeamConnections,
  getTeamConnection,

  // Team Member
  getCurrentTeamMember,
};

export default teamApi;
