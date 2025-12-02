import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  useDisclosure,
  Badge,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import { Workspace, MemberRole } from '@/interfaces/workspace';
import workspaceApi from '@/apis/workspaceApi';
import CreateWorkspaceModal from '@/components/Workspace/CreateWorkspaceModal';
import { useRouter } from 'next/router';
import { FaTrash, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { userSelector } from '@/redux/selector';
import { useSelector } from 'react-redux';

const WorkspaceListPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const user = useSelector(userSelector);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState<Workspace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    const filtered = workspaces.filter((workspace) =>
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredWorkspaces(filtered);
  }, [searchQuery, workspaces]);

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const data = await workspaceApi.getAllWorkspaces();
      setWorkspaces(data);
      setFilteredWorkspaces(data);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch workspaces',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedWorkspaces(filteredWorkspaces.map((w) => w.id));
    } else {
      setSelectedWorkspaces([]);
    }
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    if (selectedWorkspaces.includes(workspaceId)) {
      setSelectedWorkspaces(
        selectedWorkspaces.filter((id) => id !== workspaceId)
      );
    } else {
      setSelectedWorkspaces([...selectedWorkspaces, workspaceId]);
    }
  };

  const handleWorkspaceClick = (workspaceId: string) => {
    router.push(`/workspace/${workspaceId}/teams`);
  };

  const handleDeleteWorkspace = async (
    workspaceId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workspace?')) return;

    try {
      await workspaceApi.deleteWorkspace(workspaceId);
      toast({
        title: 'Success',
        description: 'Workspace deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchWorkspaces();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || 'Failed to delete workspace',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleLeaveWorkspace = async (
    workspaceId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to leave this workspace?')) return;

    try {
      await workspaceApi.leaveWorkspace(workspaceId);
      toast({
        title: 'Success',
        description: 'Left workspace successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchWorkspaces();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || 'Failed to leave workspace',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSettingsClick = (workspaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/workspace/${workspaceId}/settings`);
  };

  const isOwner = (workspace: Workspace) => {
    return workspace.ownerId === user.id;
  };

  return (
    <SidebarContent>
      <Container maxW="container.xl" py={5}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Workspace</Heading>
          <Button colorScheme="teal" onClick={onOpen}>
            New Workspace
          </Button>
        </Flex>

        <Box bg="white" borderRadius="lg" shadow="sm" p={4}>
          <Flex justify="space-between" align="center" mb={4}>
            <InputGroup maxW="400px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Find a workspace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </Flex>

          <Stack spacing={0}>
            <Flex
              bg="gray.100"
              p={3}
              borderTopRadius="md"
              align="center"
              justify="space-between"
            >
              <Flex align="center" gap={4}>
                <Checkbox
                  isChecked={
                    selectedWorkspaces.length === filteredWorkspaces.length &&
                    filteredWorkspaces.length > 0
                  }
                  onChange={handleSelectAll}
                >
                  Select All
                </Checkbox>
              </Flex>
              <Flex gap={8}>
                <Text fontWeight="medium" minW="100px" textAlign="right">
                  Visibility
                </Text>
                <Text fontWeight="medium" minW="100px" textAlign="right">
                  Members
                </Text>
              </Flex>
            </Flex>

            {filteredWorkspaces.map((workspace) => (
              <Flex
                key={workspace.id}
                p={3}
                borderBottom="1px"
                borderColor="gray.200"
                align="center"
                justify="space-between"
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                onClick={() => handleWorkspaceClick(workspace.id)}
              >
                <Flex align="center" gap={4} flex={1}>
                  <Checkbox
                    isChecked={selectedWorkspaces.includes(workspace.id)}
                    onChange={() => handleSelectWorkspace(workspace.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Stack spacing={0}>
                    <Flex align="center" gap={2}>
                      <Text fontWeight="medium" color="teal.600">
                        {workspace.name}
                      </Text>
                      {isOwner(workspace) && (
                        <Badge colorScheme="blue" fontSize="xs">
                          Owner
                        </Badge>
                      )}
                    </Flex>
                    <Text fontSize="sm" color="gray.500">
                      {workspace.memberCount} member
                      {workspace.memberCount !== 1 ? 's' : ''}
                    </Text>
                  </Stack>
                </Flex>

                <Flex gap={8} align="center">
                  <Text minW="100px" textAlign="right" fontSize="sm">
                    {workspace.visibility}
                  </Text>
                  <Flex minW="100px" justify="flex-end" gap={2}>
                    <IconButton
                      aria-label="Settings"
                      icon={<FaCog />}
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleSettingsClick(workspace.id, e)}
                    />
                    {isOwner(workspace) ? (
                      <IconButton
                        aria-label="Delete"
                        icon={<FaTrash />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={(e) => handleDeleteWorkspace(workspace.id, e)}
                      />
                    ) : (
                      <IconButton
                        aria-label="Leave"
                        icon={<FaSignOutAlt />}
                        size="sm"
                        variant="ghost"
                        colorScheme="orange"
                        onClick={(e) => handleLeaveWorkspace(workspace.id, e)}
                      />
                    )}
                  </Flex>
                </Flex>
              </Flex>
            ))}
          </Stack>
        </Box>
      </Container>

      <CreateWorkspaceModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={fetchWorkspaces}
      />
    </SidebarContent>
  );
};

export default WorkspaceListPage;
