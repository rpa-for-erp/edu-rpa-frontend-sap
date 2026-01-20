import workspaceApi from '@/apis/workspaceApi';
import LoadingIndicator from '@/components/LoadingIndicator/LoadingIndicator';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import WorkspaceLayout from '@/components/Layouts/WorkspaceLayout';
import { QUERY_KEY } from '@/constants/queryKey';
import { SearchIcon, RepeatIcon, QuestionIcon } from '@chakra-ui/icons';
import {
  Box,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import RobotTable from '@/components/Robot/RobotTable';
import { Robot } from '@/interfaces/robot';
import { toastError } from '@/utils/common';
import { ToolTipExplain } from '@/constants/description';
import { formatDateTime } from '@/utils/time';

export default function WorkspaceRobotPage() {
  const router = useRouter();
  const { workspaceId } = router.query;
  const [nameFilter, setNameFilter] = useState('');
  const toast = useToast();

  const { data: countRobot, isLoading: countRobotLoading } = useQuery({
    queryKey: [QUERY_KEY.ROBOT_COUNT, workspaceId],
    queryFn: () => workspaceApi.getWorkspaceRobotCount(workspaceId as string),
    enabled: !!workspaceId,
  });

  // TODO: update pagination
  const limit = countRobot ?? 0;
  const page = 1;

  const { data: allRobot, isLoading: isLoadingRobot } = useQuery({
    queryKey: [QUERY_KEY.ROBOT_LIST, workspaceId],
    queryFn: () => workspaceApi.getWorkspaceRobots(workspaceId as string, limit, page),
    enabled: !!workspaceId,
  });

  const fetchData = async () => {
    // TODO: implement refresh functionallity
    toastError(toast, 'Refresh functionallity is not implemented yet');
  };

  if (isLoadingRobot || countRobotLoading) {
    return (
      <WorkspaceLayout>
        <LoadingIndicator />
      </WorkspaceLayout>
    );
  }

  const formatData: Omit<Robot, 'userId'>[] =
    allRobot &&
    allRobot.map((item: any) => {
      return {
        name: item.name,
        processId: item.processId,
        processVersion: item.processVersion,
        createdAt: formatDateTime(item.createdAt),
        triggerType: item.triggerType,
        robotKey: item.robotKey,
      };
    });

  const tableProps = {
    header: [
      'Robot Name',
      'Process ID',
      'Process Version',
      'Created At',
      'Trigger Type',
      'Status',
      'Actions',
    ],
    data: formatData ?? [],
  };

  return (
    <WorkspaceLayout>
      <div className="mb-[200px]">
        <SidebarContent>
          <div className="flex flex-start">
            <h1 className="pl-[20px] pr-[10px] ml-[35px] font-bold text-2xl text-[#319795]">
              Robot List
            </h1>
            <Tooltip
              hasArrow
              label={ToolTipExplain.ROBOT_SERVICE}
              bg="gray.300"
              color="black">
              <QuestionIcon color="blue.500" />
            </Tooltip>
          </div>
          <div className="w-90 mx-auto my-[30px]">
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.500" />
              </InputLeftElement>
              <Input
                width="30vw"
                bg="white.300"
                type="text"
                placeholder="Search by robot name"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
              <Box className="w-[15vw] ml-[20px]">
                <IconButton
                  aria-label="Refresh"
                  icon={<RepeatIcon />}
                  onClick={fetchData}
                />
              </Box>
            </InputGroup>
          </div>

          {tableProps.data.length === 0 && (
            <div className="w-90 m-auto flex justify-center items-center">
              <div className="text-center">
                <div className="text-2xl font-bold">No robots here</div>
                <div className="text-gray-500">
                  Publish a robot from your existing processes.
                </div>
              </div>
            </div>
          )}

          <div className="w-90 m-auto">
            <RobotTable header={tableProps.header} data={tableProps.data} />
          </div>
        </SidebarContent>
      </div>
    </WorkspaceLayout>
  );
}
