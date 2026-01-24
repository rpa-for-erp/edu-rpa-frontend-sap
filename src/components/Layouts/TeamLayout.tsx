import {
  Box,
  useColorModeValue,
  Drawer,
  DrawerContent,
  useDisclosure,
} from '@chakra-ui/react';

import { FaRobot } from 'react-icons/fa';
import { RiFlowChart } from 'react-icons/ri';
import { IoIosRocket } from 'react-icons/io';
import { MdPeople, MdSettings, MdDashboard } from 'react-icons/md';
import { usePathname } from 'next/navigation';
import Navbar from '../Header/Navbar';
import SidebarList from '../Sidebar/SidebarList';
import { useSelector, useDispatch } from 'react-redux';
import { homeSelector } from '@/redux/selector';
import { setCurrentWorkspace } from '@/redux/slice/homeSlice';
import { useEffect, useMemo } from 'react';

const getTeamSidebarItems = (workspaceId: string, teamId: string) => [
  {
    path: `/workspace/${workspaceId}/teams/${teamId}`,
    name: 'Dashboard',
    icon: MdDashboard,
  },
  {
    path: `/workspace/${workspaceId}/teams/${teamId}/studio`,
    name: 'Studio',
    icon: RiFlowChart,
  },
  {
    path: `/workspace/${workspaceId}/teams/${teamId}/robot`,
    name: 'Robot',
    icon: FaRobot,
  },
  {
    path: `/workspace/${workspaceId}/teams/${teamId}/integration-service`,
    name: 'Integration Service',
    icon: IoIosRocket,
  },
  {
    path: `/workspace/${workspaceId}/teams/${teamId}/members`,
    name: 'Members',
    icon: MdPeople,
  },
];

interface Props {
  align?: string;
  pt?: string;
  children?: React.ReactNode;
}

const TeamLayout = ({ align = 'center', pt = '80px', children }: Props) => {
  const { isOpen, onClose } = useDisclosure();
  const pathName = usePathname();
  const dispatch = useDispatch();
  const { isHiddenSidebar, currentWorkspaceId } = useSelector(homeSelector);
  const sidebarWidth = isHiddenSidebar ? 81 : 250;

  // Sync workspace ID from URL on mount/navigation
  useEffect(() => {
    const workspaceMatch = pathName?.match(/^\/workspace\/([^\/]+)/);
    if (workspaceMatch && workspaceMatch[1] !== 'create') {
      const workspaceIdFromUrl = workspaceMatch[1];
      if (workspaceIdFromUrl !== currentWorkspaceId) {
        dispatch(setCurrentWorkspace(workspaceIdFromUrl));
      }
    }
  }, [pathName, dispatch, currentWorkspaceId]);

  // Extract teamId from URL
  const teamId = useMemo(() => {
    const teamMatch = pathName?.match(/\/teams\/([^\/]+)/);
    return teamMatch ? teamMatch[1] : null;
  }, [pathName]);

  // Team sidebar items
  const sidebarItems = useMemo(() => {
    return currentWorkspaceId && teamId
      ? getTeamSidebarItems(currentWorkspaceId, teamId)
      : [];
  }, [currentWorkspaceId, teamId]);

  return (
    <Box
      minH="100vh"
      bg={useColorModeValue('white', 'gray.900')}
      display="flex"
      overflow="hidden"
    >
      {/* Sidebar */}
      <SidebarList data={sidebarItems} path={pathName} onClose={onClose} />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarList data={sidebarItems} path={pathName} onClose={onClose} />
        </DrawerContent>
      </Drawer>

      <Box
        flex="1"
        overflowY="auto"
        overflowX="hidden"
        ml={{ base: 0, md: `${sidebarWidth}px` }}
        transition="margin-left 0.5s ease"
      >
        <Navbar />
        <Box flex="1" overflowY="auto" overflowX="hidden" pt={pt ? pt : '80px'}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default TeamLayout;
