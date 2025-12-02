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
} from '@chakra-ui/react';
import { SearchIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import { Team } from '@/interfaces/workspace';
import workspaceApi from '@/apis/workspaceApi';
import CreateTeamModal from '@/components/Workspace/CreateTeamModal';
import { FaTrash } from 'react-icons/fa';

const TeamListPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const { workspaceId } = router.query as { workspaceId: string };
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();

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
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      await workspaceApi.deleteTeam(workspaceId, teamId);
      toast({
        title: 'Success',
        description: 'Team deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTeams();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to delete team',
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
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Teams</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Teams</Heading>
          <Button colorScheme="teal" onClick={onOpen}>
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
            >
              <Flex align="center" gap={4}>
                <Checkbox
                  isChecked={
                    selectedTeams.length === filteredTeams.length &&
                    filteredTeams.length > 0
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
                <Text fontWeight="medium" minW="120px" textAlign="right">
                  Members
                </Text>
                <Text fontWeight="medium" minW="100px" textAlign="right">
                  Teams
                </Text>
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
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                onClick={() => handleTeamClick(team.id)}
              >
                <Flex align="center" gap={4} flex={1}>
                  <Checkbox
                    isChecked={selectedTeams.includes(team.id)}
                    onChange={() => handleSelectTeam(team.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Stack spacing={0}>
                    <Text fontWeight="medium" color="teal.600">
                      {team.name}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {team.description || 'No description'}
                    </Text>
                  </Stack>
                </Flex>

                <Flex gap={8} align="center">
                  <Text minW="100px" textAlign="right" fontSize="sm">
                    {team.visibility === 'VISIBLE' ? 'Visible' : 'Secret'}
                  </Text>
                  <Text minW="120px" textAlign="right" fontSize="sm">
                    {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                  </Text>
                  <Flex minW="100px" justify="flex-end" gap={2}>
                    <Text fontSize="sm">
                      {team.roleCount} role{team.roleCount !== 1 ? 's' : ''}
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
    </SidebarContent>
  );
};

export default TeamListPage;
