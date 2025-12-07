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
} from '@chakra-ui/react';
import { SearchIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import WorkspaceLayout from '@/components/Layouts/WorkspaceLayout';
import { Team } from '@/interfaces/workspace';
import workspaceApi from '@/apis/workspaceApi';
import CreateTeamModal from '@/components/Workspace/CreateTeamModal';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal';
import { FaTrash } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { homeSelector } from '@/redux/selector';
import { COLORS } from '@/constants/colors';
import { MdArrowDropDown } from 'react-icons/md';

const TeamListPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const { workspaceId } = router.query as { workspaceId: string };
  const { workspaces } = useSelector(homeSelector);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMember, setFilterMember] = useState<string>('all');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const workspace = workspaces.find((w) => w.id === workspaceId);

  useEffect(() => {
    if (workspaceId) {
      fetchTeams();
    }
  }, [workspaceId]);

  useEffect(() => {
    const filtered = teams.filter((team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTeams(filtered);
  }, [searchQuery, teams]);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const data = await workspaceApi.getTeamsByWorkspace(workspaceId);
      setTeams(data);
      setFilteredTeams(data);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch teams',
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
      setSelectedTeams(filteredTeams.map((t) => t.id));
    } else {
      setSelectedTeams([]);
    }
  };

  const handleSelectTeam = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter((id) => id !== teamId));
    } else {
      setSelectedTeams([...selectedTeams, teamId]);
    }
  };

  const handleTeamClick = (teamId: string) => {
    router.push(`/workspace/${workspaceId}/teams/${teamId}`);
  };

  const handleDeleteTeam = async (teamId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingTeamId(teamId);
    onDeleteOpen();
  };

  const confirmDeleteTeam = async () => {
    if (!pendingTeamId) return;

    try {
      setIsSubmitting(true);
      await workspaceApi.deleteTeam(pendingTeamId);
      toast({
        title: 'Success',
        description: 'Team deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTeams();
      onDeleteClose();
      setPendingTeamId(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to delete team',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <BreadcrumbLink>Teams</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg" color={COLORS.primary}>
            Teams
          </Heading>
          <Button
            colorScheme="teal"
            onClick={() =>
              router.push(`/workspace/${workspaceId}/teams/create`)
            }
          >
            New Team
          </Button>
        </Flex>

        <Box bg="white" borderRadius="lg" shadow="sm" p={4}>
          <Flex justify="space-between" align="center" mb={4}>
            <InputGroup maxW="400px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Find a teams..."
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
              gap="auto"
            >
              <Flex align="center" gap={4} flex={1}>
                <Checkbox
                  isChecked={
                    selectedTeams.length === filteredTeams.length &&
                    filteredTeams.length > 0
                  }
                  onChange={handleSelectAll}
                />
                <Text fontWeight="medium">Select All</Text>
              </Flex>
            </Flex>

            {filteredTeams.map((team) => (
              <Flex
                key={team.id}
                p={3}
                borderBottom="1px"
                borderColor="gray.200"
                align="center"
                justify="space-between"
              >
                <Flex align="center" gap={4} flex={1}>
                  <Checkbox
                    isChecked={selectedTeams.includes(team.id)}
                    onChange={() => handleSelectTeam(team.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Avatar size="sm" name={team.name} />
                  <Stack spacing={0}>
                    <Text
                      fontWeight="medium"
                      color="teal.600"
                      cursor="pointer"
                      onClick={() => handleTeamClick(team.id)}
                    >
                      {team.name}
                    </Text>
                  </Stack>
                </Flex>

                <Flex gap={4} align="center">
                  <Text fontSize="sm" color="gray.500" textAlign="right">
                    {team.members?.length || 1} member
                    {team.members?.length !== 1 ? 's' : ''}
                  </Text>
                  <Text fontSize="sm" color="gray.500" textAlign="right">
                    0 roles
                  </Text>
                  <Text fontSize="sm" color="gray.500" textAlign="right">
                    0 teams
                  </Text>
                  <IconButton
                    aria-label="Delete"
                    icon={<FaTrash />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={(e) => handleDeleteTeam(team.id, e)}
                  />
                </Flex>
              </Flex>
            ))}

            {filteredTeams.length === 0 && !isLoading && (
              <Box p={8} textAlign="center">
                <Text color="gray.500">No teams found</Text>
              </Box>
            )}
          </Stack>
        </Box>
      </Container>

      <CreateTeamModal
        isOpen={isOpen}
        onClose={onClose}
        workspaceId={workspaceId}
        onSuccess={fetchTeams}
      />

      <ConfirmModal
        title="Delete Team"
        content="delete this team"
        isOpen={isDeleteOpen}
        isLoading={isSubmitting}
        onClose={onDeleteClose}
        onConfirm={confirmDeleteTeam}
      />
    </WorkspaceLayout>
  );
};

export default TeamListPage;
