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
  IconButton,
  useToast,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Avatar,
  Select,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { SearchIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import WorkspaceLayout from '@/components/Layouts/WorkspaceLayout';
import { WorkspaceMember, WorkspaceMemberRole } from '@/interfaces/workspace';
import workspaceApi from '@/apis/workspaceApi';
import { FaTrash } from 'react-icons/fa';
import { MdArrowDropDown, MdEmail } from 'react-icons/md';
import { COLORS } from '@/constants/colors';
import { useSelector } from 'react-redux';
import { homeSelector } from '@/redux/selector';

interface InviteWorkspaceMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: () => void;
}

const InviteWorkspaceMemberModal: React.FC<InviteWorkspaceMemberModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceMemberRole>(
    WorkspaceMemberRole.MEMBER
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsSubmitting(true);
      await workspaceApi.inviteWorkspaceMember(workspaceId, { email, role });
      toast({
        title: 'Success',
        description: 'Member invited successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
      onSuccess();
      setEmail('');
      setRole(WorkspaceMemberRole.MEMBER);
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || 'Failed to invite member',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent
        borderRadius="10px"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <ModalHeader fontSize="20px" fontWeight="bold" p="0 24px" mb={0}>
          <Flex
            position="relative"
            mt={10}
            mb={8}
            align="center"
            justify="center"
          >
            <Avatar
              size="lg"
              name="User 1"
              src="https://bit.ly/dan-abramov"
              border="3px solid white"
              zIndex={1}
              ml={-4}
            />
            <Avatar
              size="lg"
              name="User 2"
              src="https://bit.ly/sage-adebayo"
              border="3px solid white"
              zIndex={2}
            />
            <Avatar
              size="lg"
              name="User 3"
              src="https://bit.ly/ryan-florence"
              border="3px solid white"
              zIndex={1}
              mr={-4}
            />
          </Flex>
          Invite Your Workspace Member
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody pt="3px" mb={38}>
            <Text fontSize="sm" color="gray.400" mb={10} align="center">
              Excited On Starting A New Project!
            </Text>
            <InputGroup
              w="400px"
              mb={2}
              display={'flex'}
              alignItems={'center'}
              justifyContent={'center'}
            >
              <InputLeftElement
                pointerEvents="none"
                alignItems={'center'}
                h="100%"
                children={<MdEmail size={20} color={COLORS.primary} />} // hoặc COLORS.primary
              />
              <Input
                name="email"
                placeholder="Team Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                color={COLORS.primary}
                _placeholder={{ color: COLORS.primary }}
                h="50px"
              />
            </InputGroup>
            <Text fontSize="xs" color="gray.400" mt={2} mb={4}>
              Enter your team member email address
            </Text>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceMemberRole)}
              py={2}
              required
              color={COLORS.primary}
            >
              <option value={WorkspaceMemberRole.MEMBER}>Member</option>
              <option value={WorkspaceMemberRole.OWNER}>Owner</option>
            </Select>
            <Text fontSize="xs" color="gray.400" mt={0} mb={2}>
              Choose the role for the invited member
            </Text>
          </ModalBody>
          <ModalFooter justifyContent="center" alignItems="center">
            <Button variant="ghost" mr={3} onClick={onClose} w="100px">
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="teal"
              w="100px"
              isLoading={isSubmitting}
            >
              INVITE
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

const WorkspaceMembersPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const { workspaceId } = router.query as { workspaceId: string };
  const { workspaces } = useSelector(homeSelector);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<WorkspaceMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [filterRole, setFilterRole] = useState<string>('all');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const workspace = workspaces.find((w) => w.id === workspaceId);

  // Confirmation modals
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isRoleChangeOpen,
    onOpen: onRoleChangeOpen,
    onClose: onRoleChangeClose,
  } = useDisclosure();
  const [pendingDelete, setPendingDelete] = useState<{
    memberId: number;
    memberName: string;
  } | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    memberId: number;
    memberName: string;
    newRole: WorkspaceMemberRole;
  } | null>(null);

  useEffect(() => {
    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId]);

  useEffect(() => {
    let filtered = members.filter(
      (member) =>
        member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterRole !== 'all') {
      filtered = filtered.filter((member) => {
        console.log(member.role, filterRole);
        return member.role.toLowerCase() === filterRole.toLowerCase();
      });
    }

    setFilteredMembers(filtered);
  }, [searchQuery, members, filterRole]);

  const fetchMembers = async () => {
    try {
      const data = await workspaceApi.getWorkspaceMembers(workspaceId);
      setMembers(data);
      setFilteredMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch members',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedMembers(filteredMembers.map((m) => m.userId));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSelectMember = (memberId: number) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleRemoveMember = async (
    memberId: number,
    memberName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setPendingDelete({ memberId, memberName });
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      await workspaceApi.removeWorkspaceMember(
        workspaceId,
        pendingDelete.memberId
      );
      toast({
        title: 'Success',
        description: 'Member removed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchMembers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || 'Failed to remove member',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      setPendingDelete(null);
    }
  };

  const handleUpdateMemberRole = async (
    memberId: number,
    memberName: string,
    role: WorkspaceMemberRole
  ) => {
    setPendingRoleChange({ memberId, memberName, newRole: role });
    onRoleChangeOpen();
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;

    try {
      await workspaceApi.updateWorkspaceMemberRole(
        workspaceId,
        pendingRoleChange.memberId,
        {
          role: pendingRoleChange.newRole,
        }
      );
      toast({
        title: 'Success',
        description: 'Member role updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchMembers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || 'Failed to update member role',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onRoleChangeClose();
      setPendingRoleChange(null);
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredMembers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workspace-members-${workspaceId}.json`;
    link.click();
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Teams', 'Roles'];
    const rows = filteredMembers.map((member) => [
      member.user.name,
      member.user.email,
      member.role,
      '0 teams', // placeholder
      '0 roles', // placeholder
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workspace-members-${workspaceId}.csv`;
    link.click();
  };

  return (
    <WorkspaceLayout>
      <Container maxW="container.xl" py={5}>
        <Breadcrumb
          spacing="8px"
          separator={<ChevronRightIcon color="gray.500" />}
          mb={4}
        >
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => router.push('/workspace')}>
              Workspaces
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => router.push(`/workspace/${workspaceId}`)}
            >
              {workspace?.name || 'Workspace'}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Members</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg" color={COLORS.primary}>
            Members
          </Heading>
        </Flex>

        <Box bg="white" borderRadius="lg" shadow="sm" p={4}>
          <Flex justify="space-between" align="center" mb={4} gap={4}>
            <InputGroup maxW="400px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Find a member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            <Flex gap={2} align="center">
              <Menu>
                <MenuButton
                  as={Button}
                  variant="outline"
                  leftIcon={<Text>📥</Text>}
                >
                  Export
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={exportToJSON}>JSON</MenuItem>
                  <MenuItem onClick={exportToCSV}>CSV</MenuItem>
                </MenuList>
              </Menu>
              <Button colorScheme="teal" onClick={onOpen}>
                Invite member
              </Button>
            </Flex>
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
                    selectedMembers.length === filteredMembers.length &&
                    filteredMembers.length > 0
                  }
                  onChange={handleSelectAll}
                />
                <Text fontWeight="medium">Members</Text>
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
                    {filterRole === 'all'
                      ? 'All'
                      : filterRole === WorkspaceMemberRole.OWNER
                      ? 'Owner'
                      : 'Member'}
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => setFilterRole('all')}>
                      All Roles
                    </MenuItem>
                    <MenuItem
                      onClick={() => setFilterRole(WorkspaceMemberRole.OWNER)}
                    >
                      Owner
                    </MenuItem>
                    <MenuItem
                      onClick={() => setFilterRole(WorkspaceMemberRole.MEMBER)}
                    >
                      Member
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
            </Flex>

            {filteredMembers.map((member) => (
              <Flex
                key={member.userId}
                p={3}
                borderBottom="1px"
                borderColor="gray.200"
                align="center"
                justify="space-between"
              >
                <Flex align="center" gap={4} flex={1}>
                  <Checkbox
                    isChecked={selectedMembers.includes(member.userId)}
                    onChange={() => handleSelectMember(member.userId)}
                  />
                  <Avatar
                    size="sm"
                    name={member.user.name}
                    src={member.user.avatarUrl || undefined}
                  />
                  <Stack spacing={0}>
                    <Text fontWeight="medium">{member.user.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {member.user.email}
                    </Text>
                  </Stack>
                </Flex>

                <Flex gap={4} align="center">
                  <Menu>
                    <MenuButton
                      as={Button}
                      size="sm"
                      variant="outline"
                      rightIcon={<MdArrowDropDown />}
                      minW="120px"
                    >
                      {member.role === WorkspaceMemberRole.OWNER
                        ? 'Owner'
                        : 'Member'}
                    </MenuButton>
                    <MenuList>
                      <MenuItem
                        onClick={() =>
                          handleUpdateMemberRole(
                            member.userId,
                            member.user.name,
                            WorkspaceMemberRole.OWNER
                          )
                        }
                      >
                        Owner
                      </MenuItem>
                      <MenuItem
                        onClick={() =>
                          handleUpdateMemberRole(
                            member.userId,
                            member.user.name,
                            WorkspaceMemberRole.MEMBER
                          )
                        }
                      >
                        Member
                      </MenuItem>
                    </MenuList>
                  </Menu>
                  <Text fontSize="sm" color="gray.500" minW="40px">
                    0 roles
                  </Text>
                  <Text fontSize="sm" color="gray.500" minW="40px">
                    0 teams
                  </Text>
                  <IconButton
                    aria-label="Remove member"
                    icon={<FaTrash />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={(e) =>
                      handleRemoveMember(member.userId, member.user.name, e)
                    }
                  />
                </Flex>
              </Flex>
            ))}

            {filteredMembers.length === 0 && (
              <Box p={8} textAlign="center">
                <Text color="gray.500">No members found</Text>
              </Box>
            )}
          </Stack>
        </Box>
      </Container>

      <InviteWorkspaceMemberModal
        isOpen={isOpen}
        onClose={onClose}
        workspaceId={workspaceId}
        onSuccess={fetchMembers}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Remove Member</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to remove{' '}
              <strong>{pendingDelete?.memberName}</strong> from this workspace?
              This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmDelete}>
              Remove
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Role Change Confirmation Modal */}
      <Modal isOpen={isRoleChangeOpen} onClose={onRoleChangeClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Change Member Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to change{' '}
              <strong>{pendingRoleChange?.memberName}</strong>'s role to{' '}
              <strong>
                {pendingRoleChange?.newRole === WorkspaceMemberRole.OWNER
                  ? 'Owner'
                  : 'Member'}
              </strong>
              ?
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRoleChangeClose}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={confirmRoleChange}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </WorkspaceLayout>
  );
};

export default WorkspaceMembersPage;
