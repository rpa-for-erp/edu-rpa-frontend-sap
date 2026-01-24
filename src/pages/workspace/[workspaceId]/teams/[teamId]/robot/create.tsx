import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Text,
  useToast,
  Heading,
  Card,
  CardBody,
  FormHelperText,
  Spinner,
  Flex,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import TeamLayout from '@/components/Layouts/TeamLayout';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import {
  useTeamProcesses,
  useCreateTeamRobot,
  useTeamConnections,
  useCurrentTeamMember,
} from '@/hooks/useTeam';
import { hasTeamPermission } from '@/utils/teamPermissions';

export default function CreateTeamRobotPage() {
  const router = useRouter();
  const toast = useToast();
  const { workspaceId, teamId } = router.query;

  // Fetch current team member
  const {
    data: teamMember,
    isLoading: isLoadingMember,
    error: memberError,
  } = useCurrentTeamMember(teamId as string);

  // Check permissions - if loading, has error, or no member, assume full permissions
  const canCreateRobot =
    isLoadingMember || memberError || !teamMember
      ? true
      : hasTeamPermission(teamMember, 'create_robot');

  const [robotName, setRobotName] = useState('');
  const [selectedProcessId, setSelectedProcessId] = useState('');
  const [selectedProcessVersion, setSelectedProcessVersion] = useState('');

  // Fetch team processes
  const { data: processesData, isLoading: isLoadingProcesses } =
    useTeamProcesses(teamId as string, 1, 100);

  // Fetch connections for the selected process (if needed)
  const { data: connections } = useTeamConnections(teamId as string);

  const createMutation = useCreateTeamRobot(teamId as string);

  const handleSubmit = async () => {
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

      // Navigate back to robots list
      router.push(`/workspace/${workspaceId}/teams/${teamId}/robot`);
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  if (!canCreateRobot) {
    return (
      <TeamLayout>
        <SidebarContent>
          <Box textAlign="center" py={10}>
            <Text fontSize="xl" fontWeight="bold" color="red.500">
              Access Denied
            </Text>
            <Text color="gray.600" mt={2}>
              You don't have permission to create robots in this team
            </Text>
          </Box>
        </SidebarContent>
      </TeamLayout>
    );
  }

  return (
    <TeamLayout>
      <SidebarContent>
        <Box px={8} py={6}>
          <Heading size="lg" mb={6} color="teal.600">
            Create Team Robot
          </Heading>

          <Card maxW="800px">
            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Robot Name */}
                <FormControl isRequired>
                  <FormLabel>Robot Name</FormLabel>
                  <Input
                    placeholder="Enter robot name"
                    value={robotName}
                    onChange={(e) => setRobotName(e.target.value)}
                    bg="white"
                  />
                  <FormHelperText>
                    Give your robot a descriptive name
                  </FormHelperText>
                </FormControl>

                {/* Process Selection */}
                <FormControl isRequired>
                  <FormLabel>Select Process</FormLabel>
                  {isLoadingProcesses ? (
                    <Flex justify="center" py={4}>
                      <Spinner size="md" color="teal.500" />
                    </Flex>
                  ) : (
                    <Select
                      placeholder="Choose a process"
                      value={selectedProcessId}
                      onChange={(e) => {
                        setSelectedProcessId(e.target.value);
                        const process = processesData?.processes?.find(
                          (p: any) => p.id === e.target.value
                        );
                        if (process) {
                          setSelectedProcessVersion(
                            process.version?.toString() || ''
                          );
                        }
                      }}
                      bg="white"
                    >
                      {processesData?.processes?.map((process: any) => (
                        <option key={process.id} value={process.id}>
                          {process.name} (v{process.version})
                        </option>
                      ))}
                    </Select>
                  )}
                  <FormHelperText>
                    Select which team process this robot will execute
                  </FormHelperText>
                </FormControl>

                {/* Process Version (read-only, auto-filled) */}
                {selectedProcessVersion && (
                  <FormControl>
                    <FormLabel>Process Version</FormLabel>
                    <Input
                      value={`Version ${selectedProcessVersion}`}
                      isReadOnly
                      bg="gray.50"
                    />
                    <FormHelperText>
                      Robot will use the selected process version
                    </FormHelperText>
                  </FormControl>
                )}

                {/* Connections Info */}
                {connections && connections.length > 0 && (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Available Connections</Text>
                      <Text fontSize="sm">
                        {connections.length} connection(s) will be available to
                        this robot
                      </Text>
                    </Box>
                  </Alert>
                )}

                {/* Action Buttons */}
                <HStack justify="flex-end" spacing={4} pt={4}>
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    isDisabled={createMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="teal"
                    onClick={handleSubmit}
                    isLoading={createMutation.isPending}
                    loadingText="Creating..."
                  >
                    Create Robot
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </SidebarContent>
    </TeamLayout>
  );
}
