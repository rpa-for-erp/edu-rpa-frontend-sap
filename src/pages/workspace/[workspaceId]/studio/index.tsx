import CustomTable from "@/components/CustomTable/CustomTable";
import React, { useEffect, useRef, useState } from "react";
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
} from "@chakra-ui/react";
import { QuestionIcon, SearchIcon } from "@chakra-ui/icons";
import TemplateCard from "@/components/TemplateCard/TemplateCard";
import SidebarContent from "@/components/Sidebar/SidebarContent/SidebarContent";
import {
  getLocalStorageObject,
  setLocalStorageObject,
} from "@/utils/localStorageService";
import { LocalStorage } from "@/constants/localStorage";
import { Process } from "@/types/process";
import { exportFile, formatDate } from "@/utils/common";
import { VariableItem } from "@/types/variable";
import {
  defaultXML,
  deleteProcessById,
  generateProcessID,
  getProcessFromLocalStorage,
  initProcess,
} from "@/utils/processService";
import { useRouter } from "next/router";
import { deleteVariableById } from "@/utils/variableService";
import AutomationTemplateImage from "@/assets/images/AutomationTemplate.jpg";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { CreateProcessDto } from "@/dtos/processDto";
import workspaceApi from "@/apis/workspaceApi";
import { QUERY_KEY } from "@/constants/queryKey";
import LoadingIndicator from "@/components/LoadingIndicator/LoadingIndicator";
import { ToolTipExplain } from "@/constants/description";
import { formatDateTime } from "@/utils/time";
import WorkspaceLayout from "@/components/Layouts/WorkspaceLayout";

