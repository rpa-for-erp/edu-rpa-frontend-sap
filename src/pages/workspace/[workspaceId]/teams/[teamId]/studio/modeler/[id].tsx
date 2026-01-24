import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Spinner, Flex, Text } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { useTeamProcess, useCurrentTeamMember } from '@/hooks/useTeam';
import { hasTeamPermission } from '@/utils/teamPermissions';

const DynamicCustomModeler = dynamic(
  () => import('@/components/Bpmn/CustomModeler'),
  { ssr: false }
);

export default function TeamStudioModelerPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { workspaceId, teamId, id: processId } = router.query;

  console.log('🔍 [TeamModelerPage] Router params:', {
    workspaceId,
    teamId,
    processId,
    isReady: router.isReady,
  });

  // Fetch current team member with role and permissions
  const {
    data: teamMember,
    isLoading: isLoadingMember,
    error: memberError,
  } = useCurrentTeamMember(teamId as string);

  const {
    data: process,
    isLoading,
    error,
  } = useTeamProcess(teamId as string, processId as string);

  console.log('📊 [TeamModelerPage] Process data:', {
    process,
    isLoading,
    error,
    hasProcess: !!process,
  });

  // If loading, has error, or teamMember is null/undefined, assume full permissions
  const canViewProcesses =
    isLoadingMember || memberError || !teamMember
      ? true
      : hasTeamPermission(teamMember, 'view_processes');
  const canEditProcess =
    isLoadingMember || memberError || !teamMember
      ? true
      : hasTeamPermission(teamMember, 'edit_process');

  useEffect(() => {
    if (workspaceId) {
      // Sync workspace ID to Redux if needed
      dispatch({ type: 'workspace/setCurrentWorkspace', payload: workspaceId });
    }
  }, [workspaceId, dispatch]);

  if (!canViewProcesses) {
    return (
      <Box position="relative" h="100vh" overflow="hidden">
        <Flex justify="center" align="center" h="100vh">
          <Box textAlign="center">
            <Text fontSize="xl" fontWeight="bold" color="red.500">
              Access Denied
            </Text>
            <Text color="gray.600" mt={2}>
              You don't have permission to view team processes
            </Text>
          </Box>
        </Flex>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box position="relative" h="100vh" overflow="hidden">
        <Flex justify="center" align="center" h="100vh">
          <Spinner size="xl" color="teal.500" />
        </Flex>
      </Box>
    );
  }

  if (error || !process) {
    return (
      <Box position="relative" h="100vh" overflow="hidden">
        <Flex justify="center" align="center" h="100vh">
          <Box textAlign="center">
            <Text fontSize="xl" fontWeight="bold" color="red.500">
              Process Not Found
            </Text>
            <Text color="gray.600" mt={2}>
              The requested process could not be loaded
            </Text>
          </Box>
        </Flex>
      </Box>
    );
  }

  return (
    <Box position="relative" h="100vh" overflow="hidden">
      <DynamicCustomModeler />
    </Box>
  );
}
