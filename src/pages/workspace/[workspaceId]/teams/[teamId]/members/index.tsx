import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Flex,
  Spinner,
  Avatar,
  Badge,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import TeamLayout from '@/components/Layouts/TeamLayout';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';

export default function TeamMembersPage() {
  const router = useRouter();
  const { workspaceId, teamId } = router.query;
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: Fetch team members from API
  const members: any[] = [];
  const isLoading = false;

  const filteredMembers = members.filter((member: any) =>
    member.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TeamLayout>
      <div className="mb-[200px]">
        <SidebarContent>
          <h1 className="pl-[20px] ml-[35px] font-bold text-2xl text-[#319795]">
            Team Members
          </h1>

          <div className="w-90 mx-auto my-[30px]">
            <InputGroup maxW="400px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.500" />
              </InputLeftElement>
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="white"
              />
            </InputGroup>
          </div>

          <div className="w-90 mx-auto">
            {isLoading ? (
              <Flex justify="center" py={10}>
                <Spinner size="xl" color="teal.500" />
              </Flex>
            ) : filteredMembers.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text fontSize="xl" fontWeight="bold">
                  No members found
                </Text>
                <Text color="gray.500" mt={2}>
                  No members in this team
                </Text>
              </Box>
            ) : (
              <Box
                border="1px solid"
                borderColor="#319795"
                borderRadius="15px"
                overflow="hidden"
              >
                <Table variant="simple">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Member</Th>
                      <Th>Email</Th>
                      <Th>Role</Th>
                      <Th>Joined At</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredMembers.map((member: any) => (
                      <Tr key={member.userId}>
                        <Td>
                          <Flex align="center" gap={3}>
                            <Avatar size="sm" name={member.name} />
                            <Text fontWeight="medium">{member.name}</Text>
                          </Flex>
                        </Td>
                        <Td color="gray.600">{member.email}</Td>
                        <Td>
                          <Badge colorScheme="purple">{member.role?.name}</Badge>
                        </Td>
                        <Td>{member.joinedAt}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </div>
        </SidebarContent>
      </div>
    </TeamLayout>
  );
}
