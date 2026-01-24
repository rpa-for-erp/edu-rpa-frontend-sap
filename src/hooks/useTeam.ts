import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import teamApi from '@/apis/teamApi';
import { useToast } from '@chakra-ui/react';
import {
  TeamProcess,
  TeamRobot,
  CreateTeamProcessDto,
  CreateTeamRobotDto,
  RobotValidation,
} from '@/types/team';

// ==================== Team Processes Hooks ====================

export const useTeamProcesses = (
  teamId: string,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ['team-processes', teamId, page, limit],
    queryFn: () => teamApi.getTeamProcesses(teamId, page, limit),
    enabled: !!teamId,
  });
};

export const useTeamProcess = (teamId: string, processId: string) => {
  console.log('🔍 [useTeamProcess] Called with:', {
    teamId,
    processId,
    teamIdType: typeof teamId,
    processIdType: typeof processId,
    enabled: !!teamId && !!processId,
  });

  return useQuery({
    queryKey: ['team-process', teamId, processId],
    queryFn: () => {
      console.log('📡 [useTeamProcess] Fetching team process:', {
        teamId,
        processId,
      });
      return teamApi.getTeamProcessById(teamId, processId);
    },
    enabled: !!teamId && !!processId,
  });
};

export const useCreateTeamProcess = (teamId: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: CreateTeamProcessDto) =>
      teamApi.createTeamProcess(teamId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-processes', teamId] as any);
      toast({
        title: 'Process created successfully!',
        status: 'success',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.error?.message || 'Failed to create process';
      const errors = error?.response?.data?.error?.errors || [];

      toast({
        title: 'Failed to create process',
        description: errors.length > 0 ? errors.join(', ') : errorMessage,
        status: 'error',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
      });
    },
  });
};

export const useUpdateTeamProcess = (teamId: string, processId: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: CreateTeamProcessDto) =>
      teamApi.updateTeamProcess(teamId, processId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-processes', teamId] as any);
      queryClient.invalidateQueries(['team-process', teamId, processId] as any);
      toast({
        title: 'Process updated successfully!',
        status: 'success',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.error?.message || 'Failed to update process';
      toast({
        title: 'Failed to update process',
        description: errorMessage,
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
    },
  });
};

export const useDeleteTeamProcess = (teamId: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (processId: string) =>
      teamApi.deleteTeamProcess(teamId, processId),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-processes', teamId] as any);
      toast({
        title: 'Process deleted successfully!',
        status: 'success',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete process',
        description: error?.response?.data?.message || 'An error occurred',
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
    },
  });
};

// ==================== Team Robots Hooks ====================

export const useTeamRobots = (
  teamId: string,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ['team-robots', teamId, page, limit],
    queryFn: () => teamApi.getTeamRobots(teamId, page, limit),
    enabled: !!teamId,
  });
};

export const useTeamRobot = (teamId: string, robotKey: string) => {
  return useQuery({
    queryKey: ['team-robot', teamId, robotKey],
    queryFn: () => teamApi.getTeamRobotByKey(teamId, robotKey),
    enabled: !!teamId && !!robotKey,
  });
};

export const useCreateTeamRobot = (teamId: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: CreateTeamRobotDto) =>
      teamApi.createTeamRobot(teamId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-robots', teamId] as any);
      toast({
        title: 'Robot created successfully!',
        status: 'success',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.error?.message || 'Failed to create robot';
      const errors = error?.response?.data?.error?.errors || [];

      toast({
        title: 'Failed to create robot',
        description: errors.length > 0 ? errors.join(', ') : errorMessage,
        status: 'error',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
      });
    },
  });
};

export const useValidateTeamRobot = () => {
  return useMutation<
    RobotValidation,
    any,
    { teamId: string; robotKey: string; action: 'run' | 'delete' }
  >({
    mutationFn: ({ teamId, robotKey, action }) =>
      teamApi.validateTeamRobot(teamId, robotKey, action),
  });
};

export const useDeleteTeamRobot = (teamId: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (robotKey: string) => teamApi.deleteTeamRobot(teamId, robotKey),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-robots', teamId] as any);
      toast({
        title: 'Robot deleted successfully!',
        status: 'success',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete robot',
        description: error?.response?.data?.message || 'An error occurred',
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
    },
  });
};

export const useTeamRobotConnections = (teamId: string, robotKey: string) => {
  return useQuery({
    queryKey: ['team-robot-connections', teamId, robotKey],
    queryFn: () => teamApi.getTeamRobotConnections(teamId, robotKey),
    enabled: !!teamId && !!robotKey,
  });
};

// ==================== Team Connections Hooks ====================

export const useTeamConnections = (teamId: string, provider?: string) => {
  return useQuery({
    queryKey: ['team-connections', teamId, provider],
    queryFn: () => teamApi.getTeamConnections(teamId, provider),
    enabled: !!teamId,
  });
};

export const useTeamConnection = (
  teamId: string,
  provider: string,
  name: string
) => {
  return useQuery({
    queryKey: ['team-connection', teamId, provider, name],
    queryFn: () => teamApi.getTeamConnection(teamId, provider, name),
    enabled: !!teamId && !!provider && !!name,
  });
};

// ==================== Team Member Hooks ====================

export const useCurrentTeamMember = (teamId: string) => {
  return useQuery({
    queryKey: ['current-team-member', teamId],
    queryFn: () => teamApi.getCurrentTeamMember(teamId),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
};
