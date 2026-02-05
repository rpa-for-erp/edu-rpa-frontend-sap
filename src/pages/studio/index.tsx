import CustomTable from '@/components/CustomTable/CustomTable';
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Tooltip,
  useDisclosure,
  useToast,
  HStack,
  Text,
} from '@chakra-ui/react';
import { QuestionIcon, SearchIcon } from '@chakra-ui/icons';
import TemplateCard from '@/components/TemplateCard/TemplateCard';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import {
  getLocalStorageObject,
  setLocalStorageObject,
} from '@/utils/localStorageService';
import { LocalStorage } from '@/constants/localStorage';
import { Process } from '@/types/process';
import { exportFile, formatDate } from '@/utils/common';
import { VariableItem } from '@/types/variable';
import {
  defaultXML,
  deleteProcessById,
  generateProcessID,
  getProcessFromLocalStorage,
  initProcess,
} from '@/utils/processService';
import { useRouter } from 'next/router';
import { deleteVariableById } from '@/utils/variableService';
import AutomationTemplateImage from '@/assets/images/AutomationTemplate.jpg';
import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { CreateProcessDto } from '@/dtos/processDto';
import processApi from '@/apis/processApi';
import { QUERY_KEY } from '@/constants/queryKey';
import LoadingIndicator from '@/components/LoadingIndicator/LoadingIndicator';
import { ToolTipExplain } from '@/constants/description';
import { formatDateTime } from '@/utils/time';
import { GetServerSideProps } from 'next';
import { getServerSideTranslations } from '@/utils/i18n';
import { useTranslation } from 'next-i18next';

