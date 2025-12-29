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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import { Workspace } from '@/interfaces/workspace';
import workspaceApi from '@/apis/workspaceApi';
import CreateWorkspaceModal from '@/components/Workspace/CreateWorkspaceModal';
import { useRouter } from 'next/router';
import { FaTrash, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { userSelector } from '@/redux/selector';
import { GetServerSideProps } from 'next';
import { getServerSideTranslations } from '@/utils/i18n';
import { useSelector } from 'react-redux';
import { MdArrowDropDown } from 'react-icons/md';
import { COLORS } from '@/constants/colors';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal';
import { red } from '@mui/material/colors';

const WorkspaceListPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const user = useSelector(userSelector);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState<Workspace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'member'>(
    'all'
  );
  const { isOpen, onClose } = useDisclosure();

  // Confirmation modals
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isLeaveOpen,
    onOpen: onLeaveOpen,
    onClose: onLeaveClose,
  } = useDisclosure();
  const [pendingAction, setPendingAction] = useState<{
    workspaceId: string;
    workspaceName: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    let filtered = workspaces.filter((workspace) =>
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply role filter
    if (roleFilter === 'owner') {
      filtered = filtered.filter((workspace) => workspace.ownerId === user.id);
    } else if (roleFilter === 'member') {
      filtered = filtered.filter((workspace) => workspace.ownerId !== user.id);
    }

    setFilteredWorkspaces(filtered);
  }, [searchQuery, workspaces, roleFilter, user.id]);

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
    router.push(`/workspace/${workspaceId}`);
  };

  const handleDeleteWorkspace = async (
    workspaceId: string,
    workspaceName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setPendingAction({ workspaceId, workspaceName });
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!pendingAction) return;

    try {
      setIsSubmitting(true);
      await workspaceApi.deleteWorkspace(pendingAction.workspaceId);
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
    } finally {
      setIsSubmitting(false);
      onDeleteClose();
      setPendingAction(null);
    }
  };

  const handleLeaveWorkspace = async (
    workspaceId: string,
    workspaceName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setPendingAction({ workspaceId, workspaceName });
    onLeaveOpen();
  };

  const confirmLeave = async () => {
    if (!pendingAction) return;

    try {
      setIsSubmitting(true);
      await workspaceApi.leaveWorkspace(pendingAction.workspaceId);
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
    } finally {
      setIsSubmitting(false);
      onLeaveClose();
      setPendingAction(null);
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
          <Heading size="lg" color={COLORS.primary}>
            Workspace
          </Heading>
        </Flex>

        <Box bg="white" borderRadius="lg" shadow="sm">
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
            <Button
              colorScheme="teal"
              onClick={() => router.push('/workspace/create')}
            >
              New Workspace
            </Button>
          </Flex>

          <Stack spacing={0}>
            <Flex
              bg="gray.100"
              p={3}
              borderTopRadius="md"
              align="center"
              justify="space-between"
              gap="auto"
            >
              <Flex align="center" gap={4} flex={1}>
                <Checkbox
                  isChecked={
                    selectedWorkspaces.length === filteredWorkspaces.length &&
                    filteredWorkspaces.length > 0
                  }
                  onChange={handleSelectAll}
                />
                <Text fontWeight="medium">Workspaces</Text>
              </Flex>
              <Flex align="right">
                <Menu>
                  <MenuButton
                    border="0px"
                    as={Button}
                    variant="outline"
                    rightIcon={<MdArrowDropDown />}
                    px={2}
                  >
                    {roleFilter === 'all'
                      ? 'All'
                      : roleFilter.charAt(0).toUpperCase() +
                        roleFilter.slice(1)}
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => setRoleFilter('all')}>
                      All Roles
                    </MenuItem>
                    <MenuItem onClick={() => setRoleFilter('owner')}>
                      Owner
                    </MenuItem>
                    <MenuItem onClick={() => setRoleFilter('member')}>
                      Member
                    </MenuItem>
                  </MenuList>
                </Menu>
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
                // cursor="pointer"
                // onClick={() => handleWorkspaceClick(workspace.id)}
              >
                <Flex align="center" gap={4} flex={1}>
                  <Checkbox
                    isChecked={selectedWorkspaces.includes(workspace.id)}
                    onChange={() => handleSelectWorkspace(workspace.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Stack spacing={0}>
                    <Flex align="center" gap={2}>
                      <Text
                        fontWeight="medium"
                        color="teal.600"
                        cursor="pointer"
                        onClick={() => handleWorkspaceClick(workspace.id)}
                      >
                        {workspace.name}
                      </Text>
                      {isOwner(workspace) && (
                        <Badge colorScheme="blue" fontSize="xs">
                          Owner
                        </Badge>
                      )}
                    </Flex>
                    <Text fontSize="sm" color="gray.500">
                      {workspace.members?.length || 0} member
                      {workspace.members?.length !== 1 ? 's' : ''}
                    </Text>
                  </Stack>
                </Flex>

                <Flex gap={4} align="center">
                  <Text
                    fontSize="sm"
                    color="gray.500"
                    minW="80px"
                    textAlign="right"
                  >
                    {workspace.members?.length || 0} member
                    {workspace.members?.length !== 1 ? 's' : ''}
                  </Text>
                  <Box
                    onClick={(e) => handleSettingsClick(workspace.id, e)}
                    cursor="pointer"
                    px={4}
                    pt={0.2}
                    pb={0.3}
                    border="1px"
                    borderColor="gray.400"
                    backgroundColor={COLORS.grayButton}
                    borderRadius="md"
                    _hover={{
                      bg: COLORS.primaryHover,
                      '& > p': { color: COLORS.bgWhite },
                    }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="14px" color="gray.700">
                      Settings
                    </Text>
                  </Box>
                  {isOwner(workspace) ? (
                    <Box
                      onClick={(e) =>
                        handleDeleteWorkspace(workspace.id, workspace.name, e)
                      }
                      cursor="pointer"
                      px={4}
                      py={0.2}
                      pb={0.3}
                      borderRadius={6}
                      _hover={{ opacity: 0.8 }}
                      backgroundColor={COLORS.red[500]}
                    >
                      <Text
                        fontSize="14px"
                        color={COLORS.bgGrayLight}
                        fontWeight="medium"
                      >
                        Delete
                      </Text>
                    </Box>
                  ) : (
                    <IconButton
                      aria-label="Leave"
                      icon={<FaSignOutAlt />}
                      size="sm"
                      variant="ghost"
                      colorScheme="orange"
                      onClick={(e) =>
                        handleLeaveWorkspace(workspace.id, workspace.name, e)
                      }
                    />
                  )}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        title="Delete Workspace"
        content={`delete workspace "${pendingAction?.workspaceName}"`}
        isOpen={isDeleteOpen}
        isLoading={isSubmitting}
        onClose={onDeleteClose}
        onConfirm={confirmDelete}
      />

      {/* Leave Confirmation Modal */}
      <ConfirmModal
        title="Leave Workspace"
        content={`leave workspace "${pendingAction?.workspaceName}"`}
        isOpen={isLeaveOpen}
        isLoading={isSubmitting}
        onClose={onLeaveClose}
        onConfirm={confirmLeave}
      />
    </SidebarContent>
  );
};

export default WorkspaceListPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      ...(await getServerSideTranslations(context, ['common', 'sidebar', 'navbar'])),
    },
  };
};
