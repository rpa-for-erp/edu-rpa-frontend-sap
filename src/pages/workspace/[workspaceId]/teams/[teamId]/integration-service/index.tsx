import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { SearchIcon, QuestionIcon } from '@chakra-ui/icons';
import TeamLayout from '@/components/Layouts/TeamLayout';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import ConnectionTable from '@/components/Connection/ConnectionTable';
import { useTeamConnections } from '@/hooks/useTeam';
import { ToolTipExplain } from '@/constants/description';

const PROVIDERS = [
  { value: '', label: 'All' },
  { value: 'gmail', label: 'Gmail' },
  { value: 'drive', label: 'Google Drive' },
  { value: 'sheets', label: 'Google Sheets' },
  { value: 'moodle', label: 'Moodle' },
  { value: 'slack', label: 'Slack' },
  { value: 'teams', label: 'Microsoft Teams' },
];

export default function TeamConnectionsPage() {
  const router = useRouter();
  const { workspaceId, teamId } = router.query;
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('');

  const { data: connections, isLoading } = useTeamConnections(
    teamId as string,
    providerFilter || undefined
  );

  const connectionData = connections || [];

  const tableProps = {
    header: ['Service', 'Connection name', 'Created at', 'Status', 'Action'],
    data: connectionData,
  };

  return (
    <TeamLayout>
      <div className="mb-[200px]">
        <SidebarContent>
          <div className="flex flex-start items-center">
            <h1 className="pl-[20px] pr-[10px] ml-[35px] font-bold text-2xl text-[#319795]">
              Team Integration Service
            </h1>
            <Tooltip
              hasArrow
              label={ToolTipExplain.CONNECTION_SERVICE}
              bg="gray.300"
              color="black"
            >
              <QuestionIcon color="blue.500" />
            </Tooltip>
          </div>

          <div className="w-90 mx-auto my-[30px]">
            <Alert status="info" borderRadius="md" mb={4}>
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Read-Only Access</AlertTitle>
                <AlertDescription>
                  Team connections are managed at the workspace level. Contact
                  your workspace administrator to create or modify connections.
                </AlertDescription>
              </Box>
            </Alert>

            <div className="flex justify-between items-center gap-[10px]">
              <InputGroup width="320px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.500" />
                </InputLeftElement>
                <Input
                  bg="white"
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>

              <Box>
                <Select
                  width="180px"
                  bg="white"
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                >
                  {PROVIDERS.map((provider) => (
                    <option key={provider.value} value={provider.value}>
                      {provider.label}
                    </option>
                  ))}
                </Select>
              </Box>
            </div>
          </div>

          <div className="w-90 mx-auto">
            <ConnectionTable
              header={tableProps.header}
              data={tableProps.data}
              isLoading={isLoading}
              readOnly={true}
            />
          </div>

          {tableProps.data.length === 0 && !isLoading && (
            <div className="w-90 m-auto flex justify-center items-center mt-10">
              <div className="text-center">
                <div className="text-2xl font-bold">No connections here</div>
                <div className="text-gray-500">
                  Contact your workspace administrator to set up connections
                </div>
              </div>
            </div>
          )}
        </SidebarContent>
      </div>
    </TeamLayout>
  );
}