export default function Studio() {
  const router = useRouter();
  const { t } = useTranslation('studio');
  const { t: tCommon } = useTranslation('common');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDuplicateOpen,
    onOpen: onDuplicateOpen,
    onClose: onDuplicateClose,
  } = useDisclosure();
  const {
    isOpen: isShareOpen,
    onOpen: onShareOpen,
    onClose: onShareClose,
  } = useDisclosure();
  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onClose: onSettingsClose,
  } = useDisclosure();

  const initialRef = useRef<HTMLInputElement>(null);
  const descRepf = useRef<HTMLInputElement>(null);
  const finalRef = useRef<HTMLInputElement>(null);
  const duplicateNameRef = useRef<HTMLInputElement>(null);
  const shareEmailRef = useRef<HTMLInputElement>(null);
  const settingsNameRef = useRef<HTMLInputElement>(null);
  const settingsDescRef = useRef<HTMLInputElement>(null);

  const [processType, setProcessType] = useState('free');
  const [selectFilter, setSelectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>('desc');
  const [activeTab, setActiveTab] = useState<'processes' | 'templates'>(
    'processes'
  );
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(
    null
  );
  const [pinnedProcesses, setPinnedProcesses] = useState<string[]>([]);

  const toast = useToast();
  const inputFileRef = useRef<HTMLInputElement>(null);
  const queryClient = new QueryClient();

  const { data: countProcess, isLoading: countProcessLoading } = useQuery({
    queryKey: [QUERY_KEY.PROCESS_COUNT],
    queryFn: () => processApi.getNumberOfProcess(),
  });

  // TODO: update pagination
  const limit = countProcess ?? 0;
  const page = 1;

  const { data: allProcess, isLoading: isLoadingProcess } = useQuery({
    queryKey: [QUERY_KEY.PROCESS_LIST],
    queryFn: () => processApi.getAllProcess(limit, page),
  });

  // console.log('All processes', allProcess);

  const syncBackendToLocalStorage = () => {
    return (
      allProcess &&
      allProcess?.map((item: any) => {
        return {
          processID: item.id,
          processName: item.name,
          processDesc: item.description,
          xml: '',
          activities: [],
          variables: [],
          sharedByUser: item.sharedByUser,
          version: item.version,
          workspaceId: item.workspaceId,
          scope: item.scope
        };
      })
    );
  };

  useEffect(() => {
    if (isLoadingProcess) return;
    localStorage.setItem(
      LocalStorage.PROCESS_LIST,
      JSON.stringify(syncBackendToLocalStorage())
    );

    // Load pinned processes
    const savedPinned = localStorage.getItem('pinnedProcesses');
    if (savedPinned) {
      setPinnedProcesses(JSON.parse(savedPinned));
    }
  }, [isLoadingProcess]);

  useEffect(() => {
    const variableStorage = localStorage.getItem(LocalStorage.VARIABLE_LIST);
    if (!variableStorage) {
      localStorage.setItem(LocalStorage.VARIABLE_LIST, JSON.stringify([]));
    } else {
      preProcessingVariableList();
      // console.log(
      //   'Variable Storage',
      //   getLocalStorageObject(LocalStorage.VARIABLE_LIST)
      // );
    }
  }, [isLoadingProcess]);

  const preProcessingVariableList = () => {
    const processStorage = getLocalStorageObject(LocalStorage.PROCESS_LIST);
    const variableStorage = getLocalStorageObject(LocalStorage.VARIABLE_LIST);
    const processList =
      processStorage?.map((item: Process) => item.processID) ?? [];
    const filteredVariableStorage = variableStorage.filter(
      (variable: VariableItem) => processList.includes(variable.processID)
    );
    setLocalStorageObject(LocalStorage.VARIABLE_LIST, filteredVariableStorage);
  };

  const formatData =
    allProcess &&
    allProcess?.map((item: any) => {
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        sharedBy: item.sharedByUser ? item.sharedByUser.name : 'me',
        last_modified: formatDateTime(item.updatedAt),
        last_modified_timestamp: new Date(item.updatedAt).getTime(),
        version: item.version,
        status: item.status || 'draft',
        pinned: pinnedProcesses.includes(item.id),
      };
    });

  // Apply filters, search, and sort
  let filteredData = formatData ?? [];

  // Search by name
  if (searchQuery) {
    filteredData = filteredData.filter((item: any) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Filter by status
  if (statusFilter && statusFilter !== 'all') {
    filteredData = filteredData.filter(
      (item: any) => item.status === statusFilter
    );
  }

  // Filter by owner
  if (ownerFilter && ownerFilter !== 'all') {
    filteredData = filteredData.filter(
      (item: any) => item.sharedBy === ownerFilter
    );
  }

  // Sort by last modified
  if (sortOrder) {
    filteredData = [...filteredData].sort((a: any, b: any) => {
      if (sortOrder === 'asc') {
        return a.last_modified_timestamp - b.last_modified_timestamp;
      } else {
        return b.last_modified_timestamp - a.last_modified_timestamp;
      }
    });
  }

  // Sort pinned to top
  filteredData = [...filteredData].sort((a: any, b: any) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  const tableProps = {
    header: [
      t('table.processName'),
      t('table.processDescription'),
      t('table.owner'),
      t('table.lastModified'),
      t('table.version'),
      t('table.status'),
    ],
    headerKeys: [
      'name',
      'description',
      'sharedBy',
      'last_modified',
      'version',
      'status',
    ],
    data: filteredData,
  };

  const handleCreateProcessWithApi = useMutation({
    mutationFn: async (payload: CreateProcessDto) => {
      return await processApi.createProcess(payload);
    },
    onSuccess: () => {
      console.log('Process import sucessfully');
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const handleDeleteProcessWithApi = useMutation({
    mutationFn: async (id: string) => {
      return await processApi.deleteProcessByID(id);
    },
    onSuccess: () => {
      queryClient.refetchQueries([QUERY_KEY.PROCESS_LIST] as any);
      toast({
        title: t('toasts.deleteSuccess'),
        status: 'success',
        position: 'top-right',
        duration: 1000,
        isClosable: true,
      });
      router.reload();
    },
  });

  const handleInsertToBackend = (initialProcess: any) => {
    const createProcessPayloadAPI = {
      id: initialProcess.processID,
      name: initialProcess.processName,
      description: initialProcess.processDesc,
      xml: initialProcess.xml,
    };
    // console.log("Import payload", createProcessPayloadAPI);
    handleCreateProcessWithApi.mutate(createProcessPayloadAPI as any);
  };

  const handleCreateNewProcess = () => {
    const processID = generateProcessID();
    const xml = defaultXML(processID);
    const initialProcess = initProcess(
      processID,
      xml,
      initialRef.current?.value as string,
      descRepf.current?.value as string,
      processType
    );
    setLocalStorageObject(LocalStorage.PROCESS_LIST, [
      ...getLocalStorageObject(LocalStorage.PROCESS_LIST),
      initialProcess,
    ]);

    // add to backend
    handleInsertToBackend(initialProcess);

    router.push(
      `/studio/modeler/${processID}?name=${initialProcess.processName}&version=0`
    );
  };

  const handleDeleteProcessByID = (processID: string) => {
    const processListAfterDelete = deleteProcessById(processID);
    const variableListAfterDelete = deleteVariableById(processID);
    setLocalStorageObject(LocalStorage.PROCESS_LIST, processListAfterDelete);
    setLocalStorageObject(LocalStorage.VARIABLE_LIST, variableListAfterDelete);
    console.log('Detele ProcessID', processID);
    handleDeleteProcessWithApi.mutate(processID);
  };

  const handleEditProcessByID = (
    processID: string,
    name: string,
    version: number
  ) => {
    router.push(`/studio/modeler/${processID}?name=${name}&version=${version}`);
  };

  const handleDownloadProcessByID = (processID: string) => {
    const processXML = getProcessFromLocalStorage(processID).xml;
    exportFile(processXML, `${processID}.xml`);
  };

  const handleImportBPMN = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files ? event.target.files[0] : null;

    if (!file) {
      throw new Error('No file selected.');
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        // console.log("Import BPMN", e.target?.result);
        const xml = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'text/xml');
        const bpmnNamespace = 'http://www.omg.org/spec/BPMN/20100524/MODEL';
        const processElement = xmlDoc.getElementsByTagNameNS(
          bpmnNamespace,
          'process'
        )[0];
        const processID = processElement.getAttribute('id');

        const importProcess = {
          processName: processID,
          processType: 'free',
          processDesc: 'Import XML',
          processID: processID,
          xml: xml,
          activities: [],
          variables: {},
        };

        setLocalStorageObject(LocalStorage.PROCESS_LIST, [
          ...getLocalStorageObject(LocalStorage.PROCESS_LIST),
          importProcess,
        ]);

        handleInsertToBackend(importProcess);
        router.push(
          `/studio/modeler/${processID}?name=${importProcess.processName}&version=0`
        );
      } catch (error) {
        console.error('Error during XML file import:', error);
        toast({
          title: 'Error during XML file import',
          description: 'Please check the XML file and try again.',
          position: 'top-right',
          status: 'error',
          duration: 2000,
          isClosable: true,
        });
        throw error;
      }
    };

    reader.readAsText(file);
  };

  const handleDuplicateProcess = (processId: string) => {
    const process = allProcess?.find((p: any) => p.id === processId);
    if (process) {
      setSelectedProcessId(processId);
      onDuplicateOpen();
    }
  };

  const confirmDuplicate = () => {
    if (!selectedProcessId || !duplicateNameRef.current?.value) return;

    const process = allProcess?.find((p: any) => p.id === selectedProcessId);
    if (!process) return;

    const newProcessID = generateProcessID();
    const xml = defaultXML(newProcessID);
    const duplicatedProcess = initProcess(
      newProcessID,
      xml,
      duplicateNameRef.current.value,
      process.description + ' (Copy)',
      'free'
    );

    setLocalStorageObject(LocalStorage.PROCESS_LIST, [
      ...getLocalStorageObject(LocalStorage.PROCESS_LIST),
      duplicatedProcess,
    ]);

    handleInsertToBackend(duplicatedProcess);

    toast({
      title: t('toasts.duplicateSuccess'),
      status: 'success',
      position: 'top-right',
      duration: 2000,
      isClosable: true,
    });

    onDuplicateClose();
    router.reload();
  };

  const handleShareProcess = (processId: string) => {
    setSelectedProcessId(processId);
    onShareOpen();
  };

  const confirmShare = () => {
    if (!shareEmailRef.current?.value) {
      toast({
        title: t('toasts.emailRequired'),
        status: 'warning',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    // TODO: Implement actual share API call
    toast({
      title: t('toasts.shareSuccess', { email: shareEmailRef.current.value }),
      status: 'success',
      position: 'top-right',
      duration: 2000,
      isClosable: true,
    });

    onShareClose();
  };

  const handlePinProcess = (processId: string) => {
    const newPinnedProcesses = pinnedProcesses.includes(processId)
      ? pinnedProcesses.filter((id) => id !== processId)
      : [...pinnedProcesses, processId];

    setPinnedProcesses(newPinnedProcesses);
    localStorage.setItem('pinnedProcesses', JSON.stringify(newPinnedProcesses));

    toast({
      title: pinnedProcesses.includes(processId)
        ? t('toasts.unpinSuccess')
        : t('toasts.pinSuccess'),
      status: 'success',
      position: 'top-right',
      duration: 1000,
      isClosable: true,
    });
  };

  const handleProcessSettings = (processId: string) => {
    const process = allProcess?.find((p: any) => p.id === processId);
    if (process) {
      setSelectedProcessId(processId);
      onSettingsOpen();
    }
  };

  const confirmProcessSettings = async () => {
    if (!selectedProcessId) return;

    const newName = settingsNameRef.current?.value;
    const newDesc = settingsDescRef.current?.value;

    if (!newName) {
      toast({
        title: t('toasts.nameRequired'),
        status: 'warning',
        position: 'top-right',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    // TODO: Implement actual update API call
    toast({
      title: t('toasts.settingsSuccess'),
      status: 'success',
      position: 'top-right',
      duration: 2000,
      isClosable: true,
    });

    onSettingsClose();
    router.reload();
  };

  const handleSortToggle = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  if (isLoadingProcess || handleDeleteProcessWithApi.isPending) {
    return <LoadingIndicator />;
  }

  return (
    <div className="mb-[200px">
      <SidebarContent>
        <div className="flex items-center justify-between w-90 mx-auto mb-[10px]">
          <div className="relative flex items-center gap-[30px] border-b border-gray-200">
            <button
              onClick={() => setActiveTab('processes')}
              className={`px-4 py-3 font-semibold text-lg transition-colors duration-300 ${
                activeTab === 'processes'
                  ? 'text-[#319795]'
                  : 'text-gray-600 hover:text-[#319795]'
              }`}
            >
              {t('tabs.processes')}
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-3 font-semibold text-lg transition-colors duration-300 ${
                activeTab === 'templates'
                  ? 'text-[#319795]'
                  : 'text-gray-600 hover:text-[#319795]'
              }`}
            >
              {t('tabs.templates')}
            </button>
            {/* Sliding underline */}
            <div
              className={`absolute bottom-0 h-[3px] bg-[#319795] transition-all duration-300 ease-in-out ${
                activeTab === 'processes'
                  ? 'left-0 w-[130px]'
                  : 'left-[150px] w-[120px]'
              }`}
            ></div>
          </div>
          <Tooltip
            hasArrow
            label={tCommon('tooltips.studioService')}
            bg="gray.300"
            color="black"
          >
            <QuestionIcon color="blue.500" />
          </Tooltip>
        </div>
        {activeTab === 'processes' && (
          <div className="flex justify-between w-90 mx-auto my-[25px] ">
            <div className="flex gap-[10px] items-center">
              <InputGroup width="320px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.500" />
                </InputLeftElement>
                <Input
                  bg="white"
                  type="text"
                  placeholder={t('filters.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
              <Box>
                <HStack spacing={2}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {t('filters.owner')}:
                  </Text>
                  <Select
                    size="sm"
                    width="80px"
                    bg="white"
                    value={ownerFilter}
                    onChange={(e) => setOwnerFilter(e.target.value)}
                  >
                    <option value="all">{t('filters.all')}</option>
                    {allProcess &&
                      Array.from(
                        new Set(
                          allProcess.map((p: any) =>
                            p.sharedByUser ? p.sharedByUser.name : 'me'
                          )
                        )
                      ).map((owner: any) => (
                        <option key={owner} value={owner}>
                          {owner === 'me' ? t('filters.me') : owner}
                        </option>
                      ))}
                  </Select>
                </HStack>
              </Box>
              <Box>
                <HStack spacing={2}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {t('filters.status')}:
                  </Text>
                  <Select
                    size="sm"
                    width="100px"
                    bg="white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">{t('filters.all')}</option>
                    <option value="draft">{t('filters.draft')}</option>
                    <option value="deployed">{t('filters.published')}</option>
                  </Select>
                </HStack>
              </Box>
            </div>
            <div className="flex justify-between gap-[10px]">
              <Button colorScheme="teal" onClick={onOpen}>
                {t('actions.create')}
              </Button>
              <input
                type="file"
                id="myFile"
                name="filename"
                className="hidden"
                ref={inputFileRef}
                onChange={handleImportBPMN}
              />
              <Button
                variant="outline"
                colorScheme="teal"
                onClick={() => {
                  if (inputFileRef.current) {
                    inputFileRef.current.click();
                  } else {
                    console.error('BPMN file not found!');
                  }
                }}
              >
                {t('actions.import')}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'processes' && (
          <>
            <div className="w-90 m-auto">
              <CustomTable
                header={tableProps.header}
                headerKeys={tableProps.headerKeys}
                data={tableProps.data}
                onView={handleEditProcessByID}
                onDownload={handleDownloadProcessByID}
                onDelete={handleDeleteProcessByID}
                onDuplicate={handleDuplicateProcess}
                onShare={handleShareProcess}
                onPin={handlePinProcess}
                onProcessSettings={handleProcessSettings}
                sortOrder={sortOrder}
                onSortChange={handleSortToggle}
                isLoading={countProcessLoading}
              />
            </div>

            {tableProps.data.length === 0 && !isLoadingProcess && (
              <div className="w-90 m-auto flex justify-center items-center mt-10">
                <div className="text-center">
                  <div className="text-2xl font-bold">No processes here</div>
                  <div className="text-gray-500">
                    Create a new process or switch to templates
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'templates' && (
          <div className="w-90 m-auto">
            <div className="grid grid-cols-3 gap-[15px] mt-[30px]">
              <TemplateCard
                image={AutomationTemplateImage}
                title="Grading 100 English Exams from sample document"
                description="Evaluating 100 English Exam Papers from the provided sample document, ensuring accuracy and fairness throughout the grading process..."
              />
              <TemplateCard
                image={AutomationTemplateImage}
                title="Get 100 emails from Inbox"
                description="Retrieve 100 emails from your Inbox, managing and organizing your electronic correspondence efficiently and effectively..."
              />
              <TemplateCard
                image={AutomationTemplateImage}
                title="Export Data To Google Sheet"
                description="Seamlessly transfer your data directly to Google Sheets with our intuitive export feature. Whether you're managing extensive datasets, tracking project progress, or analyzing financial records, our tool ensures your information is synchronized in real-time."
              />
              <TemplateCard
                image={AutomationTemplateImage}
                title="Extract Text From An Image"
                description="Unlock the hidden potential of your images with our cutting-edge templates. It's your gateway to converting visual content into actionable text, making information more accessible and versatile than ever before."
              />
            </div>
          </div>
        )}

        {/* Create New Process Modal */}
        <Modal
          initialFocusRef={initialRef}
          finalFocusRef={finalRef}
          isOpen={isOpen}
          onClose={onClose}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{t('modals.createProcess.title')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <FormControl>
                <FormLabel>{t('modals.createProcess.nameLabel')}</FormLabel>
                <Input
                  ref={initialRef}
                  placeholder={t('modals.createProcess.namePlaceholder')}
                />
              </FormControl>
              <FormControl>
                <FormLabel>{t('modals.createProcess.descLabel')}</FormLabel>
                <Input
                  ref={descRepf}
                  placeholder={t('modals.createProcess.descPlaceholder')}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme="teal"
                variant="outline"
                mr={3}
                onClick={onClose}
              >
                {t('modals.createProcess.cancel')}
              </Button>
              <Button colorScheme="teal" onClick={handleCreateNewProcess}>
                {t('modals.createProcess.create')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Duplicate Process Modal */}
        <Modal
          initialFocusRef={duplicateNameRef}
          isOpen={isDuplicateOpen}
          onClose={onDuplicateClose}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{t('modals.duplicate.title')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <FormControl>
                <FormLabel>{t('modals.duplicate.nameLabel')}</FormLabel>
                <Input
                  ref={duplicateNameRef}
                  placeholder={t('modals.duplicate.namePlaceholder')}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme="teal"
                variant="outline"
                mr={3}
                onClick={onDuplicateClose}
              >
                {t('modals.duplicate.cancel')}
              </Button>
              <Button colorScheme="teal" onClick={confirmDuplicate}>
                {t('modals.duplicate.duplicate')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Share Process Modal */}
        <Modal
          initialFocusRef={shareEmailRef}
          isOpen={isShareOpen}
          onClose={onShareClose}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{t('modals.share.title')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <FormControl>
                <FormLabel>{t('modals.share.emailLabel')}</FormLabel>
                <Input
                  ref={shareEmailRef}
                  type="email"
                  placeholder={t('modals.share.emailPlaceholder')}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme="teal"
                variant="outline"
                mr={3}
                onClick={onShareClose}
              >
                {t('modals.share.cancel')}
              </Button>
              <Button colorScheme="teal" onClick={confirmShare}>
                {t('modals.share.share')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Process Settings Modal */}
        <Modal
          initialFocusRef={settingsNameRef}
          isOpen={isSettingsOpen}
          onClose={onSettingsClose}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{t('modals.settings.title')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <FormControl mb={4}>
                <FormLabel>{t('modals.settings.nameLabel')}</FormLabel>
                <Input
                  ref={settingsNameRef}
                  defaultValue={
                    allProcess?.find((p: any) => p.id === selectedProcessId)
                      ?.name
                  }
                  placeholder="Process name"
                  borderColor="teal.500"
                  borderWidth="2px"
                  _hover={{ borderColor: 'teal.600' }}
                  _focus={{
                    borderColor: 'teal.600',
                    boxShadow: '0 0 0 1px #319795',
                  }}
                />
              </FormControl>
              <FormControl>
                <FormLabel>{t('modals.settings.descLabel')}</FormLabel>
                <Input
                  ref={settingsDescRef}
                  defaultValue={
                    allProcess?.find((p: any) => p.id === selectedProcessId)
                      ?.description
                  }
                  placeholder={t('modals.settings.descLabel')}
                  borderColor="teal.500"
                  borderWidth="2px"
                  _hover={{ borderColor: 'teal.600' }}
                  _focus={{
                    borderColor: 'teal.600',
                    boxShadow: '0 0 0 1px #319795',
                  }}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme="teal"
                variant="outline"
                mr={3}
                onClick={onSettingsClose}
              >
                {t('modals.settings.cancel')}
              </Button>
              <Button colorScheme="teal" onClick={confirmProcessSettings}>
                {t('modals.settings.save')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </SidebarContent>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      ...(await getServerSideTranslations(context, [
        'common',
        'sidebar',
        'navbar',
        'studio',
        'activities',
      ])),
    },
  };
};
