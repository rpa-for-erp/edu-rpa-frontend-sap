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
import { useTranslation } from 'next-i18next';

interface OriginalObject {
  [key: string]: {
    type: string;
    isArgument: boolean;
    defaultValue: string;
  };
}

function CustomModeler() {
  const router = useRouter();
  const { t } = useTranslation('studio');
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
  const [errorTrace, setErrorTrace] = useState<string>('');
  const [showRobotCode, setShowRobotCode] = useState(false);
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
  const isSavedChanges = useSelector(bpmnSelector);

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

    const currentprocessID = getProcessFromLocalStorage(processID as string);
    const updateStorageByID = {
      ...currentprocessID,
      processID: processID as string,
      xml: currentProcessDetail.xml || '',
      variables: currentProcessDetail.variables || {},
      activities: currentProcessDetail.activities || [],
    };
    const replaceStorageSnapshot = updateProcessInProcessList(
      processID as string,
      updateStorageByID
    );
    setLocalStorageObject(LocalStorage.PROCESS_LIST, replaceStorageSnapshot);
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
        title: t('modeler.saveSuccess'),
        status: 'success',
        position: 'top-right',
        duration: 1000,
        isClosable: true,
      });
      dispatch(isSavedChange(true));
    },
    onError: () => {
      toast({
        title: t('modeler.saveError'),
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
            processID: processID as string,
            xml: xmlResult.xml,
            activities: activityList,
          };
          const newLocalStorage = updateLocalStorage(updatedProcess);
          setLocalStorageObject(LocalStorage.PROCESS_LIST, newLocalStorage);
        } catch (syncError) {
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
        title: t('modeler.versionCreatedSuccess'),
        status: 'success',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
      onCloseCreateVersion();
    },
    onError: (error: any) => {
      toast({
        title: t('modeler.versionCreatedError'),
        description: error?.message || t('modeler.errorOccurred'),
        status: 'error',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
    },
  });

  const handleSaveAll = async () => {
    // First, sync XML and activities from modeler to localStorage
    // This ensures we save the latest canvas state including node names
    if (bpmnReactJs.bpmnModeler) {
      try {
        const xmlResult = await bpmnReactJs.saveXML();
        const activityList = bpmnReactJs
          .getElementList(processID as string)
          .slice(1);

        const currentProcess = getProcessFromLocalStorage(processID as string);
        const updatedProcess = {
          ...currentProcess,
          processID: processID as string,
          xml: xmlResult.xml,
          activities: activityList,
        };
        const newLocalStorage = updateLocalStorage(updatedProcess);
        setLocalStorageObject(LocalStorage.PROCESS_LIST, newLocalStorage);
      } catch (syncError) {
        toast({
          title: t('modeler.syncError'),
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
        title: t('modeler.refreshError'),
        status: 'error',
        position: 'top-right',
        duration: 1000,
        isClosable: true,
      });
    } else {
      const variableListByID = getVariableItemFromLocalStorage(
        processID as string
      );
      const refactoredVariables = convertToRefactoredObject(variableListByID);
      const payload = {
        xml: processProperties.xml,
        activities: processProperties.activities,
        variables: refactoredVariables ?? {},
      };
      mutateSaveAll.mutate(payload);
    }
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
          processID: processID as string,
          xml: xmlResult.xml,
          activities: activityList,
        };
        const newLocalStorage = updateLocalStorage(updatedProcess);
        setLocalStorageObject(LocalStorage.PROCESS_LIST, newLocalStorage);
      } catch (syncError) {
        toast({
          title: t('modeler.failedSyncWorkflow'),
          description: t('modeler.pleaseTryAgain'),
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
        title: t('modeler.processDataNotReady'),
        description: t('modeler.processDataNotReadyDesc'),
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
            title: t('modeler.cannotPublishNested'),
            description: t('modeler.cannotPublishNestedDesc'),
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
          title: t('modeler.bpmnParseError'),
          description: `${error.message}: ${error.bpmnId}`,
          status: 'error',
          position: 'top-right',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: t('modeler.cannotPublishRobot'),
          description:
            (error as Error).message || t('modeler.failedValidateCode'),
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
        title: t('modeler.versionNotAvailable'),
        description: t('modeler.versionNotAvailableDesc'),
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
        throw new Error(t('modeler.modelerNotInitialized'));
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
        title: t('modeler.processCreatedSuccess'),
        description: t('modeler.processCreatedSuccessDesc', {
          name: newProcessName,
          count: subProcessData.activities.length,
        }),
        status: 'success',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
      });

      onCloseCreateFromSubProcess();
    } catch (error: any) {
      console.error('Error creating process from subprocess:', error);
      toast({
        title: t('modeler.failedCreateProcess'),
        description: error?.message || t('modeler.unexpectedError'),
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
        title: t('modeler.versionNotAvailable'),
        description: t('modeler.versionNotAvailableDesc'),
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
        title: t('modeler.bpmnAppliedSuccess'),
        description: t('modeler.bpmnAppliedDesc'),
        status: 'success',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('❌ [AI Chatbot] Error applying XML:', error);
      toast({
        title: t('modeler.bpmnAppliedError'),
        description: error?.message || t('modeler.unexpectedError'),
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
            title: t('modeler.nestedSubprocessWarning'),
            description: t('modeler.nestedSubprocessDesc'),
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
          title: t('modeler.syncBeforeCompile'),
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
    </BpmnModelerLayout>
  );
}

export default CustomModeler;
