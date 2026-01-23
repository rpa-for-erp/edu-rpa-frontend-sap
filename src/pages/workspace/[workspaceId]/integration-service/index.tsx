import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Tooltip,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { QuestionIcon, SearchIcon } from '@chakra-ui/icons';
import WorkspaceLayout from '@/components/Layouts/WorkspaceLayout';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import ConnectionTable from '@/components/Connection/ConnectionTable';
import CreateNewConnectionModal from '@/components/Connection/CreateNewConnectionModal';
import {
  useWorkspaceConnections,
} from '@/hooks/useWorkspaceConnections';
import { AuthorizationProvider } from '@/types/workspaceConnection';
import { ToolTipExplain } from '@/constants/description';

export default function WorkspaceIntegrationService() {
  const router = useRouter();
  const { workspaceId } = router.query;
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [providerFilter, setProviderFilter] = useState('');
  const [connectionData, setConnectionData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: connections, isLoading: isFetching, refetch } = useWorkspaceConnections(
    workspaceId as string,
    providerFilter as AuthorizationProvider
  );

  useEffect(() => {
    if (connections) {
      setConnectionData(connections);
    }
  }, [connections]);

  useEffect(() => {
    setIsLoading(isFetching);
  }, [isFetching]);

  // Handle OAuth callback messages
  useEffect(() => {
    const errorMessage = router.query.error;
    const successMessage = router.query.message;

    if (errorMessage) {
      toast({
        title: `Error: ${errorMessage}`,
        status: 'error',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
      // Clean up URL
      router.replace(router.pathname, undefined, { shallow: true });
    }

    if (successMessage) {
      toast({
        title: `Success: ${successMessage}`,
        status: 'success',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
      // Refresh connections
      refetch();
      // Clean up URL
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query.error, router.query.message]);

  const tableProps = {
    header: ['Service', 'Connection name', 'Created at', 'Status', 'Action'],
    data: connectionData,
  };

  const handleSuccess = async () => {
    setIsLoading(true);
    try {
      await refetch();
      toast({
        title: 'Connection list refreshed',
        status: 'success',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to refresh connections',
        status: 'error',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
    }
    setIsLoading(false);
  };

  return (
    <WorkspaceLayout>
      <div className="mb-[200px]">
        <SidebarContent>
          <div className="flex flex-start">
            <h1 className="pl-[20px] pr-[10px] ml-[35px] font-bold text-2xl text-[#319795]">
              Connection List
            </h1>
            <Tooltip
              hasArrow
              label={ToolTipExplain.INTERGRATION_SERVICE}
              bg="gray.300"
              color="black">
              <QuestionIcon color="blue.500" />
            </Tooltip>
          </div>

          <div className="flex justify-between w-90 mx-auto my-[30px]">
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.500" />
              </InputLeftElement>
              <Input
                width="40vw"
                bg="white.300"
                type="text"
                placeholder="Search..."
              />
              <Box className="w-[15vw] ml-[20px]">
                <Select
                  defaultValue=""
                  onChange={(e) => {
                    setProviderFilter(e.target.value);
                    router.push({
                      pathname: router.pathname,
                      query: { ...router.query, provider: e.target.value },
                    });
                  }}>
                  <option value="">All services</option>
                  {Object.values(AuthorizationProvider).map((provider) => {
                    return (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    );
                  })}
                </Select>
              </Box>
            </InputGroup>
            <div className="flex justify-between gap-[10px]">
              <Button colorScheme="teal" bg={'teal'} onClick={onOpen}>
                New Connection
              </Button>
            </div>

            <CreateNewConnectionModal 
              isOpen={isOpen} 
              onClose={onClose}
              workspaceId={workspaceId as string}
              onSuccess={handleSuccess}
            />
          </div>

          {tableProps.data.length > 0 ? (
            <div className="w-90 m-auto">
              <ConnectionTable {...tableProps} isLoading={isLoading} />
            </div>
          ) : (
            <div className="w-90 m-auto flex justify-center items-center">
              <div className="text-center">
                <div className="text-2xl font-bold">No connections</div>
                <div className="text-gray-500">
                  Create a new connection to help you integrate with other
                  services
                </div>
              </div>
            </div>
          )}
        </SidebarContent>
      </div>
    </WorkspaceLayout>
  );
}
