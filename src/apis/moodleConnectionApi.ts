import apiBase from './config';

export interface CreateMoodleConnectionDto {
  baseUrl: string;
  token: string;
  name?: string;
}

export interface MoodleConnectionResponse {
  message: string;
  connection: {
    provider: string;
    name: string;
    connectionKey: string;
    createdAt: string;
  };
}

export interface MoodleSiteInfo {
  sitename: string;
  username: string;
  siteurl: string;
  version: string;
}

export interface TestMoodleConnectionResponse {
  message: string;
  siteInfo: MoodleSiteInfo;
}

export interface MoodleCredentials {
  baseUrl: string;
  token: string;
}

const createMoodleConnection = async (
  data: CreateMoodleConnectionDto
): Promise<MoodleConnectionResponse> => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_DEV_API}/connection/moodle`, data)
    .then((res: any) => {
      return res.data;
    });
};

const testMoodleConnection = async (
  name: string
): Promise<TestMoodleConnectionResponse> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/connection/moodle/test`, {
      params: { name },
    })
    .then((res: any) => {
      return res.data;
    });
};

const getMoodleCredentials = async (
  name: string
): Promise<MoodleCredentials> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/connection/moodle/credentials`, {
      params: { name },
    })
    .then((res: any) => {
      return res.data;
    });
};

const createWorkspaceMoodleConnection = async (
  workspaceId: string,
  data: CreateMoodleConnectionDto
): Promise<MoodleConnectionResponse> => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_DEV_API}/auth/workspace/${workspaceId}/moodle`, data)
    .then((res: any) => {
      return res.data;
    });
};

const moodleConnectionApi = {
  createMoodleConnection,
  testMoodleConnection,
  getMoodleCredentials,
  createWorkspaceMoodleConnection,
};

export default moodleConnectionApi;
