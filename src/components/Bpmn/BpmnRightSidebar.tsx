import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  IconButton,
  Text,
} from '@chakra-ui/react';
import { MdViewSidebar } from 'react-icons/md';
import PropertiesPanel from './PropertiesPanel/PropertiesPanel';
import CommentsPanel from './CommentsPanel/CommentsPanel';
import { useTranslation } from 'next-i18next';

interface BpmnRightSidebarProps {
  processID: string;
  activityItem?: any;
  isOpen: boolean;
  onClose: () => void;
  modelerRef?: any;
}

export default function BpmnRightSidebar({
  processID,
  activityItem,
  isOpen,
  onClose,
  modelerRef,
}: BpmnRightSidebarProps) {
  const { t } = useTranslation('studio');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    document.body.classList.add('is-resizing');
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.classList.remove('is-resizing');
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('is-resizing');
    };
  }, [isResizing]);

  // Extract selected element info from activityItem
  const selectedElementId = activityItem?.activityID;
  const selectedElementName = activityItem?.activityName;

  return (
    <Box position="relative" display="flex" height="100%">
      {/* Sidebar Content */}
      {/* Resize Handle */}
      {!isCollapsed && (
        <Box
          position="absolute"
          left="0"
          top="0"
          bottom="0"
          width="4px"
          cursor="ew-resize"
          bg={isResizing ? 'teal.400' : 'transparent'}
          _hover={{ bg: 'teal.200' }}
          onMouseDown={handleMouseDown}
          zIndex={21}
        />
      )}

      <Box
        ref={sidebarRef}
        width={isCollapsed ? '0px' : `${sidebarWidth}px`}
        transition={isResizing ? 'none' : 'width 0.3s ease'}
        overflow="hidden"
        height="100%"
        bg="white"
        borderLeft="1px solid"
        borderColor="gray.200"
        display="flex"
        flexDirection="column"
      >
        <Tabs
          index={activeTab}
          onChange={setActiveTab}
          isLazy
          display="flex"
          flexDirection="column"
          height="100%"
        >
          <TabList borderBottom="1px solid" borderColor="gray.200">
            <Tab
              _selected={{
                color: 'teal.600',
                borderBottom: '2px solid',
                borderColor: 'teal.600',
              }}
              fontWeight="medium"
              fontSize="sm"
            >
              {t('rightSidebar.properties')}
            </Tab>
            <Tab
              _selected={{
                color: 'teal.600',
                borderBottom: '2px solid',
                borderColor: 'teal.600',
              }}
              fontWeight="medium"
              fontSize="sm"
            >
              {t('rightSidebar.comments')}
            </Tab>
          </TabList>

          <TabPanels flex={1} overflow="auto" className="custom-scrollbar">
            <TabPanel p={0} height="100%">
              <PropertiesPanel
                processID={processID}
                activityItem={activityItem}
                isOpen={isOpen}
                onClose={onClose}
                modelerRef={modelerRef}
              />
            </TabPanel>
            <TabPanel p={0} height="100%">
              <CommentsPanel
                processID={processID}
                selectedElementId={selectedElementId}
                selectedElementName={selectedElementName}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Toggle Button - Sidebar icon on edge when collapsed */}
      {!isCollapsed && (
        <Box
          position="absolute"
          left="-35px"
          top="50%"
          transform="translateY(-50%)"
          zIndex={30}
        >
          <Flex
            direction="column"
            align="center"
            bg="pink.100"
            color="pink.700"
            py={3}
            px={2}
            cursor="pointer"
            borderRadius="md 0 0 md"
            boxShadow="md"
            _hover={{ bg: 'pink.200' }}
            onClick={() => setIsCollapsed(true)}
          >
            <MdViewSidebar size={20} />
            <Text
              fontSize="xs"
              fontWeight="medium"
              mt={2}
              style={{ writingMode: 'vertical-rl' }}
            >
              {t('rightSidebar.details')}
            </Text>
          </Flex>
        </Box>
      )}

      {/* Close button when expanded */}
      {isCollapsed && (
        <Box
          position="absolute"
          left="-40px"
          top="50%"
          transform="translateY(-50%)"
          zIndex={30}
        >
          <Flex
            direction="column"
            align="center"
            bg="pink.100"
            color="pink.700"
            py={3}
            px={2}
            cursor="pointer"
            borderRadius="md 0 0 md"
            boxShadow="md"
            _hover={{ bg: 'pink.200' }}
            onClick={() => setIsCollapsed(false)}
          >
            <MdViewSidebar size={20} />
            <Text
              fontSize="xs"
              fontWeight="medium"
              mt={2}
              style={{ writingMode: 'vertical-rl' }}
            >
              {t('rightSidebar.details')}
            </Text>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
