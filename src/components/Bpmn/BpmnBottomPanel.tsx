import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Badge,
} from '@chakra-ui/react';
import { ChevronUpIcon } from '@chakra-ui/icons';
import VariablesPanel from './VariablesPanel/VariablesPanel';
import { useTranslation } from 'next-i18next';
import ProblemsPanel, { Problem, getErrorCount } from "./ProblemsPanel/ProblemsPanel";
import ExecutionLogsPanel from "./ExecutionLogsPanel";
import { useProblemTracker } from "@/hooks/useProblemTracker";
import { RobotLogEntry } from "@/contexts/RobotTrackingContext";

interface BpmnBottomPanelProps {
  processID: string;
  modelerRef?: any;
  // Robot tracking logs
  executionLogs?: RobotLogEntry[];
  selectedLog?: RobotLogEntry | null;
  onSelectLog?: (log: RobotLogEntry) => void;
}

const MIN_HEIGHT = 150;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 300;

export default function BpmnBottomPanel({ 
  processID, 
  modelerRef,
  executionLogs = [],
  selectedLog = null,
  onSelectLog,
}: BpmnBottomPanelProps) {
  const { t } = useTranslation('studio');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  
  // Track problems using hook - includes both activity validation and bpmnlint issues
  const problems = useProblemTracker(processID, modelerRef);
  const errorCount = getErrorCount(problems);
  const logsCount = executionLogs.length;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startYRef.current = e.clientY;
      startHeightRef.current = panelHeight;
    },
    [panelHeight]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaY = startYRef.current - e.clientY;
      const newHeight = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, startHeightRef.current + deltaY)
      );
      setPanelHeight(newHeight);
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Auto-switch to Logs tab when new logs come in
  useEffect(() => {
    if (executionLogs.length > 0 && activeTab !== 1) {
      // Optionally auto-open and switch to logs tab
      // setActiveTab(1);
      // setIsOpen(true);
    }
  }, [executionLogs.length]);

  const handleSelectLog = (log: RobotLogEntry) => {
    onSelectLog?.(log);
  };

  return (
    <Box
      position="relative"
      bg="white"
      borderTop="1px solid"
      borderColor="gray.200"
    >
      {/* Tab Header - Always visible */}
      <Flex
        align="center"
        justify="space-between"
        px={4}
        py={1}
        cursor="pointer"
        onClick={() => setIsOpen(!isOpen)}
        _hover={{ bg: 'gray.50' }}
      >
        <Tabs
          index={activeTab}
          onChange={setActiveTab}
          size="sm"
          variant="unstyled"
        >
          <TabList>
            <Tab
              _selected={{
                color: 'teal.600',
                borderBottom: '2px solid',
                borderColor: 'teal.600',
              }}
              fontSize="sm"
              fontWeight="medium"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
              }}
            >
              <Flex align="center" gap={2}>
                <Text>Problems</Text>
                {errorCount > 0 && (
                  <Badge
                    bg="red.500"
                    color="white"
                    borderRadius="full"
                    fontSize="xs"
                    px={1.5}
                    minW="18px"
                    h="18px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {errorCount}
                  </Badge>
                )}
              </Flex>
            </Tab>
            <Tab
              _selected={{
                color: 'teal.600',
                borderBottom: '2px solid',
                borderColor: 'teal.600',
              }}
              fontSize="sm"
              fontWeight="medium"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
              }}
            >
              <Flex align="center" gap={2}>
                <Text>Logs</Text>
                {logsCount > 0 && (
                  <Badge
                    bg="blue.500"
                    color="white"
                    borderRadius="full"
                    fontSize="xs"
                    px={1.5}
                    minW="18px"
                    h="18px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {logsCount}
                  </Badge>
                )}
              </Flex>
            </Tab>
            <Tab
              _selected={{
                color: 'teal.600',
                borderBottom: '2px solid',
                borderColor: 'teal.600',
              }}
              fontSize="sm"
              fontWeight="medium"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
              }}
            >
              {t('bottomPanel.variables')}
            </Tab>
            <Tab
              _selected={{
                color: 'teal.600',
                borderBottom: '2px solid',
                borderColor: 'teal.600',
              }}
              fontSize="sm"
              fontWeight="medium"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
              }}
            >
              {t('bottomPanel.connections')}
            </Tab>
          </TabList>
        </Tabs>

        <IconButton
          aria-label={
            isOpen
              ? t('bottomPanel.collapsePanel')
              : t('bottomPanel.expandPanel')
          }
          icon={
            <Box
              as="span"
              transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
              transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <ChevronUpIcon />
            </Box>
          }
          size="sm"
          variant="ghost"
          _hover={{ bg: 'gray.100' }}
        />
      </Flex>

      {/* Panel Content - Custom smooth animation */}
      <Box
        overflow="hidden"
        height={isOpen ? `${panelHeight}px` : '0px'}
        opacity={isOpen ? 1 : 0}
        transition={
          isResizing
            ? 'none'
            : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease-in-out'
        }
        willChange="height, opacity"
      >
        {/* Resize Handle */}
        <Box
          ref={resizeRef}
          position="absolute"
          top={0}
          left={0}
          right={0}
          height="6px"
          cursor="ns-resize"
          bg="transparent"
          _hover={{ bg: 'teal.200' }}
          sx={{
            transition: isResizing ? 'none' : 'background-color 0.2s',
            ...(isResizing && { bg: 'teal.400' }),
          }}
          onMouseDown={handleMouseDown}
          zIndex={10}
        />
        <Box
          height="100%"
          overflowY="auto"
          borderTop="1px solid"
          borderColor="gray.200"
        >
          <Tabs index={activeTab} isLazy>
            <TabPanels>
              {/* Problems Tab */}
              <TabPanel p={0}>
                <ProblemsPanel problems={problems} modelerRef={modelerRef} />
              </TabPanel>

              {/* Logs Tab */}
              <TabPanel p={0} h={`${panelHeight - 10}px`}>
                <ExecutionLogsPanel
                  logs={executionLogs}
                  selectedLog={selectedLog}
                  onSelectLog={handleSelectLog}
                  modelerRef={modelerRef}
                />
              </TabPanel>

              {/* Variables Tab */}
              <TabPanel p={0}>
                <VariablesPanel processID={processID} />
              </TabPanel>

              {/* Connections Tab */}
              <TabPanel>
                <Box p={4}>
                  <Text color="gray.500" fontSize="sm">
                    {t('bottomPanel.noConnections')}
                  </Text>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Box>
    </Box>
  );
}
