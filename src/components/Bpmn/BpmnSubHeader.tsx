import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Button,
  Switch,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tabs,
  TabList,
  Tab,
  HStack,
  Badge,
  Tooltip,
  ButtonGroup,
  Divider,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { ChevronDownIcon, HamburgerIcon } from '@chakra-ui/icons';
import { FaSave, FaPlay, FaStop, FaStepForward, FaRedo } from 'react-icons/fa';
import { FiSkipForward } from "react-icons/fi";
import { useSaveShortcut } from '@/hooks/useSaveShortCut';
import { useTranslation } from 'next-i18next';
import { SimulationMode } from "@/contexts/RobotTrackingContext";
import { RobotTrackingState } from "@/hooks/useRobotTrackingSocket";
import robotApi from '@/apis/robotApi';
import { useSelector } from 'react-redux';
import { userSelector } from '@/redux/selector';

interface BpmnSubHeaderProps {
  isSaved: boolean;
  version?: number;
  onSaveAll: () => void;
  onPublish: () => void;
  onRobotCode: () => void;
  onCreateVersion?: () => void;
  onShowVersions?: () => void;
  tokenSimulation?: boolean;
  onTokenSimulationChange?: (enabled: boolean) => void;
  // Robot tracking props
  trackingState?: RobotTrackingState;
  simulationMode?: SimulationMode;
  onSimulationModeChange?: (mode: SimulationMode) => void;
  onConnectRobot?: () => void;
  onDisconnectRobot?: () => void;
  onContinueStep?: () => void;
  onResetTracking?: () => void;
  // Simulation API props
  processId?: string;
  // Get robot code callback for simulation
  getRobotCode?: () => Promise<{ code: string; credentials: any } | null>;
}

