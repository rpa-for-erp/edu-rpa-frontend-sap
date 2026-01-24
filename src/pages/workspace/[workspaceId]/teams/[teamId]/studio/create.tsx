import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  useToast,
  Heading,
  Card,
  CardBody,
  FormHelperText,
  Text,
} from '@chakra-ui/react';
import TeamLayout from '@/components/Layouts/TeamLayout';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import { useCreateTeamProcess, useCurrentTeamMember } from '@/hooks/useTeam';
import { hasTeamPermission } from '@/utils/teamPermissions';

export default function CreateTeamProcessPage() {
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
  const canCreateProcess =
    isLoadingMember || memberError || !teamMember
      ? true
      : hasTeamPermission(teamMember, 'create_process');

  const [processName, setProcessName] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useCreateTeamProcess(teamId as string);

  const handleSubmit = async () => {
    if (!processName.trim()) {
      toast({
        title: 'Process name is required',
        status: 'error',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      const newProcess = await createMutation.mutateAsync({
        name: processName,
        description: description,
        activities: [],
        variables: {},
      });

      // Navigate to modeler to edit the new process
      router.push(
        `/workspace/${workspaceId}/teams/${teamId}/studio/modeler/${newProcess.id}`
      );
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  if (!canCreateProcess) {
    return (
      <TeamLayout>
        <SidebarContent>
          <Box textAlign="center" py={10}>
            <Text fontSize="xl" fontWeight="bold" color="red.500">
              Access Denied
            </Text>
            <Text color="gray.600" mt={2}>
              You don't have permission to create processes in this team
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
            Create New Team Process
          </Heading>

          <Card maxW="800px">
            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Process Name */}
                <FormControl isRequired>
                  <FormLabel>Process Name</FormLabel>
                  <Input
                    placeholder="Enter process name"
                    value={processName}
                    onChange={(e) => setProcessName(e.target.value)}
                    bg="white"
                  />
                  <FormHelperText>
                    Give your process a clear and descriptive name
                  </FormHelperText>
                </FormControl>

                {/* Description */}
                <FormControl>
                  <FormLabel>Description (Optional)</FormLabel>
                  <Textarea
                    placeholder="Describe what this process does..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    bg="white"
                    rows={4}
                  />
                  <FormHelperText>
                    Provide details about the process purpose and functionality
                  </FormHelperText>
                </FormControl>

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
                    Create & Edit
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
