
import { CreateRobotDto, CreateScheduleDto, EventSchedule, UpdateScheduleDto } from '@/dtos/robotDto';
import apiBase from './config';
import { Robot, Schedule } from '@/interfaces/robot';

const getAllRobot = async (limit: number, page: number) => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/robot?limit=${limit}&page=${page}`)
    .then((res: any) => {
      return res.data;
    });
};

const createRobot = async (payload: CreateRobotDto) => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_DEV_API}/robot`, payload)
    .then((res: any) => {
      return res.data;
    });
};

const deleteRobot = async (robotKey: string) => {
  return await apiBase
    .delete(`${process.env.NEXT_PUBLIC_DEV_API}/robot/${robotKey}`)
    .then((res: any) => {
      return res.data;
    });
};

const getNumberOfRobot = async () => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/robot/count`)
    .then((res: any) => {
      return res.data;
    });
};

const getRobotDetail = async (
  userId: number,
  processId: string,
  version: number
) => {
  return await apiBase
    .get(
      `${process.env.NEXT_PUBLIC_AWS_ROBOT_API_GATEWAY_URL}/robot/detail?user_id=${userId}&process_id=${processId}&version=${version}`
    )
    .then((res: any) => {
      return res.data;
    });
};

const stopRobot = async (
  userId: number,
  processId: string,
  version: number
) => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_AWS_ROBOT_API_GATEWAY_URL}/robot/stop`, {
      user_id: userId.toString(),
      process_id: processId,
      version: version,
    })
    .then((res: any) => {
      return res.data;
    });
};

const runRobot = async (
  userId: number,
  processId: string,
  version: number,
  options?: {
    isSimulate?: boolean;
    runType?: 'step-by-step' | 'run-all';
  }
) => {
  const body: Record<string, any> = {
    user_id: userId.toString(),
    process_id: processId,
    version: version,
    trigger_type: 'manual',
  };

  // Add simulation parameters if provided
  if (options?.isSimulate) {
    body.is_simulate = true;
    body.run_type = options.runType || 'run-all';
  }

  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_AWS_ROBOT_API_GATEWAY_URL}/robot/run`, body)
    .then((res: any) => {
      return res.data;
    });
};

const getSchedule = async (
  userId: number,
  processId: string,
  version: number
): Promise<Schedule> => {
  return await apiBase
    .get(
      `${process.env.NEXT_PUBLIC_AWS_ROBOT_API_GATEWAY_URL}/schedule?user_id=${userId}&process_id=${processId}&version=${version}`
    )
    .then((res: any) => {
      return res.data;
    });
};

const deleteSchedule = async (
  userId: number,
  processId: string,
  version: number
) => {
  return await apiBase
    .post(
      `${process.env.NEXT_PUBLIC_AWS_ROBOT_API_GATEWAY_URL}/schedule/delete`,
      {
        user_id: userId.toString(),
        process_id: processId,
        version: version,
      }
    )
    .then((res: any) => {
      return res.data;
    });
};

const createSchedule = async (
  userId: number,
  processId: string,
  version: number,
  createScheduleDto: CreateScheduleDto
) => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_AWS_ROBOT_API_GATEWAY_URL}/schedule`, {
      user_id: userId.toString(),
      process_id: processId,
      version: version,
      create_schedule_dto: createScheduleDto,
    })
    .then((res: any) => {
      return res.data;
    });
};

const updateSchedule = async (
  userId: number,
  processId: string,
  version: number,
  updateScheduleDto: UpdateScheduleDto
) => {
  return await apiBase
    .put(`${process.env.NEXT_PUBLIC_AWS_ROBOT_API_GATEWAY_URL}/schedule`, {
      user_id: userId.toString(),
      process_id: processId,
      version: version,
      update_schedule_dto: updateScheduleDto,
    })
    .then((res: any) => {
      return res.data;
    });
};

const upsertEventSchedule = async (
  userId: number,
  processId: string,
  version: number,
  eventSchedule: EventSchedule
) => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_AWS_ROBOT_API_GATEWAY_URL}/event`, {
      user_id: userId.toString(),
      process_id: processId,
      version: version,
      event_schedule: eventSchedule,
    })
    .then((res: any) => {
      return res.data;
    });
};

const getAllRobotsByConnectionKey = async (
  connectionKey: string
): Promise<Robot[]> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_DEV_API}/connection/usage/${connectionKey}`)
    .then((res: any) => {
      return res.data;
    });
};

/**
 * Run robot in simulation mode with robot code
 * Calls /robot/simulate endpoint
 */
const runSimulate = async (
  userId: number,
  processId: string,
  version: number,
  robotCode: string,
  connectionKeys: string[],
  options?: {
    runType?: 'step-by-step' | 'run-all';
  }
) => {
  const body = {
    user_id: userId.toString(),
    process_id: processId,
    version: version,
    trigger_type: 'manual',
    robot_code: robotCode,
    is_simulate: true,
    run_type: options?.runType || 'run-all',
    connection_keys: connectionKeys,
  };

  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_SIMULATE_PROCESS_API}/robot/simulate`, body)
    .then((res: any) => {
      return res.data;
    });
};

/**
 * Stop robot simulation
 * Calls /robot/stop/{process_id} endpoint
 */
const stopSimulate = async (processId: string) => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_SIMULATE_PROCESS_API}/robot/stop/${processId}`)
    .then((res: any) => {
      return res.data;
    });
};

const robotApi = {
  getAllRobot,
  createRobot,
  deleteRobot,
  getNumberOfRobot,
  getRobotDetail,
  stopRobot,
  runRobot,
  runSimulate,
  stopSimulate,
  getSchedule,
  deleteSchedule,
  createSchedule,
  updateSchedule,
  upsertEventSchedule,
  getAllRobotsByConnectionKey,
};

export default robotApi;
