import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import workspaceApi from '@/apis/workspaceApi';
import { QUERY_KEY } from '@/constants/queryKey';
import {
  WorkspaceConnection,
  CreateConnectionDto,
  UpdateConnectionDto,
  AuthorizationProvider,
} from '@/types/workspaceConnection';
import { useToast } from '@chakra-ui/react';

export const useWorkspaceConnections = (
  workspaceId: string,
  provider?: AuthorizationProvider
) => {
  return useQuery({
    queryKey: [QUERY_KEY.WORKSPACE_CONNECTIONS, workspaceId, provider],
    queryFn: () => workspaceApi.getWorkspaceConnections(workspaceId, provider),
    enabled: !!workspaceId,
  });
};

export const useWorkspaceConnection = (
  workspaceId: string,
  provider: AuthorizationProvider,
  name: string
) => {
  return useQuery({
    queryKey: [QUERY_KEY.WORKSPACE_CONNECTION_DETAIL, workspaceId, provider, name],
    queryFn: () => workspaceApi.getWorkspaceConnection(workspaceId, provider, name),
    enabled: !!workspaceId && !!provider && !!name,
  });
};

export const useCreateWorkspaceConnection = (workspaceId: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: CreateConnectionDto) =>
      workspaceApi.createWorkspaceConnection(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEY.WORKSPACE_CONNECTIONS, workspaceId] as any);
      toast({
        title: 'Connection created successfully!',
        status: 'success',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create connection',
        description: error?.response?.data?.message || error?.message || 'An error occurred',
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
    },
  });
};

export const useUpdateWorkspaceConnection = (
  workspaceId: string,
  provider: AuthorizationProvider,
  name: string
) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: UpdateConnectionDto) =>
      workspaceApi.updateWorkspaceConnection(workspaceId, provider, name, payload),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEY.WORKSPACE_CONNECTIONS, workspaceId] as any);
      queryClient.invalidateQueries([
        QUERY_KEY.WORKSPACE_CONNECTION_DETAIL,
        workspaceId,
        provider,
        name,
      ] as any);
      toast({
        title: 'Connection updated successfully!',
        status: 'success',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update connection',
        description: error?.response?.data?.message || error?.message || 'An error occurred',
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
    },
  });
};

export const useDeleteWorkspaceConnection = (workspaceId: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ provider, name }: { provider: AuthorizationProvider; name: string }) =>
      workspaceApi.deleteWorkspaceConnection(workspaceId, provider, name),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEY.WORKSPACE_CONNECTIONS, workspaceId] as any);
      toast({
        title: 'Connection deleted successfully!',
        status: 'success',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete connection',
        description: error?.response?.data?.message || error?.message || 'An error occurred',
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
    },
  });
};
