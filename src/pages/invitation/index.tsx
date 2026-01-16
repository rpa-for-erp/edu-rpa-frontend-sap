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
  useToast,
  Badge,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import {
  InvitationResponse,
  TeamInvitation,
  WorkspaceInvitation,
  InvitationStatus,
} from '@/interfaces/workspace';
import workspaceApi from '@/apis/workspaceApi';
import { GetServerSideProps } from 'next';
import { getServerSideTranslations } from '@/utils/i18n';
import { MdArrowDropDown } from 'react-icons/md';
import { COLORS } from '@/constants/colors';

const InvitationPage: React.FC = () => {
  const toast = useToast();
  const [invitations, setInvitations] = useState<InvitationResponse>({
    teamInvitations: [],
    workspaceInvitations: [],
  });
  const [filteredInvitations, setFilteredInvitations] = useState<
    (TeamInvitation | WorkspaceInvitation)[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvitations, setSelectedInvitations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'team' | 'workspace'>(
    'all'
  );

  useEffect(() => {
    fetchInvitations();
  }, []);

  useEffect(() => {
    const allInvitations = [
      ...invitations.teamInvitations,
      ...invitations.workspaceInvitations,
    ];

    let filtered = allInvitations.filter((inv) => {
      const searchText = searchQuery.toLowerCase();
      if ('team' in inv) {
        return (
          inv.team.name.toLowerCase().includes(searchText) ||
          inv.invitedBy.name.toLowerCase().includes(searchText)
        );
      } else {
        return (
          inv.workspace.name.toLowerCase().includes(searchText) ||
          inv.invitedBy.name.toLowerCase().includes(searchText)
        );
      }
    });

    if (filterType === 'team') {
      filtered = filtered.filter((inv) => 'team' in inv);
    } else if (filterType === 'workspace') {
      filtered = filtered.filter((inv) => 'workspace' in inv);
    }

    setFilteredInvitations(filtered);
  }, [searchQuery, invitations, filterType]);

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const data = await workspaceApi.getMyInvitations();
      setInvitations(data);
      console.log(data);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invitations',
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
      setSelectedInvitations(filteredInvitations.map((inv) => inv.id));
    } else {
      setSelectedInvitations([]);
    }
  };

  const handleSelectInvitation = (invitationId: string) => {
    if (selectedInvitations.includes(invitationId)) {
      setSelectedInvitations(
        selectedInvitations.filter((id) => id !== invitationId)
      );
    } else {
      setSelectedInvitations([...selectedInvitations, invitationId]);
    }
  };

  const handleAccept = async (
    invitation: TeamInvitation | WorkspaceInvitation
  ) => {
    try {
      await workspaceApi.respondToInvitation({
        invitationId: invitation.id,
        status: InvitationStatus.ACCEPTED,
      });
      toast({
        title: 'Success',
        description: 'Invitation accepted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchInvitations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || 'Failed to accept invitation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDecline = async (
    invitation: TeamInvitation | WorkspaceInvitation
  ) => {
    try {
      await workspaceApi.respondToInvitation({
        invitationId: invitation.id,
        status: InvitationStatus.REJECTED,
      });
      toast({
        title: 'Success',
        description: 'Invitation declined',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchInvitations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || 'Failed to decline invitation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: InvitationStatus) => {
    switch (status) {
      case InvitationStatus.PENDING:
        return 'yellow';
      case InvitationStatus.ACCEPTED:
        return 'green';
      case InvitationStatus.REJECTED:
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <SidebarContent>
      <Container maxW="container.xl" py={5}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Invitations</Heading>
          <Button
            colorScheme="teal"
            onClick={fetchInvitations}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        </Flex>

        <Box bg="white" borderRadius="lg" shadow="sm" p={4}>
          <Flex justify="space-between" align="center" mb={4}>
            <InputGroup maxW="400px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Find an invitation..."
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
                    selectedInvitations.length === filteredInvitations.length &&
                    filteredInvitations.length > 0
                  }
                  onChange={handleSelectAll}
                >
                  Select All
                </Checkbox>
              </Flex>
              <Flex gap={8} align="center">
                <Menu strategy="fixed" placement="bottom-end">
                  <MenuButton _hover={{ opacity: 0.8 }}>
                    <Flex align="center" gap={1}>
                      <Text fontWeight="medium" minW="100px" textAlign="right">
                        {filterType.charAt(0).toUpperCase() +
                          filterType.slice(1)}
                      </Text>
                      <MdArrowDropDown size={24} />
                    </Flex>
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => setFilterType('all')}>
                      All
                    </MenuItem>
                    <MenuItem onClick={() => setFilterType('team')}>
                      Team
                    </MenuItem>
                    <MenuItem onClick={() => setFilterType('workspace')}>
                      Workspace
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
            </Flex>

            {filteredInvitations.map((invitation) => {
              const isTeamInvitation = 'team' in invitation;
              const name = isTeamInvitation
                ? (invitation as TeamInvitation).team.name
                : (invitation as WorkspaceInvitation).workspace.name;
              const workspaceName = isTeamInvitation
                ? (invitation as TeamInvitation).team.workspace.name
                : null;

              return (
                <Flex
                  key={invitation.id}
                  p={3}
                  borderBottom="1px"
                  borderColor="gray.200"
                  align="center"
                  justify="space-between"
                >
                  <Flex align="center" gap={4} flex={1}>
                    <Checkbox
                      isChecked={selectedInvitations.includes(invitation.id)}
                      onChange={() => handleSelectInvitation(invitation.id)}
                    />
                    <Avatar
                      size="sm"
                      name={invitation.invitedBy.name}
                      src={invitation.invitedBy.avatarUrl}
                    />
                    <Stack spacing={0}>
                      <Flex align="center" gap={2}>
                        <Text fontWeight="medium">
                          {invitation.invitedBy.name}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          invited you to
                        </Text>
                        <Badge
                          colorScheme={isTeamInvitation ? 'purple' : 'blue'}
                        >
                          {isTeamInvitation ? 'Team' : 'Workspace'}
                        </Badge>
                      </Flex>
                      <Text fontSize="sm" fontWeight="medium" color="teal.600">
                        {name}
                      </Text>
                      {workspaceName && (
                        <Text fontSize="xs" color="gray.500">
                          in workspace: {workspaceName}
                        </Text>
                      )}
                    </Stack>
                  </Flex>

                  <Flex gap={4} align="center">
                    <Badge colorScheme={getStatusColor(invitation.status)}>
                      {invitation.status}
                    </Badge>
                    {invitation.status === InvitationStatus.PENDING && (
                      <Flex gap={2}>
                        <Button
                          size="sm"
                          colorScheme="teal"
                          onClick={() => handleAccept(invitation)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleDecline(invitation)}
                        >
                          Refuse
                        </Button>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              );
            })}

            {filteredInvitations.length === 0 && !isLoading && (
              <Box p={8} textAlign="center">
                <Text color="gray.500">No invitations found</Text>
              </Box>
            )}
          </Stack>
        </Box>
      </Container>
    </SidebarContent>
  );
};

export default InvitationPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      ...(await getServerSideTranslations(context, ['common', 'sidebar', 'navbar'])),
    },
  };
};
