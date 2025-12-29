import {
  Box,
  useColorModeValue,
  Drawer,
  DrawerContent,
  useDisclosure,
  Button,
} from '@chakra-ui/react';

import { FaHome, FaRobot, FaFileInvoice } from 'react-icons/fa';
import { RiFlowChart } from 'react-icons/ri';
import { IoIosRocket } from 'react-icons/io';
import { FaFile } from 'react-icons/fa6';
import { MdWorkspaces, MdGroups, MdPeople } from 'react-icons/md';
import { usePathname } from 'next/navigation';
import Navbar from '../Header/Navbar';
import SidebarList from './SidebarList';
import { useSelector, useDispatch } from 'react-redux';
import { homeSelector } from '@/redux/selector';
import {
  setCurrentWorkspace,
  clearCurrentWorkspace,
} from '@/redux/slice/homeSlice';
import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'next-i18next';

interface Props {
  children?: React.ReactNode;
}

const Sidebar = ({ children }: Props) => {
  const { t } = useTranslation('sidebar');
  const { isOpen, onClose } = useDisclosure();
  const pathName = usePathname();
  const dispatch = useDispatch();
  const { isHiddenSidebar, currentWorkspaceId } = useSelector(homeSelector);
  const sidebarWidth = isHiddenSidebar ? 81 : 250;

  const personalSidebarItems = [
    { path: '/home', name: t('home'), icon: FaHome },
    { path: '/studio', name: t('studio'), icon: RiFlowChart },
    { path: '/robot', name: t('robot'), icon: FaRobot },
    {
      path: '/integration-service',
      name: t('integrationService'),
      icon: IoIosRocket,
    },
    { path: '/storage', name: t('storage'), icon: FaFile },
    {
      path: '/document-template',
      name: t('documentTemplate'),
      icon: FaFileInvoice,
    },
    { path: '/workspace', name: t('workspace'), icon: MdWorkspaces },
  ];

  // Clear workspace ID when navigating to personal routes
  useEffect(() => {
    if (!pathName?.startsWith('/workspace/') && currentWorkspaceId) {
      dispatch(clearCurrentWorkspace());
    }
  }, [pathName, dispatch, currentWorkspaceId]);

  // Always use personal sidebar items in this layout
  const sidebarItems = personalSidebarItems;

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
        <Box flex="1" overflowY="auto" overflowX="hidden" pt="80px">
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