export default function BpmnSubHeader({
  isSaved,
  version,
  onSaveAll,
  onPublish,
  onRobotCode,
  onCreateVersion,
  onShowVersions,
  tokenSimulation = false,
  onTokenSimulationChange,
  // Robot tracking props
  trackingState,
  simulationMode = "step-by-step",
  onSimulationModeChange,
  onConnectRobot,
  onDisconnectRobot,
  onContinueStep,
  onResetTracking,
  // Simulation API props
  processId,
  getRobotCode,
}: BpmnSubHeaderProps) {
  const { t } = useTranslation('studio');
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [isStartingSimulation, setIsStartingSimulation] = useState(false);
  const [isWaitingForFirstLog, setIsWaitingForFirstLog] = useState(false);
  const [isStoppingSimulation, setIsStoppingSimulation] = useState(false);
  const user = useSelector(userSelector);

  const handleChangeToSimulateTab = () => {
    setActiveTab(1);
    onTokenSimulationChange?.(false);
  };

  // Add Ctrl+S shortcut support
  useSaveShortcut(onSaveAll);

  // Handler for starting simulation with API call
  const handleStartSimulation = async (mode: SimulationMode) => {
    const userId = user?.id;
    console.log(userId, processId, version);
    if (!userId || !processId || version === undefined) {
      toast({
        title: 'Missing Information',
        description: 'User ID, Process ID, or Version is missing.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if getRobotCode is available
    if (!getRobotCode) {
      toast({
        title: 'Configuration Error',
        description: 'Robot code generator is not configured.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsStartingSimulation(true);
    try {
      // Get robot code first
      const robotCodeResult = await getRobotCode();
      if (!robotCodeResult || !robotCodeResult.code) {
        toast({
          title: 'Failed to Generate Robot Code',
          description: 'Could not generate robot code. Please check your workflow for errors.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Set simulation mode first
      onSimulationModeChange?.(mode);
      
      // Call the runSimulate API with robot code
      await robotApi.runSimulate(userId, processId, version, robotCodeResult.code, {
        runType: mode,
      });

      // Connect to robot tracking and start
      onConnectRobot?.();

      // Start waiting for first log
      setIsWaitingForFirstLog(true);

      toast({
        title: 'Simulation Started',
        description: `Robot simulation started in ${mode === 'run-all' ? 'Run All' : 'Step by Step'} mode.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Failed to start simulation:', error);
      toast({
        title: 'Failed to Start Simulation',
        description: error?.response?.data?.message || error?.message || 'An error occurred while starting the simulation.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsStartingSimulation(false);
    }
  };

  // Handler for stopping simulation with API call
  const handleStopSimulation = async () => {
    if (!processId) {
      toast({
        title: 'Missing Information',
        description: 'Process ID is missing.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsStoppingSimulation(true);
    try {
      // Call the stopSimulate API
      await robotApi.stopSimulate(processId);

      // Reset waiting state
      setIsWaitingForFirstLog(false);

      // Reset tracking state (executed steps, running status, etc.)
      onResetTracking?.();

      toast({
        title: 'Simulation Stopped',
        description: 'Robot simulation has been stopped.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Failed to stop simulation:', error);
      toast({
        title: 'Failed to Stop Simulation',
        description: error?.response?.data?.message || error?.message || 'An error occurred while stopping the simulation.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsStoppingSimulation(false);
    }
  };

  const isConnected = trackingState?.isConnected ?? false;
  const isRunning = trackingState?.isRunning ?? false;
  const waitingForContinue = trackingState?.waitingForContinue ?? false;
  const currentStep = trackingState?.currentStep;
  const lastCompletedStep = trackingState?.lastCompletedStep;
  const executedSteps = trackingState?.executedSteps ?? [];
  
  // Detect when first log is received and stop waiting
  useEffect(() => {
    if (isWaitingForFirstLog && executedSteps.length > 0) {
      setIsWaitingForFirstLog(false);
    }
  }, [isWaitingForFirstLog, executedSteps.length]);

  // Reset waiting state when simulation stops
  useEffect(() => {
    if (!isRunning && !isConnected) {
      setIsWaitingForFirstLog(false);
    }
  }, [isRunning, isConnected]);

  // Check if any step has error status - if so, we should stop the execution
  const hasError = executedSteps.some(
    (step) => step.status === 'ERROR' || step.status === 'FAIL'
  );
  
  // In step-by-step mode, Next Step should be enabled when:
  // - Robot is waiting for continue signal (waitingForContinue is true)
  // - OR when there's a currentStep (for backward compatibility)
  // - AND there's no error in any previous step
  const canContinue = (waitingForContinue || !!currentStep) && !hasError;

  // Combined loading state: starting simulation OR waiting for first log
  const isLoading = isStartingSimulation || isWaitingForFirstLog;

  return (
    <Box
      bg="gray.50"
      borderBottom="1px solid"
      borderColor="gray.200"
      px={4}
      py={2}
    >
      <Flex justify="space-between" align="center">
        {/* Left Section: Tabs */}
        <Flex align="center" gap={6}>
          <Tabs
            index={activeTab}
            onChange={setActiveTab}
            variant="unstyled"
            size="sm"
          >
            <TabList>
              <Tab
                _selected={{
                  color: 'teal.600',
                  borderBottom: '2px solid',
                  borderColor: 'teal.600',
                }}
                fontWeight="medium"
                pb={2}
              >
                {t('subheader.design')}
              </Tab>
              <Tab
                _selected={{
                  color: 'teal.600',
                  borderBottom: '2px solid',
                  borderColor: 'teal.600',
                }}
                onClick={handleChangeToSimulateTab}
                fontWeight="medium"
                pb={2}
              >
                {t('subheader.simulate')}
              </Tab>
            </TabList>
          </Tabs>

          {/* Design Tab Controls */}
          {activeTab === 0 && (
            <Flex align="center" gap={2}>
              <Switch
                colorScheme="teal"
                isChecked={tokenSimulation}
                onChange={(e) => onTokenSimulationChange?.(e.target.checked)}
                size="sm"
              />
              <Text fontSize="sm" color="gray.700">
                {t('subheader.tokenSimulation')}
              </Text>
            </Flex>
          )}

          {/* Simulate Tab Controls */}
          {activeTab === 1 && (
            <Flex align="center" gap={4}>
              {/* Connection Status */}
              <HStack spacing={2}>
                <Tooltip label={
                  isLoading 
                    ? "Starting simulation..." 
                    : isConnected 
                      ? "Connected to robot" 
                      : "Not connected"
                }>
                 
                    <Box
                      w={2}
                      h={2}
                      borderRadius="full"
                      bg={isConnected ? "green.400" : "gray.400"}
                      animation={isRunning ? "pulse 1s infinite" : undefined}
                    />
                  
                </Tooltip>
                <Text fontSize="sm" color="gray.600">
                  {
                     isConnected 
                      ? isRunning 
                        ? "Running" 
                        : "Connected" 
                      : "Ready"}
                </Text>
              </HStack>

              <Divider orientation="vertical" h="24px" />

              {/* Run Button with Dropdown */}
              {!isRunning && !isLoading ? (
                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                    size="sm"
                    colorScheme="green"
                    fontWeight="medium"
                    leftIcon={<FaPlay />}
                    isDisabled={isLoading}
                  >
                    Run
                  </MenuButton>
                  <MenuList minW="180px">
                    <MenuItem
                      onClick={() => handleStartSimulation('run-all')}
                      isDisabled={isStartingSimulation}
                      _hover={{ bg: "green.50" }}
                    >
                      <HStack spacing={3}>
                        <FaPlay color="#38A169" />
                        <Box>
                          <Text fontWeight="medium">Run All</Text>
                          <Text fontSize="xs" color="gray.500">Execute all steps continuously</Text>
                        </Box>
                      </HStack>
                    </MenuItem>
                    <MenuItem
                      onClick={() => handleStartSimulation('step-by-step')}
                      isDisabled={isStartingSimulation}
                      _hover={{ bg: "blue.50" }}
                    >
                      <HStack spacing={3}>
                        <FaStepForward color="#3182CE" />
                        <Box>
                          <Text fontWeight="medium">Step by Step</Text>
                          <Text fontSize="xs" color="gray.500">Pause after each step</Text>
                        </Box>
                      </HStack>
                    </MenuItem>
                  </MenuList>
                </Menu>
              ) : isLoading ? (
                <Button
                  size="sm"
                  colorScheme="blue"
                  isLoading
                  loadingText="Starting..."
                  fontWeight="medium"
                />
              ) : (
                <Tooltip label="Stop Execution">
                  <Button
                    leftIcon={<FaStop />}
                    colorScheme="red"
                    size="sm"
                    onClick={handleStopSimulation}
                    isLoading={isStoppingSimulation}
                    loadingText="Stopping..."
                  >
                    Stop
                  </Button>
                </Tooltip>
              )}

              {/* Step Controls (only visible in step-by-step mode when connected) */}
              {simulationMode === "step-by-step" && isConnected && (
                <>
                  <Divider orientation="vertical" h="24px" />
                  <ButtonGroup size="sm" isAttached>
                    <Tooltip label={hasError ? "Execution stopped due to error" : "Continue to Next Step"}>
                      <Button
                        leftIcon={<FiSkipForward />}
                        colorScheme={hasError ? "red" : "blue"}
                        onClick={onContinueStep}
                        isDisabled={!canContinue}
                        variant={canContinue ? "solid" : "outline"}
                      >
                        Next Step
                      </Button>
                    </Tooltip>
                    <Tooltip label="Reset Tracking">
                      <IconButton
                        aria-label="Reset"
                        icon={<FaRedo />}
                        colorScheme="gray"
                        variant="outline"
                        onClick={onResetTracking}
                      />
                    </Tooltip>
                  </ButtonGroup>
                </>
              )}

              {/* Step Indicator - show when waiting for continue or step is running */}
              {/* {(waitingForContinue || currentStep) && (
                <>
                  <Divider orientation="vertical" h="24px" />
                  <HStack spacing={2}>
                    { !hasError && waitingForContinue && lastCompletedStep ? (
                      <Badge colorScheme="green" variant="subtle" px={2} py={1}>
                       Completed: {lastCompletedStep.stepId} → Click "Next Step"
                      </Badge>
                    ) : currentStep ? (
                      <Badge colorScheme="orange" variant="subtle" px={2} py={1}>
                        Running: {currentStep.stepId}
                      </Badge>
                    ) : null}
                  </HStack>
                </>
              )} */}
            </Flex>
          )}
        </Flex>

        {/* Right Section: Actions */}
        <Flex align="center" gap={3}>
          {/* Save Button */}
          <Button
            size="sm"
            leftIcon={<FaSave />}
            colorScheme={isSaved ? 'gray' : 'orange'}
            variant={isSaved ? 'outline' : 'solid'}
            onClick={onSaveAll}
            fontWeight="medium"
            px={4}
            isDisabled={isSaved}
          >
            {isSaved ? t('buttons.saved') : t('buttons.save')}
          </Button>

          {/* Version Dropdown */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              size="sm"
              variant="outline"
              borderColor="blue.500"
              color="blue.600"
              _hover={{ bg: 'blue.50' }}
              fontWeight="medium"
            >
              {t('subheader.version')}
            </MenuButton>
            <MenuList minW="200px">
              <MenuItem
                _hover={{
                  bg: 'transparent',
                  outline: '2px solid',
                  outlineColor: '#5B5DD9',
                  outlineOffset: '-2px',
                }}
                onClick={onCreateVersion}
              >
                {t('subheader.createVersion')}
              </MenuItem>
              <MenuItem
                _hover={{
                  bg: 'transparent',
                  outline: '2px solid',
                  outlineColor: '#5B5DD9',
                  outlineOffset: '-2px',
                }}
                onClick={onShowVersions}
              >
                {t('subheader.showVersions')}
              </MenuItem>
            </MenuList>
          </Menu>

          {/* Publish Button */}
          <Button
            size="sm"
            bg="pink.500"
            color="white"
            _hover={{ bg: 'pink.600' }}
            onClick={onPublish}
            fontWeight="medium"
            px={6}
          >
            {t('buttons.publish')}
          </Button>

          {/* RobotCode Button */}
          <Button
            size="sm"
            colorScheme="teal"
            onClick={onRobotCode}
            fontWeight="medium"
            px={6}
          >
            {t('buttons.robotCode')}
          </Button>

          {/* More Menu */}
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<HamburgerIcon />}
              variant="ghost"
              size="sm"
              aria-label={t('buttons.moreOptions')}
            />
            <MenuList>
              <MenuItem icon={<FaSave />} onClick={onSaveAll}>
                {t('buttons.saveAll')}
              </MenuItem>
              <MenuItem>{t('subheader.exportXml')}</MenuItem>
              <MenuItem>{t('subheader.importBpmn')}</MenuItem>
              <MenuItem>{t('subheader.settings')}</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {/* Animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </Box>
  );
}
