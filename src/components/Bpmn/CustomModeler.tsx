import { useBpmn } from '@/hooks/useBpmn';
import { useSubProcessContext } from '@/hooks/useSubProcessContext';
import { BpmnJsReactHandle } from '@/interfaces/bpmnJsReact.interface';
import { useEffect, useRef, useState } from 'react';
import BpmnJsReact from './BpmnJsReact';
import {
  Box,
  Button,
  IconButton,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import ModelerSideBar from './ModelerSidebar';
import { BpmnParser } from '@/utils/bpmn-parser/bpmn-parser.util';
import {
  getLocalStorageObject,
  setLocalStorageObject,
} from '@/utils/localStorageService';
import {
  getProcessFromLocalStorage,
  updateProcessInProcessList,
  updateLocalStorage,
} from '@/utils/processService';
import { useRouter } from 'next/router';
import { LocalStorage } from '@/constants/localStorage';
import { exportFile, stringifyCyclicObject } from '@/utils/common';
import UndoRedoButtons from './UndoRedoButtons';
import SubProcessControls from './SubProcessControls';
import CreateProcessFromSubProcessModal from './CreateProcessFromSubProcessModal';
import {
  hasNestedSubProcesses,
  extractSubProcessAsProcess,
} from '@/utils/subprocessExtractor';
import { extractSubProcessData } from '@/utils/subprocessDataExtractor';

import {
  convertToRefactoredObject,
  getIndexVariableStorage,
  getVariableItemFromLocalStorage,
} from '@/utils/variableService';

import { useParams } from 'next/navigation';
import { QUERY_KEY } from '@/constants/queryKey';
import processApi from '@/apis/processApi';
import { useMutation, useQuery } from '@tanstack/react-query';
import LoadingIndicator from '../LoadingIndicator/LoadingIndicator';
import { SaveProcessDto } from '@/dtos/processDto';
import { useDispatch, useSelector } from 'react-redux';
import { bpmnSelector } from '@/redux/selector';
import { isSavedChange } from '@/redux/slice/bpmnSlice';
import DisplayRobotCode from './DisplayRobotCode/DisplayRobotCode';
import BpmnModelerLayout from './BpmnModelerLayout';
import BpmnRightSidebar from './BpmnRightSidebar';
import BpmnBottomPanel from './BpmnBottomPanel';
import { BpmnParseError } from '@/utils/bpmn-parser/error';
import teamApi from '@/apis/teamApi';
import workspaceApi from '@/apis/workspaceApi';
import { CreateVersionModal } from './VersionsPanel';
import versionApi from '@/apis/versionApi';
import { convertJsonToProcess } from '@/utils/bpmn-parser/json-to-bpmn-xml.util';
import { PublishRobotModal } from './FunctionalTabBar/PublishRobotModal';
import { Modal, ModalOverlay } from '@chakra-ui/react';
import UnsavedChangesModal from "./UnsavedChangesModal";

interface OriginalObject {
  [key: string]: {
    type: string;
    isArgument: boolean;
    defaultValue: string;
  };
}

function CustomModeler() {
  const router = useRouter();
  const ref = useRef<BpmnJsReactHandle>(null);
  const params = useParams();
  const bpmnReactJs = useBpmn();
  const { isInSubProcess, subProcessName } = useSubProcessContext(bpmnReactJs);
  const toast = useToast();
  const dispatch = useDispatch();
  const processID = params.id;
  const teamId = params.teamId;
  const workspaceId = params.workspaceId;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isCreateVersionOpen,
    onOpen: onOpenCreateVersion,
    onClose: onCloseCreateVersion,
  } = useDisclosure();
  const {
    isOpen: isPublishModalOpen,
    onOpen: onOpenPublishModal,
    onClose: onClosePublishModal,
  } = useDisclosure();
  const {
    isOpen: isCreateFromSubProcessOpen,
    onOpen: onOpenCreateFromSubProcess,
    onClose: onCloseCreateFromSubProcess,
  } = useDisclosure();
  const {
    isOpen: isUnsavedChangesModalOpen,
    onOpen: onOpenUnsavedChangesModal,
    onClose: onCloseUnsavedChangesModal,
  } = useDisclosure();
  const [errorTrace, setErrorTrace] = useState<string>("");
  const [showRobotCode, setShowRobotCode] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [subProcessInfo, setSubProcessInfo] = useState<{
    name: string;
    elementCount: number;
    hasNested: boolean;
  }>({ name: '', elementCount: 0, hasNested: false });
  const [activityItem, setActivityItem] = useState({
    activityID: '',
    activityName: '',
    activityType: '',
    properties: {},
  });
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [tokenSimulation, setTokenSimulation] = useState(false);
  const isSavedChanges = useSelector(bpmnSelector);
  const shouldBlockNavigationRef = useRef(false);
  const allowNavigationRef = useRef(false);

  const processName = router?.query?.name as string;
  const version = router?.query?.version as string;

  // Original standalone query - unchanged
  const { data: processDetailByID, isLoading } = useQuery({
    queryKey: [QUERY_KEY.PROCESS_DETAIL],
    queryFn: () => processApi.getProcessByID(processID as string),
    enabled: !teamId && !workspaceId, // Only run for standalone processes
  });

  // NEW: Team process query
  const { data: teamProcessDetail, isLoading: isLoadingTeam } = useQuery({
    queryKey: [QUERY_KEY.PROCESS_DETAIL, 'team', teamId, processID],
    queryFn: () =>
      teamApi.getTeamProcessById(teamId as string, processID as string),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // NEW: Workspace process query
  const { data: workspaceProcessDetail, isLoading: isLoadingWorkspace } =
    useQuery({
      queryKey: [QUERY_KEY.PROCESS_DETAIL, 'workspace', workspaceId, processID],
      queryFn: () =>
        workspaceApi.getWorkspaceProcessById(
          workspaceId as string,
          processID as string
        ),
      enabled: !!workspaceId,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    });

  // NEW: Get the correct data based on context
  const currentProcessDetail = teamId
    ? teamProcessDetail
    : workspaceId
      ? workspaceProcessDetail
      : processDetailByID;
  const currentLoading = teamId
    ? isLoadingTeam
    : workspaceId
      ? isLoadingWorkspace
      : isLoading;

  const convertObjectToArray = (
    originalObject: OriginalObject | null | undefined
  ) => {
    // Handle null, undefined, or non-object input
    if (!originalObject || typeof originalObject !== 'object') {
      return [];
    }

    // Handle empty object
    const entries = Object.entries(originalObject);
    if (entries.length === 0) {
      return [];
    }

    return entries.map(([name, { type, isArgument, defaultValue }], index) => ({
      id: index + 1,
      name,
      value: defaultValue,
      isArgument,
      type,
    }));
  };

  // sync data from api to localStorage
  useEffect(() => {
    if (!currentProcessDetail) return;
    console.log('📦 [Sync] Process Detail By ID', currentProcessDetail);
    console.log('📦 [Sync] Process Detail XML', currentProcessDetail.xml);
    console.log(
      '📦 [Sync] Process Detail Variables',
      currentProcessDetail.variables
    );
    console.log(
      '📦 [Sync] Process Detail Activities',
      currentProcessDetail.activities
    );

    const currentprocessID = getProcessFromLocalStorage(processID as string);
    console.log('📦 [Sync] Current Process ID', currentprocessID);
    const updateStorageByID = {
      ...currentprocessID,
      id: processID as string,
      xml: currentProcessDetail.xml || '',
      variables: currentProcessDetail.variables || {},
      activities: currentProcessDetail.activities || [],
    };
    console.log('📦 [Sync] Update Storage By ID', updateStorageByID);
    const replaceStorageSnapshot = updateProcessInProcessList(
      processID as string,
      updateStorageByID
    );
    setLocalStorageObject(LocalStorage.PROCESS_LIST, replaceStorageSnapshot);
    console.log('✅ [Sync] localStorage updated successfully');
  }, [currentProcessDetail, processID]);

  useEffect(() => {
    if (!currentProcessDetail) return;
    const indexLocalStorage = getIndexVariableStorage(processID as string);
    const payloadStorage = {
      processID: processID,
      variables: convertObjectToArray(currentProcessDetail.variables),
    };
    const currentLocalStorageList = getLocalStorageObject(
      LocalStorage.VARIABLE_LIST
    );

    if (indexLocalStorage === undefined) {
      setLocalStorageObject(LocalStorage.VARIABLE_LIST, [
        ...currentLocalStorageList,
        payloadStorage,
      ]);
    } else {
      currentLocalStorageList[indexLocalStorage] = payloadStorage;
      setLocalStorageObject(
        LocalStorage.VARIABLE_LIST,
        currentLocalStorageList
      );
    }

    // Dispatch custom event to notify VariablesPanel to refresh
    console.log(
      '📢 [CustomModeler] Dispatching variables-updated event for:',
      processID
    );
    window.dispatchEvent(
      new CustomEvent('variables-updated', {
        detail: { processID },
      })
    );
  }, [currentProcessDetail, processID]);

  const mutateSaveAll = useMutation({
    mutationFn: async (payload: SaveProcessDto) => {
      // Use appropriate API based on context
      if (teamId) {
        return await teamApi.updateTeamProcess(
          teamId as string,
          processID as string,
          payload
        );
      } else if (workspaceId) {
        return await workspaceApi.saveWorkspaceProcess(
          workspaceId as string,
          processID as string,
          payload
        );
      } else {
        return await processApi.saveProcessByID(processID as string, payload);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Save all changes sucessfully!',
        status: 'success',
        position: 'top-right',
        duration: 1000,
        isClosable: true,
      });
      dispatch(isSavedChange(true));
    },
    onError: () => {
      toast({
        title: 'There are some errors, try again !',
        status: 'error',
        position: 'top-right',
        duration: 1000,
        isClosable: true,
      });
    },
  });

  const mutateCreateVersion = useMutation({
    mutationFn: async (data: { tag: string; description: string }) => {
      // Version feature only for standalone processes
      if (teamId || workspaceId) {
        throw new Error(
          'Version feature is only available for standalone processes'
        );
      }

      // First, sync XML and activities from modeler to localStorage
      // This ensures we create version with the latest canvas state
      if (bpmnReactJs.bpmnModeler) {
        try {
          const xmlResult = await bpmnReactJs.saveXML();
          const activityList = bpmnReactJs
            .getElementList(processID as string)
            .slice(1);

          const currentProcess = getProcessFromLocalStorage(
            processID as string
          );
          const updatedProcess = {
            ...currentProcess,
            id: processID as string,
            xml: xmlResult.xml,
            activities: activityList,
          };
          const newLocalStorage = updateLocalStorage(updatedProcess);
          setLocalStorageObject(LocalStorage.PROCESS_LIST, newLocalStorage);

          console.log(' [CreateVersion] synced modeler state to localStorage');
        } catch (syncError) {
          console.error('Failed to sync modeler state:', syncError);
          throw new Error(
            'Failed to sync canvas state before creating version'
          );
        }
      }

      // Get current data from localStorage (now updated with latest canvas state)
      const processProperties = getProcessFromLocalStorage(processID as string);
      const variableListByID = getVariableItemFromLocalStorage(
        processID as string
      );
      const refactoredVariables = convertToRefactoredObject(variableListByID);

      if (!processProperties) {
        throw new Error('Process data not found in localStorage');
      }

      // Build full payload for create version
      const payload = {
        processId: processID as string,
        xml: processProperties.xml || '',
        variables: refactoredVariables || {},
        activities: processProperties.activities || [],
        tag: data.tag,
        description: data.description,
      };

      return await versionApi.createVersion(processID as string, payload);
    },
    onSuccess: () => {
      toast({
        title: 'Version created successfully!',
        status: 'success',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
      onCloseCreateVersion();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create version',
        description: error?.message || 'An error occurred',
        status: 'error',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
    },
  });

  const handleSaveAll = async () => {
    return new Promise<void>((resolve, reject) => {
      // First, sync XML and activities from modeler to localStorage
      // This ensures we save the latest canvas state including node names
      if (bpmnReactJs.bpmnModeler) {
        (async () => {
          try {
            const xmlResult = await bpmnReactJs.saveXML();
            const activityList = bpmnReactJs
              .getElementList(processID as string)
              .slice(1);

        const currentProcess = getProcessFromLocalStorage(processID as string);
        const updatedProcess = {
          ...currentProcess,
          id: processID as string,
          xml: xmlResult.xml,
          activities: activityList,
        };
        const newLocalStorage = updateLocalStorage(updatedProcess);
        setLocalStorageObject(LocalStorage.PROCESS_LIST, newLocalStorage);

        console.log('📦 [Save] Synced modeler state to localStorage');
      } catch (syncError) {
        console.error('Failed to sync modeler state:', syncError);
        toast({
          title: 'Failed to sync canvas state',
          status: 'warning',
          position: 'top-right',
          duration: 2000,
          isClosable: true,
        });
      }
    }

            // Now get the updated data from localStorage
            const processProperties = getProcessFromLocalStorage(processID as string);
            if (!processProperties) {
              toast({
                title: "There are some errors, please refresh the page!",
                status: "error",
                position: "top-right",
                duration: 1000,
                isClosable: true,
              });
              reject(new Error("Process properties not found"));
              return;
            }

            const variableListByID = getVariableItemFromLocalStorage(
              processID as string
            );
            const refactoredVariables = convertToRefactoredObject(variableListByID);
            const payload = {
              xml: processProperties.xml,
              activities: processProperties.activities,
              variables: refactoredVariables ?? {},
            };

            // Use mutateAsync to get a promise
            mutateSaveAll.mutateAsync(payload)
              .then(() => {
                resolve();
              })
              .catch((error) => {
                reject(error);
              });
          } catch (syncError) {
            console.error("Failed to sync modeler state:", syncError);
            toast({
              title: "Failed to sync canvas state",
              status: "warning",
              position: "top-right",
              duration: 2000,
              isClosable: true,
            });
            reject(syncError);
          }
        })();
      } else {
        reject(new Error("Modeler not initialized"));
      }
    });
  };

  const handleSaveAndExit = async () => {
    try {
      await handleSaveAll();
      // Allow navigation after save completes
      allowNavigationRef.current = true;
      if (pendingNavigation) {
        onCloseUnsavedChangesModal();
        router.push(pendingNavigation);
        setPendingNavigation(null);
      }
    } catch (error) {
      // Error is already handled by mutation onError
      console.error("Failed to save:", error);
    }
  };

  const handleExit = () => {
    // Allow navigation without saving
    allowNavigationRef.current = true;
    if (pendingNavigation) {
      onCloseUnsavedChangesModal();
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setPendingNavigation(null);
    onCloseUnsavedChangesModal();
  };

  const compileRobotCode = (processID: string) => {
    try {
      const bpmnParser = new BpmnParser();
      const processProperties = getProcessFromLocalStorage(processID as string);
      const variableList = getVariableItemFromLocalStorage(processID as string);

      // Validate process properties
      if (!processProperties) {
        throw new Error(
          'Process data not found in localStorage. Please refresh the page.'
        );
      }

      if (!processProperties.xml) {
        throw new Error(
          'Process XML is missing. Please save the process first.'
        );
      }

      console.log('Process Properties', processProperties.xml);
      const robotCode = bpmnParser.parse(
        processProperties.xml,
        processProperties.activities || [],
        variableList ? variableList.variables : []
      );

      setShowRobotCode(true);
      return robotCode;
    } catch (error) {
      setErrorTrace(error.stack.toString());

      if (error instanceof BpmnParseError) {
        toast({
          title: error.message + ': ' + error.bpmnId,
          status: 'error',
          position: 'bottom-right',
          duration: 1000,
          isClosable: true,
        });
      }
      toast({
        title: (error as Error).message,
        status: 'error',
        position: 'bottom-right',
        duration: 1000,
        isClosable: true,
      });
    }
  };

  // genRobotCode function for Publish modal - NO error handling, throws to caller
  const compileRobotCodePublish = (processID: string) => {
    const bpmnParser = new BpmnParser();
    const processProperties = getProcessFromLocalStorage(processID as string);
    const variableList = getVariableItemFromLocalStorage(processID as string);

    // Validate process properties - throw error for caller to handle
    if (!processProperties) {
      throw new Error(
        'Process data not found in localStorage. Please refresh the page.'
      );
    }

    if (!processProperties.xml) {
      throw new Error('Process XML is missing. Please save the process first.');
    }

    const robotCode = bpmnParser.parse(
      processProperties.xml,
      processProperties.activities || [],
      variableList ? variableList.variables : []
    );

    return robotCode;
  };

  const handlePublish = async () => {
    // First, try to sync data from modeler to localStorage if modeler is ready
    if (bpmnReactJs.bpmnModeler) {
      try {
        const xmlResult = await bpmnReactJs.saveXML();
        const activityList = bpmnReactJs
          .getElementList(processID as string)
          .slice(1);

        const currentProcess = getProcessFromLocalStorage(processID as string);
        const updatedProcess = {
          ...currentProcess,
          id: processID as string,
          xml: xmlResult.xml,
          activities: activityList,
        };
        const newLocalStorage = updateLocalStorage(updatedProcess);
        setLocalStorageObject(LocalStorage.PROCESS_LIST, newLocalStorage);

        console.log('📦 [Publish] Synced modeler state to localStorage');
      } catch (syncError) {
        console.error('Failed to sync modeler state:', syncError);
        toast({
          title: 'Failed to sync workflow state',
          description: 'Please try again.',
          status: 'warning',
          position: 'top-right',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    // Now check if data is ready in localStorage after sync
    const processProperties = getProcessFromLocalStorage(processID as string);
    if (!processProperties || !processProperties.xml) {
      toast({
        title: 'Process data not ready',
        description:
          'Please wait for the process to load completely, then try again.',
        status: 'warning',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if in subprocess by directly checking canvas root (more reliable than state)
    if (bpmnReactJs.bpmnModeler) {
      const canvas = bpmnReactJs.bpmnModeler.get('canvas') as any;
      const currentRoot = canvas.getRootElement();
      const isCurrentlyInSubProcess =
        currentRoot?.businessObject?.$type === 'bpmn:SubProcess';

      console.log('📍 Current root type:', currentRoot?.businessObject?.$type);
      console.log(
        '📍 Current root name:',
        currentRoot?.businessObject?.name || currentRoot?.id
      );
      console.log('📍 Is in subprocess:', isCurrentlyInSubProcess);

      if (isCurrentlyInSubProcess) {
        // Check if subprocess has nested subprocesses
        const hasNested = hasNestedSubProcesses(
          bpmnReactJs.bpmnModeler,
          currentRoot.id
        );

        console.log('📦 SubProcess has nested:', hasNested);

        if (hasNested) {
          // Has nested subprocess → Show warning, don't allow publish
          console.log('⚠️ NESTED SUBPROCESS DETECTED!');
          console.log('→ Showing warning to user...');

          toast({
            title: 'Cannot Publish from Nested SubProcess',
            description:
              'This subprocess contains nested subprocesses. Please use "Create Process from SubProcess" button to extract it first, or go back to the main process.',
            status: 'warning',
            position: 'top-right',
            duration: 6000,
            isClosable: true,
          });

          console.log('╚═══════════════════════════════════════════╝\n');
          return; // Stop here - don't continue to publish
        }

        // No nested subprocess → Continue with normal publish flow
        console.log('✅ No nested subprocess detected');
        console.log('→ Proceeding with normal publish flow...');
      } else {
        console.log('✅ In main process');
        console.log('→ Proceeding with normal publish flow...');
      }
    }

    try {
      // Validate by trying to compile robot code (DON'T save yet)
      const result = compileRobotCodePublish(processID as string);

      // Check if result is valid
      if (!result || !result.code || !result.credentials) {
        throw new Error('Invalid robot code: Missing code or credentials');
      }

      // Only save if validation passed
      handleSaveAll();

      onOpenPublishModal();
    } catch (error) {
      // Show specific error message (ONLY toast, no modal)
      if (error instanceof BpmnParseError) {
        toast({
          title: 'BPMN Parse Error',
          description: `${error.message}: ${error.bpmnId}`,
          status: 'error',
          position: 'top-right',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Cannot Publish Robot',
          description:
            (error as Error).message || 'Failed to validate robot code',
          status: 'error',
          position: 'top-right',
          duration: 5000,
          isClosable: true,
        });
      }

      // IMPORTANT: Do NOT open any modals
      // Do NOT call: onOpenPublishModal()
      // Do NOT call: setShowRobotCode(true)
      return; // Exit early
    }
  };

  const handleCreateVersion = () => {
    // Only allow version creation for standalone processes
    if (teamId || workspaceId) {
      toast({
        title: 'Version feature not available',
        description:
          'Version management is only available for standalone processes.',
        status: 'info',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onOpenCreateVersion();
  };

  const handleCreateProcessFromSubProcess = async (newProcessName: string) => {
    try {
      if (!bpmnReactJs.bpmnModeler) {
        throw new Error('Modeler not initialized');
      }

      const canvas = bpmnReactJs.bpmnModeler.get('canvas') as any;
      const currentRoot = canvas.getRootElement();
      // Extract subprocess XML
      const extracted = await extractSubProcessAsProcess(
        bpmnReactJs.bpmnModeler,
        currentRoot.id
      );

      // Get activities and variables from localStorage
      const currentProcess = getProcessFromLocalStorage(processID as string);
      const allActivities = currentProcess?.activities || [];
      const allVariables = currentProcess?.variables || {};

      console.log('📦 Parent process data:');
      console.log('  - Total activities:', allActivities.length);
      console.log('  - Total variables:', Object.keys(allVariables).length);

      // Filter activities and variables for subprocess
      const subProcessData = extractSubProcessData(
        bpmnReactJs.bpmnModeler,
        currentRoot.id,
        allActivities,
        allVariables
      );

      const newProcessId = `process_${Date.now().toString(36)}`;

      // Create new process with all params
      const newProcess = await processApi.createProcessWithAllParams({
        id: newProcessId,
        name: newProcessName,
        description: `Created from subprocess: ${extracted.name}`,
        xml: extracted.xml,
        activities: subProcessData.activities,
        variables: subProcessData.variables,
      });

      console.log('✅ Process created successfully!');
      console.log('  - Process ID:', newProcessId);
      console.log('  - Activities included:', subProcessData.activities.length);
      console.log(
        '  - Variables included:',
        Object.keys(subProcessData.variables).length
      );
      console.log('╚═══════════════════════════════════════════╝\n');

      toast({
        title: 'Process Created Successfully',
        description: `Process "${newProcessName}" has been created with ${subProcessData.activities.length} activities. You can find it in the process list.`,
        status: 'success',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
      });

      onCloseCreateFromSubProcess();
    } catch (error: any) {
      console.error('Error creating process from subprocess:', error);
      toast({
        title: 'Failed to Create Process',
        description: error?.message || 'An unexpected error occurred',
        status: 'error',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleShowVersions = () => {
    // Only allow version viewing for standalone processes
    if (teamId || workspaceId) {
      toast({
        title: 'Version feature not available',
        description:
          'Version management is only available for standalone processes.',
        status: 'info',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    router.push({
      pathname: `/studio/modeler/${processID}/versions`,
      query: { name: processName },
    });
  };

  const handleToggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };

  const handleTokenSimulationChange = (enabled: boolean) => {
    setTokenSimulation(enabled);
    
    if (bpmnReactJs.bpmnModeler) {
      try {
        const toggleMode = bpmnReactJs.bpmnModeler.get("toggleMode") as any;
        if (toggleMode) {
          toggleMode.toggleMode(enabled);
          console.log(`🎮 Token simulation ${enabled ? "enabled" : "disabled"}`);
        }
      } catch (error) {
        console.error("Failed to toggle token simulation:", error);
        toast({
          title: "Failed to toggle simulation mode",
          status: "error",
          position: "top-right",
          duration: 2000,
          isClosable: true,
        });
      }
    }
  };

  const handleApplyXml = async (
    xml: string,
    activities?: any[],
    automaticNodeIds?: string[]
  ) => {
    try {
      if (!bpmnReactJs.bpmnModeler) {
        throw new Error('Modeler not initialized');
      }

      await bpmnReactJs.bpmnModeler.importXML(xml);
      console.log('✅ [AI Chatbot] XML imported to modeler');

      // Highlight automatic nodes (is_automatic === true) in green
      if (automaticNodeIds && automaticNodeIds.length > 0) {
        try {
          const modeling = bpmnReactJs.bpmnModeler.get('modeling');
          const elementRegistry =
            bpmnReactJs.bpmnModeler.get('elementRegistry');

          automaticNodeIds.forEach((nodeId) => {
            const element = elementRegistry.get(nodeId);
            if (element) {
              modeling.setColor(element, {
                fill: '#C6F6D5', // teal.100
                stroke: '#2F855A', // green.700
              });
            }
          });

          console.log(
            '✅ [AI Chatbot] Highlighted automatic nodes:',
            automaticNodeIds
          );
        } catch (e) {
          console.error(
            '❌ [AI Chatbot] Failed to highlight automatic nodes:',
            e
          );
        }
      }

      const currentProcess = getProcessFromLocalStorage(processID as string);
      const updatedProcess = {
        ...currentProcess,
        id: processID as string,
        xml,
        activities: activities ?? currentProcess?.activities ?? [],
      };

      const newLocalStorage = updateLocalStorage(updatedProcess);
      setLocalStorageObject(LocalStorage.PROCESS_LIST, newLocalStorage);

      dispatch(isSavedChange(false));

      toast({
        title: 'BPMN Applied Successfully',
        description:
          "The process has been applied to the canvas. Don't forget to save!",
        status: 'success',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('❌ [AI Chatbot] Error applying XML:', error);
      toast({
        title: 'Failed to apply BPMN',
        description: error?.message || 'An unexpected error occurred',
        status: 'error',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };

  const handleRobotCode = async () => {
    // Check if in subprocess by directly checking canvas root (more reliable than state)
    if (bpmnReactJs.bpmnModeler) {
      const canvas = bpmnReactJs.bpmnModeler.get('canvas') as any;
      const currentRoot = canvas.getRootElement();
      const isCurrentlyInSubProcess =
        currentRoot?.businessObject?.$type === 'bpmn:SubProcess';

      console.log('📍 Current root type:', currentRoot?.businessObject?.$type);
      console.log(
        '📍 Current root name:',
        currentRoot?.businessObject?.name || currentRoot?.id
      );
      console.log('📍 Is in subprocess:', isCurrentlyInSubProcess);

      if (isCurrentlyInSubProcess) {
        // Check if subprocess has nested subprocesses
        const hasNested = hasNestedSubProcesses(
          bpmnReactJs.bpmnModeler,
          currentRoot.id
        );

        console.log('📦 SubProcess has nested:', hasNested);

        if (hasNested) {
          // Has nested subprocess → Show warning, don't allow robot code
          console.log('⚠️ NESTED SUBPROCESS DETECTED!');
          console.log('→ Showing warning to user...');

          toast({
            title: 'Cannot Generate Robot Code from Nested SubProcess',
            description:
              'This subprocess contains nested subprocesses. Please use "Create Process from SubProcess" button to extract it first, or go back to the main process.',
            status: 'warning',
            position: 'top-right',
            duration: 6000,
            isClosable: true,
          });

          console.log('╚═══════════════════════════════════════════╝\n');
          return; // Stop here - don't continue to compile
        }

        // No nested subprocess → Continue with normal robot code flow
        console.log('✅ No nested subprocess detected');
        console.log('→ Proceeding with normal robot code compilation...');
      } else {
        console.log('✅ In main process');
        console.log('→ Proceeding with normal robot code compilation...');
      }
    }

    // Sync XML and activities from modeler to localStorage before compiling
    // This ensures we're parsing the latest state, not stale data
    if (bpmnReactJs.bpmnModeler) {
      try {
        const xmlResult = await bpmnReactJs.saveXML();
        const activityList = bpmnReactJs
          .getElementList(processID as string)
          .slice(1);

        // Log for debugging
        console.log('📦 [Sync] Current XML from modeler:', xmlResult.xml);
        console.log(
          '📦 [Sync] Current activities from modeler:',
          activityList.map((a: any) => a.activityID)
        );

        const currentProcess = getProcessFromLocalStorage(processID as string);
        const updatedProcess = {
          ...currentProcess,
          id: processID as string,
          xml: xmlResult.xml,
          activities: activityList,
        };
        const newLocalStorage = updateLocalStorage(updatedProcess);
        setLocalStorageObject(LocalStorage.PROCESS_LIST, newLocalStorage);

        console.log('📦 Synced modeler state to localStorage before compiling');
      } catch (syncError) {
        console.error('Failed to sync modeler state:', syncError);
        toast({
          title: 'Failed to sync workflow state. Please try again.',
          status: 'warning',
          position: 'top-right',
          duration: 3000,
          isClosable: true,
        });
        return; // Don't compile if sync failed
      }
    }

    // Now compile robot code (validation happens inside compileRobotCode)
    compileRobotCode(processID as string);
  };

  // Intercept route changes when there are unsaved changes
  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      // Allow navigation if explicitly allowed (e.g., after save and exit)
      if (allowNavigationRef.current) {
        allowNavigationRef.current = false;
        return;
      }
      if (isSavedChanges.isSaved) {
        shouldBlockNavigationRef.current = false;
        return;
      }
      // Don't intercept if it's the same route (query params change)
      const currentPath = router.asPath.split("?")[0];
      const newPath = url.split("?")[0];
      if (currentPath === newPath) {
        return;
      }
      // Block navigation and show modal
      shouldBlockNavigationRef.current = true;
      setPendingNavigation(url);
      onOpenUnsavedChangesModal();
      throw "Route change aborted by user";
    };

    const handleRouteChangeError = (err: any, url: string) => {
      if (err === "Route change aborted by user") {
        // This is expected, don't log as error
        return;
      }
    };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSavedChanges.isSaved) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    // Listen to route change events
    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeError", handleRouteChangeError);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeError", handleRouteChangeError);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [router, isSavedChanges.isSaved, onOpenUnsavedChangesModal]);

  // Listen to element click events
  useEffect(() => {
    console.log('=== 🔍 CUSTOM MODELER useEffect ===');
    console.log('bpmnReactJs', bpmnReactJs.bpmnModeler);
    if (!bpmnReactJs.bpmnModeler) return;

    const handleElementClick = (event: any) => {
      console.log('=== 🎯 ELEMENT CLICK ===');
      console.log('Event:', event);

      // Get element from event
      const element = event.element;
      if (!element || !element.businessObject) {
        console.log('❌ No valid element - ignoring');
        return;
      }

      const eventInfo = element.businessObject;
      console.log('✅ Clicked element:', {
        id: eventInfo.id,
        name: eventInfo.name,
        type: eventInfo.$type,
      });

      // Ignore sequence flows and labels
      // const ignoredTypes = ["bpmn:SequenceFlow", "label"];
      // if (ignoredTypes.some((type) => eventInfo.$type?.includes(type))) {
      //   console.log("⏭️ Ignoring element type:", eventInfo.$type);
      //   return;
      // }

      const currentActivity = {
        activityID: eventInfo.id,
        activityName: eventInfo.name || '',
        activityType: eventInfo.$type,
        keyword: '',
        properties: {},
      };

      console.log('📝 Setting activityItem:', currentActivity);
      setActivityItem(currentActivity);
      console.log('✅ activityItem state updated');

      if (!isOpen) {
        console.log('🔓 Opening sidebar (was closed)');
        onOpen();
      } else {
        console.log('ℹ️ Sidebar already open');
      }

      console.log('=== END ELEMENT CLICK ===\n');
    };

    const handleDoubleClick = (event: any) => {
      if (!isOpen) {
        onOpen();
      }
    };

    const eventBus = bpmnReactJs.bpmnModeler.get('eventBus');
    console.log('✅ EventBus obtained:', eventBus);

    // Listen to element.click instead of selection.changed
    eventBus.on('element.click', handleElementClick);
    eventBus.on('element.dblclick', handleDoubleClick);

    console.log('✅ Events registered: element.click, element.dblclick');

    return () => {
      console.log('🧹 Cleaning up event listeners');
      eventBus.off('element.click', handleElementClick);
      eventBus.off('element.dblclick', handleDoubleClick);
    };
  }, [bpmnReactJs.bpmnModeler]);

  if (currentLoading) {
    return <LoadingIndicator />;
  }

  return (
    <BpmnModelerLayout
      processID={processID as string}
      processName={processName}
      isSaved={isSavedChanges.isSaved}
      version={version}
      onSaveAll={handleSaveAll}
      onPublish={handlePublish}
      onRobotCode={handleRobotCode}
      onCreateVersion={handleCreateVersion}
      onShowVersions={handleShowVersions}
      modelerRef={bpmnReactJs}
      isChatbotOpen={isChatbotOpen}
      onToggleChatbot={handleToggleChatbot}
      onApplyXml={handleApplyXml}
      tokenSimulation={tokenSimulation}
      onTokenSimulationChange={handleTokenSimulationChange}
      rightSidebar={
        <BpmnRightSidebar
          processID={processID as string}
          activityItem={activityItem}
          isOpen={isOpen}
          onClose={onClose}
          modelerRef={bpmnReactJs}
        />
      }
      bottomPanel={<BpmnBottomPanel processID={processID as string} />}
    >
      <BpmnJsReact
        mode="edit"
        useBpmnJsReact={bpmnReactJs}
        ref={ref}
        xml={currentProcessDetail?.xml}
      />

      {/* SubProcess navigation controls */}
      {bpmnReactJs.bpmnModeler && (
        <SubProcessControls
          bpmnReact={bpmnReactJs}
          onCreateProcessFromSubProcess={(info) => {
            setSubProcessInfo(info);
            onOpenCreateFromSubProcess();
          }}
        />
      )}

      {/* Undo/Redo buttons */}
      {bpmnReactJs.bpmnModeler && <UndoRedoButtons bpmnReact={bpmnReactJs} />}

      {/* Hidden components for legacy functionality */}
      {bpmnReactJs.bpmnModeler && (
        <ModelerSideBar
          isOpen={false}
          onClose={onClose}
          onOpen={onOpen}
          modeler={bpmnReactJs}
        />
      )}

      {showRobotCode && (
        <DisplayRobotCode
          compileRobotCode={() => compileRobotCode(processID as string)}
          errorTrace={errorTrace}
          setErrorTrace={setErrorTrace}
          isOpen={showRobotCode}
          onClose={() => {
            setShowRobotCode(false);
            setErrorTrace('');
          }}
        />
      )}

      {/* Create Version Modal */}
      <CreateVersionModal
        isOpen={isCreateVersionOpen}
        onClose={onCloseCreateVersion}
        onCreateVersion={(data) => mutateCreateVersion.mutate(data)}
        lastVersionTag="Autosaved"
        isLoading={mutateCreateVersion.isPending}
      />

      {/* Publish Robot Modal */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={onClosePublishModal}
        size="lg"
      >
        <ModalOverlay />
        <PublishRobotModal
          processID={processID as string}
          genRobotCode={compileRobotCodePublish}
          onSaveAll={handleSaveAll}
          onClose={onClosePublishModal}
        />
      </Modal>

      {/* Create Process from SubProcess Modal */}
      <CreateProcessFromSubProcessModal
        isOpen={isCreateFromSubProcessOpen}
        onClose={onCloseCreateFromSubProcess}
        onConfirm={handleCreateProcessFromSubProcess}
        subProcessName={subProcessInfo.name}
        elementCount={subProcessInfo.elementCount}
        hasNestedSubProcesses={subProcessInfo.hasNested}
      />

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={isUnsavedChangesModalOpen}
        onClose={handleCancelNavigation}
        onSaveAndExit={handleSaveAndExit}
        onExit={handleExit}
        isLoading={mutateSaveAll.isPending}
      />
    </BpmnModelerLayout>
  );
}

export default CustomModeler;