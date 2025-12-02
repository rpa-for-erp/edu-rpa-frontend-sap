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
import { MdWorkspaces } from 'react-icons/md';
import { usePathname } from 'next/navigation';
import Navbar from '../Header/Navbar';
import SidebarList from './SidebarList';
import { useSelector } from 'react-redux';
import { homeSelector } from '@/redux/selector';

const sidebarItems = [
  { path: '/home', name: 'Home', icon: FaHome },
  { path: '/studio', name: 'Studio', icon: RiFlowChart },
  { path: '/robot', name: 'Robot', icon: FaRobot },
  {
    path: '/integration-service',
    name: 'Integration Service',
    icon: IoIosRocket,
  },
  { path: '/storage', name: 'Storage', icon: FaFile },
  {
    path: '/document-template',
    name: 'Document Template',
    icon: FaFileInvoice,
  },
  { path: '/workspace', name: 'Workspace', icon: MdWorkspaces },
];

interface Props {
  children?: React.ReactNode;
}

const Sidebar = ({ children }: Props) => {
  const { isOpen, onClose } = useDisclosure();
  const pathName = usePathname();
  const { isHiddenSidebar } = useSelector(homeSelector);
  const sidebarWidth = isHiddenSidebar ? 81 : 250;

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
