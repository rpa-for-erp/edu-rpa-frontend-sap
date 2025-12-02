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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Select,
} from '@chakra-ui/react';
import { SearchIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import { Team, TeamMember, Role } from '@/interfaces/workspace';
import workspaceApi from '@/apis/workspaceApi';
import InviteMemberModal from '@/components/Workspace/InviteMemberModal';
import CreateRoleModal from '@/components/Workspace/CreateRoleModal';
import { FaTrash, FaEdit, FaEllipsisV } from 'react-icons/fa';

const TeamDetailPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const { workspaceId, teamId } = router.query as {
    workspaceId: string;
    teamId: string;
  };
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [filterRole, setFilterRole] = useState<string>('all');
  const {
    isOpen: isInviteOpen,
    onOpen: onInviteOpen,
    onClose: onInviteClose,
  } = useDisclosure();
  const {
    isOpen: isRoleOpen,
    onOpen: onRoleOpen,
    onClose: onRoleClose,
  } = useDisclosure();

  useEffect(() => {
    if (workspaceId && teamId) {
      fetchTeamData();
      fetchMembers();
      fetchRoles();
    }
  }, [workspaceId, teamId]);

  useEffect(() => {
    let filtered = members.filter(
      (member) =>
        member.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterRole !== 'all') {
      filtered = filtered.filter((member) => member.roleId === filterRole);
    }

    setFilteredMembers(filtered);
  }, [searchQuery, members, filterRole]);

  const fetchTeamData = async () => {
    try {
      const data = await workspaceApi.getTeamById(workspaceId, teamId);
      setTeam(data);
    } catch (error) {
      console.error('Failed to fetch team:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await workspaceApi.getTeamMembers(workspaceId, teamId);
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

  const fetchRoles = async () => {
    try {
      const data = await workspaceApi.getRolesByTeam(workspaceId, teamId);
      setRoles(data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedMembers(filteredMembers.map((m) => m.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSelectMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleRemoveMember = async (memberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await workspaceApi.removeTeamMember(workspaceId, teamId, memberId);
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
    }
  };

  const handleUpdateMemberRole = async (memberId: string, roleId: string) => {
    try {
      await workspaceApi.updateTeamMemberRole(workspaceId, teamId, memberId, {
        roleId,
      });
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
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      await workspaceApi.deleteRole(workspaceId, teamId, roleId);
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchRoles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to delete role',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <SidebarContent>
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
              onClick={() => router.push(`/workspace/${workspaceId}/teams`)}
            >
              Teams
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>{team?.name || 'Team'}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        {/* Team Header */}
        <Box bg="white" borderRadius="lg" shadow="sm" p={6} mb={6}>
          <Flex justify="space-between" align="center">
            <Stack spacing={1}>
              <Heading size="lg">{team?.name}</Heading>
              <Text color="gray.500">
                {team?.description || 'This team has no description'}
              </Text>
            </Stack>
            <Button
              colorScheme="gray"
              variant="outline"
              onClick={() => router.back()}
            >
              BACK
            </Button>
          </Flex>
        </Box>

        {/* Members Section */}
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Members</Heading>
          <Button colorScheme="teal" onClick={onInviteOpen}>
            Add a member
          </Button>
        </Flex>

        <Box bg="white" borderRadius="lg" shadow="sm" p={4} mb={8}>
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
            <Select
              maxW="200px"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
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
                    selectedMembers.length === filteredMembers.length &&
                    filteredMembers.length > 0
                  }
                  onChange={handleSelectAll}
                >
                  Select All
                </Checkbox>
              </Flex>
              <Text fontWeight="medium" minW="150px" textAlign="right">
                Roles
              </Text>
            </Flex>

            {filteredMembers.map((member) => (
              <Flex
                key={member.id}
                p={3}
                borderBottom="1px"
                borderColor="gray.200"
                align="center"
                justify="space-between"
              >
                <Flex align="center" gap={4} flex={1}>
                  <Checkbox
                    isChecked={selectedMembers.includes(member.id)}
                    onChange={() => handleSelectMember(member.id)}
                  />
                  <Avatar
                    size="sm"
                    name={member.userName}
                    src={member.userAvatar}
                  />
                  <Stack spacing={0}>
                    <Text fontWeight="medium">{member.userName}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {member.userEmail}
                    </Text>
                  </Stack>
                </Flex>

                <Flex gap={4} align="center">
                  <Select
                    size="sm"
                    minW="150px"
                    value={member.roleId || ''}
                    onChange={(e) =>
                      handleUpdateMemberRole(member.id, e.target.value)
                    }
                  >
                    <option value="">No Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </Select>
                  <IconButton
                    aria-label="Remove member"
                    icon={<FaTrash />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={(e) => handleRemoveMember(member.id, e)}
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

        {/* Roles Section */}
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Roles</Heading>
          <Button colorScheme="teal" onClick={onRoleOpen}>
            Create new role
          </Button>
        </Flex>

        <Box bg="white" borderRadius="lg" shadow="sm" p={4}>
          <Stack spacing={0}>
            <Flex
              bg="gray.100"
              p={3}
              borderTopRadius="md"
              align="center"
              justify="space-between"
            >
              <Text fontWeight="medium">Role Name</Text>
              <Text fontWeight="medium">Roles</Text>
            </Flex>

            {roles.map((role) => (
              <Flex
                key={role.id}
                p={3}
                borderBottom="1px"
                borderColor="gray.200"
                align="center"
                justify="space-between"
              >
                <Stack spacing={0} flex={1}>
                  <Text fontWeight="medium">{role.name}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {role.description || 'No description'}
                  </Text>
                </Stack>

                <Flex gap={2}>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<FaEllipsisV />}
                      variant="ghost"
                      size="sm"
                    />
                    <MenuList>
                      <MenuItem icon={<FaEdit />}>Edit</MenuItem>
                      <MenuItem
                        icon={<FaTrash />}
                        color="red.500"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </Flex>
            ))}

            {roles.length === 0 && (
              <Box p={8} textAlign="center">
                <Text color="gray.500">No roles found</Text>
              </Box>
            )}
          </Stack>
        </Box>
      </Container>

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={onInviteClose}
        workspaceId={workspaceId}
        teamId={teamId}
        onSuccess={fetchMembers}
      />

      <CreateRoleModal
        isOpen={isRoleOpen}
        onClose={onRoleClose}
        workspaceId={workspaceId}
        teamId={teamId}
        onSuccess={fetchRoles}
      />
    </SidebarContent>
  );
};

export default TeamDetailPage;
