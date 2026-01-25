import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  useDisclosure,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  FormHelperText,
  Alert,
  AlertIcon,
  useToast,
  Tooltip,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { SearchIcon, RepeatIcon, QuestionIcon } from '@chakra-ui/icons';
import TeamLayout from '@/components/Layouts/TeamLayout';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import LoadingIndicator from '@/components/LoadingIndicator/LoadingIndicator';
import RobotTable from '@/components/Robot/RobotTable';
import { ToolTipExplain } from '@/constants/description';
import {
  useTeamRobots,
  useDeleteTeamRobot,
  useValidateTeamRobot,
  useCurrentTeamMember,
  useTeamProcesses,
  useCreateTeamRobot,
  useTeamConnections,
} from '@/hooks/useTeam';
import { hasTeamPermission } from '@/utils/teamPermissions';
import { TeamMember, RobotValidation } from '@/types/team';
import { formatDateTime } from '@/utils/time';
import {
  ValidationErrors,
  ValidationWarnings,
} from '@/components/Team/ValidationDisplay';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal';

export default function TeamRobotPage() {
  const router = useRouter();
  const { workspaceId, teamId } = router.query;
  const [nameFilter, setNameFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteRobotKey, setDeleteRobotKey] = useState<string | null>(null);
  const [validation, setValidation] = useState<RobotValidation | null>(null);
  const toast = useToast();

  // Robot creation form state
  const [robotName, setRobotName] = useState('');
  const [selectedProcessId, setSelectedProcessId] = useState('');
  const [selectedProcessVersion, setSelectedProcessVersion] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isValidationOpen,
    onOpen: onValidationOpen,
    onClose: onValidationClose,
  } = useDisclosure();
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  // Fetch current team member with role and permissions
  const {
    data: teamMember,
    isLoading: isLoadingMember,
    error: memberError,
  } = useCurrentTeamMember(teamId as string);

  const { data: robotsData, isLoading } = useTeamRobots(
    teamId as string,
    page,
    10
  );
  const { data: processesData, isLoading: isLoadingProcesses } =
    useTeamProcesses(teamId as string, 1, 100);
  const { data: connections } = useTeamConnections(teamId as string);
  const deleteMutation = useDeleteTeamRobot(teamId as string);
  const validateMutation = useValidateTeamRobot();
  const createMutation = useCreateTeamRobot(teamId as string);

  // If loading, has error, or teamMember is null/undefined, assume full permissions
  // This prevents Access Denied during loading or when API fails
  const canViewRobots =
    isLoadingMember || memberError || !teamMember
      ? true
      : hasTeamPermission(teamMember, 'view_robots');
  const canCreateRobot =
    isLoadingMember || memberError || !teamMember
      ? true
      : hasTeamPermission(teamMember, 'create_robot');
  const canRunRobot =
    isLoadingMember || memberError || !teamMember
      ? true
      : hasTeamPermission(teamMember, 'run_robot');
  const canDeleteRobot =
    isLoadingMember || memberError || !teamMember
      ? true
      : hasTeamPermission(teamMember, 'delete_robot');

  const fetchData = async () => {
    toast({
      title: 'Refresh functionality coming soon',
      status: 'info',
      position: 'top-right',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleCreateRobot = () => {
    setRobotName('');
    setSelectedProcessId('');
    setSelectedProcessVersion('');
    onCreateOpen();
  };

  const handleCreateRobotSubmit = async () => {
    if (!robotName.trim()) {
      toast({
        title: 'Robot name is required',
        status: 'error',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (!selectedProcessId) {
      toast({
        title: 'Please select a process',
        status: 'error',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: robotName,
        processId: selectedProcessId,
        processVersion: selectedProcessVersion
          ? parseInt(selectedProcessVersion)
          : undefined,
        connections:
          connections?.map((conn: any) => ({
            connectionKey: conn.connectionKey,
            isActivate: true,
          })) || [],
      });

      toast({
        title: 'Robot created successfully!',
        status: 'success',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });

      onCreateClose();
    } catch (error) {
      toast({
        title: 'Failed to create robot',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Format data for RobotTable
  const formatData =
    robotsData?.robots?.map((item: any) => {
      return {
        name: item.name || item.robotKey,
        processId: item.processId,
        processVersion: item.processVersion,
        createdAt: formatDateTime(item.createdAt),
        triggerType: item.triggerType || 'manual',
        robotKey: item.robotKey,
      };
    }) || [];
  console.log('Formatted Robot Data:', formatData);

  const tableProps = {
    header: [
      'Robot Name',
      'Process ID',
      'Process Version',
      'Created At',
      'Trigger Type',
      'Status',
      'Actions',
    ],
    data: formatData,
  };

  if (isLoading) {
    return (
      <TeamLayout>
        <LoadingIndicator />
      </TeamLayout>
    );
  }

  const handleViewRobot = (robotKey: string) => {
    router.push(`/workspace/${workspaceId}/teams/${teamId}/robot/${robotKey}`);
  };

  const handleRunRobot = async (robotKey: string) => {
    try {
      const result = await validateMutation.mutateAsync({
        teamId: teamId as string,
        robotKey,
        action: 'run',
      });

      setValidation(result);
      onValidationOpen();

      if (result.isValid) {
        // TODO: Integrate with Lambda to run robot
        console.log('Running robot:', robotKey);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDeleteClick = async (robotKey: string) => {
    try {
      const result = await validateMutation.mutateAsync({
        teamId: teamId as string,
        robotKey,
        action: 'delete',
      });

      setValidation(result);

      if (!result.isValid) {
        onValidationOpen();
        return;
      }

      setDeleteRobotKey(robotKey);
      onDeleteOpen();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteRobotKey) {
      await deleteMutation.mutateAsync(deleteRobotKey);
      setDeleteRobotKey(null);
      onDeleteClose();
    }
  };

  if (!canViewRobots) {
    return (
      <TeamLayout>
        <div className="mb-[200px]">
          <SidebarContent>
            <Box textAlign="center" py={10}>
              <Text fontSize="xl" fontWeight="bold" color="red.500">
                Access Denied
              </Text>
              <Text color="gray.600" mt={2}>
                You don't have permission to view team robots
              </Text>
            </Box>
          </SidebarContent>
        </div>
      </TeamLayout>
    );
  }

  return (
    <TeamLayout>
      <div className="mb-[200px]">
        <SidebarContent>
          <div className="flex flex-start items-center">
            <h1 className="pl-[20px] pr-[10px] ml-[35px] font-bold text-2xl text-[#319795]">
              Team Robot List
            </h1>
            <Tooltip
              hasArrow
              label={ToolTipExplain.ROBOT_SERVICE}
              bg="gray.300"
              color="black"
            >
              <QuestionIcon color="blue.500" />
            </Tooltip>
          </div>

          <div className="w-90 mx-auto my-[30px]">
            <div className="flex items-center">
              <InputGroup width="30vw" mr={4}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.500" />
                </InputLeftElement>
                <Input
                  bg="white.300"
                  type="text"
                  placeholder="Search by robot name"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                />
              </InputGroup>
              <div className="flex gap-[10px]">
                <IconButton
                  aria-label="Refresh"
                  icon={<RepeatIcon />}
                  onClick={fetchData}
                />
              </div>
            </div>
          </div>

          {tableProps.data.length === 0 && (
            <div className="w-90 m-auto flex justify-center items-center">
              <div className="text-center">
                <div className="text-2xl font-bold">No robots here</div>
                <div className="text-gray-500">
                  {canCreateRobot
                    ? 'Create your first robot to get started'
                    : 'No robots available in this team'}
                </div>
              </div>
            </div>
          )}

          <div className="w-90 m-auto">
            <RobotTable header={tableProps.header} data={tableProps.data} />
          </div>
        </SidebarContent>
      </div>

      {/* Validation Modal */}
      <Modal isOpen={isValidationOpen} onClose={onValidationClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {validation?.action === 'run'
              ? 'Run Robot Validation'
              : 'Delete Robot Validation'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {validation && (
              <>
                <ValidationErrors errors={validation.errors} />
                <ValidationWarnings warnings={validation.warnings} />

                {validation.isValid && validation.action === 'run' && (
                  <Text color="green.600" fontWeight="bold">
                    ✓ Robot is ready to run!
                  </Text>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onValidationClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        title="Delete Robot"
        content="delete this robot"
        isOpen={isDeleteOpen}
        isLoading={deleteMutation.isPending}
        onClose={onDeleteClose}
        onConfirm={handleDeleteConfirm}
      />

      {/* Create Robot Modal */}
      <Modal
        initialFocusRef={nameRef}
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        size="xl"
      >
        <ModalOverlay />
      </Modal>
    </TeamLayout>
  );
}