export default function WorkspaceStudio() {
  const router = useRouter();
  const { workspaceId } = router.query;
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

  const [processType, setProcessType] = useState("free");
  const [selectFilter, setSelectFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>("desc");
  const [activeTab, setActiveTab] = useState<"processes" | "templates">(
    "processes"
  );
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(
    null
  );
  const [pinnedProcesses, setPinnedProcesses] = useState<string[]>([]);

  const toast = useToast();
  const inputFileRef = useRef<HTMLInputElement>(null);
  const queryClient = new QueryClient();

  const { data: countProcess, isLoading: countProcessLoading } = useQuery({
    queryKey: [QUERY_KEY.PROCESS_COUNT, workspaceId],
    queryFn: () => workspaceApi.getWorkspaceProcessCount(workspaceId as string),
    enabled: !!workspaceId,
  });

  // TODO: update pagination
  const limit = countProcess ?? 20;
  const page = 1;

  const { data: allProcess, isLoading: isLoadingProcess } = useQuery({
    queryKey: [QUERY_KEY.PROCESS_LIST, workspaceId],
    queryFn: () => workspaceApi.getWorkspaceProcesses(workspaceId as string, limit, page),
    enabled: !!workspaceId,
  });

  const syncBackendToLocalStorage = () => {
    return (
      allProcess && Array.isArray(allProcess)
        ? allProcess.map((item: any) => {
            return {
              processID: item.id,
              processName: item.name,
              processDesc: item.description,
              xml: "",
              activities: [],
              variables: [],
              sharedByUser: item.sharedByUser,
            };
          })
        : []
    );
  };

  useEffect(() => {
    if (isLoadingProcess) return;
    localStorage.setItem(
      LocalStorage.PROCESS_LIST,
      JSON.stringify(syncBackendToLocalStorage())
    );

    // Load pinned processes
    const savedPinned = localStorage.getItem("pinnedProcesses");
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
    allProcess && Array.isArray(allProcess)
      ? 
      allProcess.map((item: any) => {
          return {
            id: item.id,
            name: item.name,
            description: item.description,
            sharedBy: item.sharedByUser ? item.sharedByUser.name : "me",
            last_modified: formatDateTime(item.updatedAt),
            last_modified_timestamp: new Date(item.updatedAt).getTime(),
            version: item.version,
            status: item.status || "draft",
            pinned: pinnedProcesses.includes(item.id),
          };
        })
      : [];

  // Apply filters, search, and sort
  let filteredData = formatData ?? [];

  // Search by name
  if (searchQuery) {
    filteredData = filteredData.filter((item: any) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Filter by status
  if (statusFilter && statusFilter !== "all") {
    filteredData = filteredData.filter(
      (item: any) => item.status === statusFilter
    );
  }

  // Filter by owner
  if (ownerFilter && ownerFilter !== "all") {
    filteredData = filteredData.filter(
      (item: any) => item.sharedBy === ownerFilter
    );
  }

  // Sort by last modified
  if (sortOrder) {
    filteredData = [...filteredData].sort((a: any, b: any) => {
      if (sortOrder === "asc") {
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
      "Process name",
      "Process description",
      "Owner",
      "Last Modified",
      "Version",
      "Status",
    ],
    headerKeys: [
      "name",
      "description",
      "sharedBy",
      "last_modified",
      "version",
      "status",
    ],
    data: filteredData,
  };

  const handleCreateProcessWithApi = useMutation({
    mutationFn: async (payload: CreateProcessDto) => {
      return await workspaceApi.createWorkspaceProcess(workspaceId as string, payload);
    },
    onSuccess: () => {
      console.log("Process import sucessfully");
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const handleDeleteProcessWithApi = useMutation({
    mutationFn: async (id: string) => {
      return await workspaceApi.deleteWorkspaceProcess(workspaceId as string, id);
    },
    onSuccess: () => {
      queryClient.refetchQueries([QUERY_KEY.PROCESS_LIST, workspaceId] as any);
      toast({
        title: "Delete item sucessfully!",
        status: "success",
        position: "top-right",
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
      `/workspace/${workspaceId}/studio/modeler/${processID}?name=${initialProcess.processName}&version=0`
    );
  };

  const handleDeleteProcessByID = (processID: string) => {
    const processListAfterDelete = deleteProcessById(processID);
    const variableListAfterDelete = deleteVariableById(processID);
    setLocalStorageObject(LocalStorage.PROCESS_LIST, processListAfterDelete);
    setLocalStorageObject(LocalStorage.VARIABLE_LIST, variableListAfterDelete);
    console.log("Detele ProcessID", processID);
    handleDeleteProcessWithApi.mutate(processID);
  };

  const handleEditProcessByID = (
    processID: string,
    name: string,
    version: number
  ) => {
    router.push(`/workspace/${workspaceId}/studio/modeler/${processID}?name=${name}&version=${version}`);
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
      throw new Error("No file selected.");
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const xml = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "text/xml");
        const bpmnNamespace = "http://www.omg.org/spec/BPMN/20100524/MODEL";
        const processElement = xmlDoc.getElementsByTagNameNS(
          bpmnNamespace,
          "process"
        )[0];
        const processID = processElement.getAttribute("id");

        const importProcess = {
          processName: processID,
          processType: "free",
          processDesc: "Import XML",
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
          `/workspace/${workspaceId}/studio/modeler/${processID}?name=${importProcess.processName}&version=0`
        );
      } catch (error) {
        console.error("Error during XML file import:", error);
        toast({
          title: "Error during XML file import",
          description: "Please check the XML file and try again.",
          position: "top-right",
          status: "error",
          duration: 2000,
          isClosable: true,
        });
        throw error;
      }
    };

    reader.readAsText(file);
  };

  const handleDuplicateProcess = (processId: string) => {
    const process = Array.isArray(allProcess) ? allProcess.find((p: any) => p.id === processId) : null;
    if (process) {
      setSelectedProcessId(processId);
      onDuplicateOpen();
    }
  };

  const confirmDuplicate = () => {
    if (!selectedProcessId || !duplicateNameRef.current?.value) return;

    const process = Array.isArray(allProcess) ? allProcess.find((p: any) => p.id === selectedProcessId) : null;
    if (!process) return;

    const newProcessID = generateProcessID();
    const xml = defaultXML(newProcessID);
    const duplicatedProcess = initProcess(
      newProcessID,
      xml,
      duplicateNameRef.current.value,
      process.description + " (Copy)",
      "free"
    );

    setLocalStorageObject(LocalStorage.PROCESS_LIST, [
      ...getLocalStorageObject(LocalStorage.PROCESS_LIST),
      duplicatedProcess,
    ]);

    handleInsertToBackend(duplicatedProcess);

    toast({
      title: "Process duplicated successfully!",
      status: "success",
      position: "top-right",
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
        title: "Please enter an email address",
        status: "warning",
        position: "top-right",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    // TODO: Implement actual share API call
    toast({
      title: `Process shared with ${shareEmailRef.current.value}`,
      status: "success",
      position: "top-right",
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
    localStorage.setItem("pinnedProcesses", JSON.stringify(newPinnedProcesses));

    toast({
      title: pinnedProcesses.includes(processId)
        ? "Process unpinned"
        : "Process pinned",
      status: "success",
      position: "top-right",
      duration: 1000,
      isClosable: true,
    });
  };

  const handleProcessSettings = (processId: string) => {
    const process = Array.isArray(allProcess) ? allProcess.find((p: any) => p.id === processId) : null;
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
        title: "Process name is required",
        status: "warning",
        position: "top-right",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    // TODO: Implement actual update API call
    toast({
      title: "Process settings updated successfully!",
      status: "success",
      position: "top-right",
      duration: 2000,
      isClosable: true,
    });

    onSettingsClose();
    router.reload();
  };

  const handleSortToggle = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  if (isLoadingProcess || handleDeleteProcessWithApi.isPending) {
    return (
      <WorkspaceLayout>
        <LoadingIndicator />
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="mb-[200px">
        <SidebarContent>
          <div className="flex items-center justify-between w-90 mx-auto mb-[10px]">
            <div className="relative flex items-center gap-[30px] border-b border-gray-200">
              <button
                onClick={() => setActiveTab("processes")}
                className={`px-4 py-3 font-semibold text-lg transition-colors duration-300 ${
                  activeTab === "processes"
                    ? "text-[#319795]"
                    : "text-gray-600 hover:text-[#319795]"
                }`}
              >
                Process List
              </button>
              <button
                onClick={() => setActiveTab("templates")}
                className={`px-4 py-3 font-semibold text-lg transition-colors duration-300 ${
                  activeTab === "templates"
                    ? "text-[#319795]"
                    : "text-gray-600 hover:text-[#319795]"
                }`}
              >
                Templates
              </button>
              {/* Sliding underline */}
              <div
                className={`absolute bottom-0 h-[3px] bg-[#319795] transition-all duration-300 ease-in-out ${
                  activeTab === "processes"
                    ? "left-0 w-[130px]"
                    : "left-[150px] w-[120px]"
                }`}
              ></div>
            </div>
            <Tooltip
              hasArrow
              label={ToolTipExplain.STUDIO_SERVICE}
              bg="gray.300"
              color="black"
            >
              <QuestionIcon color="blue.500" />
            </Tooltip>
          </div>
          {activeTab === "processes" && (
            <div className="flex justify-between w-90 mx-auto my-[25px] ">
              <div className="flex gap-[10px] items-center">
                <InputGroup width="320px">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.500" />
                  </InputLeftElement>
                  <Input
                    bg="white"
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
                <Box>
                  <HStack spacing={2}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Owner:
                    </Text>
                    <Select
                      size="sm"
                      width="80px"
                      bg="white"
                      value={ownerFilter}
                      onChange={(e) => setOwnerFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      {allProcess && Array.isArray(allProcess) &&
                        Array.from(
                          new Set(
                            allProcess.map((p: any) =>
                              p.sharedByUser ? p.sharedByUser.name : "me"
                            )
                          )
                        ).map((owner: any) => (
                          <option key={owner} value={owner}>
                            {owner}
                          </option>
                        ))}
                    </Select>
                  </HStack>
                </Box>
                <Box>
                  <HStack spacing={2}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Status:
                    </Text>
                    <Select
                      size="sm"
                      width="80px"
                      bg="white"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="draft">draft</option>
                      <option value="deployed">deployed</option>
                    </Select>
                  </HStack>
                </Box>
              </div>
              <div className="flex justify-between gap-[10px]">
                <Button colorScheme="teal" onClick={onOpen}>
                  New Process
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
                      console.error("BPMN file not found!");
                    }
                  }}
                >
                  Import Process
                </Button>
              </div>
            </div>
          )}

          {activeTab === "processes" && (
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

          {activeTab === "templates" && (
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
              <ModalHeader>Create new process</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <FormControl>
                  <FormLabel>Process name</FormLabel>
                  <Input ref={initialRef} placeholder="Process name" />
                </FormControl>
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Input ref={descRepf} placeholder="Your description" />
                </FormControl>
              </ModalBody>
              <ModalFooter>
                <Button
                  colorScheme="teal"
                  variant="outline"
                  mr={3}
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button colorScheme="teal" onClick={handleCreateNewProcess}>
                  Save
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
              <ModalHeader>Duplicate Process</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <FormControl>
                  <FormLabel>New Process Name</FormLabel>
                  <Input
                    ref={duplicateNameRef}
                    placeholder="Enter new process name"
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
                  Cancel
                </Button>
                <Button colorScheme="teal" onClick={confirmDuplicate}>
                  Duplicate
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
              <ModalHeader>Share Process</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <FormControl>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    ref={shareEmailRef}
                    type="email"
                    placeholder="Enter email to share with"
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
                  Cancel
                </Button>
                <Button colorScheme="teal" onClick={confirmShare}>
                  Share
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
              <ModalHeader>Process Settings</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <FormControl mb={4}>
                  <FormLabel>Process Name</FormLabel>
                  <Input
                    ref={settingsNameRef}
                    defaultValue={
                      Array.isArray(allProcess)
                        ? allProcess.find((p: any) => p.id === selectedProcessId)?.name
                        : ''
                    }
                    placeholder="Process name"
                    borderColor="teal.500"
                    borderWidth="2px"
                    _hover={{ borderColor: "teal.600" }}
                    _focus={{
                      borderColor: "teal.600",
                      boxShadow: "0 0 0 1px #319795",
                    }}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Input
                    ref={settingsDescRef}
                    defaultValue={
                      Array.isArray(allProcess)
                        ? allProcess.find((p: any) => p.id === selectedProcessId)?.description
                        : ''
                    }
                    placeholder="Description"
                    borderColor="teal.500"
                    borderWidth="2px"
                    _hover={{ borderColor: "teal.600" }}
                    _focus={{
                      borderColor: "teal.600",
                      boxShadow: "0 0 0 1px #319795",
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
                  Cancel
                </Button>
                <Button colorScheme="teal" onClick={confirmProcessSettings}>
                  Save
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </SidebarContent>
      </div>
    </WorkspaceLayout>
  );
}
