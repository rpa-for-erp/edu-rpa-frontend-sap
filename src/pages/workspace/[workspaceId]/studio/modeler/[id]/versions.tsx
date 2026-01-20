import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Box, Flex, useToast, useDisclosure } from "@chakra-ui/react";
import dynamic from "next/dynamic";

import {
  VersionsHeader,
  ChangesPanel,
  VersionsHistoryPanel,
  CreateVersionModal,
} from "@/components/Bpmn/VersionsPanel";
import { VersionListItem, CreateVersionDto } from "@/interfaces/version";
import { DetectedChange } from "@/components/Bpmn/VersionsPanel/VisualViewDiff";
import versionApi from "@/apis/versionApi";
import { QUERY_KEY } from "@/constants/queryKey";
import LoadingIndicator from "@/components/LoadingIndicator/LoadingIndicator";
import { getProcessFromLocalStorage } from "@/utils/processService";
import {
  getVariableItemFromLocalStorage,
  convertToRefactoredObject,
} from "@/utils/variableService";

// Loading component for dynamic imports
const DynamicLoading = () => (
  <div
    style={{
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F7FAFC",
    }}
  >
    <div>Loading...</div>
  </div>
);

// Dynamic imports for components that use browser APIs
const CodeViewDiff = dynamic(
  () => import("@/components/Bpmn/VersionsPanel/CodeViewDiff"),
  {
    ssr: false,
    loading: DynamicLoading,
  }
);

const VisualViewDiff = dynamic(
  () => import("@/components/Bpmn/VersionsPanel/VisualViewDiff"),
  {
    ssr: false,
    loading: DynamicLoading,
  }
);

export default function WorkspaceVersionsPage() {
  const router = useRouter();
  const { workspaceId, id: processId, name: queryProcessName } = router.query;
  const toast = useToast();
  const queryClient = useQueryClient();

  // Get processName from localStorage if not in query
  const processName = useMemo(() => {
    if (queryProcessName) return queryProcessName as string;
    if (typeof window === "undefined" || !processId) return "Untitled Process";
    const processProperties = getProcessFromLocalStorage(processId as string);
    return processProperties?.processName || "Untitled Process";
  }, [queryProcessName, processId]);

  // State
  const [activeView, setActiveView] = useState<"visual" | "code">("visual");
  const [showChanges, setShowChanges] = useState(false);
  // Support 2 versions for comparison
  const [baseVersionId, setBaseVersionId] = useState<string | null>(null);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [selectedChangeId, setSelectedChangeId] = useState<
    string | undefined
  >();
  // Store detected changes from VisualViewDiff
  const [detectedChanges, setDetectedChanges] = useState<DetectedChange[]>([]);

  // Modal state
  const {
    isOpen: isCreateModalOpen,
    onOpen: onOpenCreateModal,
    onClose: onCloseCreateModal,
  } = useDisclosure();

  // Get current XML from localStorage (the edited data on UI)
  const currentXmlFromLocalStorage = useMemo(() => {
    if (typeof window === "undefined" || !processId) return "";
    const processProperties = getProcessFromLocalStorage(processId as string);
    return processProperties?.xml || "";
  }, [processId]);

  // Fetch versions list
  const {
    data: versionsData,
    isLoading: isLoadingVersions,
    refetch: refetchVersions,
  } = useQuery({
    queryKey: ["versions", processId],
    queryFn: () => versionApi.getAllVersions(processId as string),
    enabled: !!processId,
  });

  // Fetch base version detail (with xml)
  const { data: baseVersionDetail } = useQuery({
    queryKey: ["version-detail", processId, baseVersionId],
    queryFn: () =>
      versionApi.getVersionById(processId as string, baseVersionId as string),
    enabled: !!processId && !!baseVersionId,
  });

  // Fetch compare version detail (with xml)
  const { data: compareVersionDetail } = useQuery({
    queryKey: ["version-detail", processId, compareVersionId],
    queryFn: () =>
      versionApi.getVersionById(
        processId as string,
        compareVersionId as string
      ),
    enabled: !!processId && !!compareVersionId && showChanges,
  });

  // Auto-select first version when data loads
  useEffect(() => {
    if (versionsData?.versions && versionsData.versions.length > 0) {
      // Auto-select first version as base if not already selected
      if (!baseVersionId) {
        setBaseVersionId(versionsData.versions[0].id);
      }
      // Auto-select second version as compare if available and showChanges is on
      if (
        !compareVersionId &&
        versionsData.versions.length > 1 &&
        showChanges
      ) {
        setCompareVersionId(versionsData.versions[1].id);
      }
    }
  }, [versionsData, showChanges]);

  // Create version mutation
  const createVersionMutation = useMutation({
    mutationFn: (payload: CreateVersionDto) =>
      versionApi.createVersion(processId as string, payload),
    onSuccess: () => {
      toast({
        title: "Version created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      onCloseCreateModal();
      refetchVersions();
      queryClient.invalidateQueries({ queryKey: ["versions", processId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create version",
        description: error?.message || "An error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  // Delete version mutation
  const deleteVersionMutation = useMutation({
    mutationFn: (versionId: string) =>
      versionApi.deleteVersion(processId as string, versionId),
    onSuccess: () => {
      toast({
        title: "Version deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      refetchVersions();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete version",
        description: error?.message || "An error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: (versionId: string) =>
      versionApi.restoreVersion(processId as string, versionId),
    onSuccess: () => {
      toast({
        title: "Version restored successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      refetchVersions();
      // Invalidate process detail to get updated xml
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.PROCESS_DETAIL, processId],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to restore version",
        description: error?.message || "An error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  // Handlers
  const handleVersionSelect = (
    version: VersionListItem,
    isBaseVersion: boolean
  ) => {
    if (isBaseVersion) {
      setBaseVersionId(version.id);
      // If selecting a new base and it's the same as compare, clear compare
      if (compareVersionId === version.id) {
        setCompareVersionId(null);
      }
    } else {
      setCompareVersionId(version.id);
    }
  };

  // Handle showChanges toggle
  const handleShowChangesChange = (show: boolean) => {
    setShowChanges(show);
    if (!show) {
      // When disabling diff, clear compare version
      setCompareVersionId(null);
      setDetectedChanges([]);
    }
  };

  const handleChangeClick = (change: DetectedChange) => {
    setSelectedChangeId(change.id);
  };

  const handleRestoreVersion = (version: VersionListItem) => {
    restoreVersionMutation.mutate(version.id);
  };

  const handleDownloadVersion = async (version: VersionListItem) => {
    try {
      const blob = await versionApi.downloadVersion(
        processId as string,
        version.id
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${processName || "process"}-${version.tag}.bpmn`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Failed to download version",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const handleDeleteVersion = (version: VersionListItem) => {
    if (window.confirm("Are you sure you want to delete this version?")) {
      deleteVersionMutation.mutate(version.id);
      // Clear selection if deleted version was selected
      if (baseVersionId === version.id) {
        setBaseVersionId(null);
      }
      if (compareVersionId === version.id) {
        setCompareVersionId(null);
      }
    }
  };

  // Handle create version with data from localStorage (the edited data on UI)
  const handleCreateVersion = useCallback(
    (data: { tag: string; description: string }) => {
      // Get current data from localStorage (the edited data on UI)
      const processProperties = getProcessFromLocalStorage(processId as string);
      const variableListByID = getVariableItemFromLocalStorage(
        processId as string
      );
      const refactoredVariables = convertToRefactoredObject(variableListByID);

      if (!processProperties) {
        toast({
          title: "Process data not available",
          description: "Please go back to the editor and try again",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
        return;
      }

      const payload: CreateVersionDto = {
        processId: processId as string,
        xml: processProperties.xml || "",
        variables: refactoredVariables || {},
        activities: processProperties.activities || [],
        tag: data.tag,
        description: data.description,
      };

      createVersionMutation.mutate(payload);
    },
    [processId, createVersionMutation, toast]
  );

  // Handle changes detected from VisualViewDiff
  const handleChangesDetected = (changes: DetectedChange[]) => {
    setDetectedChanges(changes);
  };

  // Loading state
  if (isLoadingVersions) {
    return <LoadingIndicator />;
  }

  const versions = versionsData?.versions || [];

  // Determine XML to display based on mode
  // Use version detail xml if available, otherwise fallback to localStorage
  const baseXml = baseVersionDetail?.xml || currentXmlFromLocalStorage;
  const compareXml = compareVersionDetail?.xml || "";

  // Check if we can show diff (both versions selected and showChanges enabled)
  const canShowDiff = showChanges && baseVersionId && compareVersionId;

  return (
    <Box h="100vh" display="flex" flexDirection="column" overflow="hidden">
      {/* Header */}
      <VersionsHeader
        processId={processId as string}
        processName={processName}
        activeView={activeView}
        onViewChange={setActiveView}
        showChanges={showChanges}
        onShowChangesChange={handleShowChangesChange}
        onCreateVersion={onOpenCreateModal}
      />

      {/* Main Content */}
      <Flex flex={1} overflow="hidden">
        {/* Left Sidebar - Changes Panel (only show when diff mode is active) */}
        {canShowDiff && (
          <ChangesPanel
            changes={detectedChanges}
            onChangeClick={handleChangeClick}
            selectedChangeId={selectedChangeId}
          />
        )}

        {/* Center - Visual/Code View */}
        <Box flex={1} overflow="hidden" bg="gray.100">
          {activeView === "visual" ? (
            <VisualViewDiff
              currentXml={canShowDiff ? compareXml : baseXml}
              selectedXml={canShowDiff ? baseXml : undefined}
              showDiff={!!canShowDiff}
              onChangesDetected={handleChangesDetected}
              onElementClick={(elementId) => {
                const change = detectedChanges.find(
                  (c) => c.elementId === elementId
                );
                if (change) {
                  setSelectedChangeId(change.id);
                }
              }}
            />
          ) : (
            <CodeViewDiff
              originalXml={baseXml}
              modifiedXml={canShowDiff ? compareXml : baseXml}
              originalLabel={
                baseVersionDetail
                  ? `${baseVersionDetail.tag} (Base)`
                  : "Current Process"
              }
              modifiedLabel={
                canShowDiff && compareVersionDetail
                  ? `${compareVersionDetail.tag} (Compare)`
                  : "Single view"
              }
              showDiff={!!canShowDiff}
            />
          )}
        </Box>

        {/* Right Sidebar - Versions History */}
        <VersionsHistoryPanel
          versions={versions}
          baseVersionId={baseVersionId || undefined}
          compareVersionId={compareVersionId || undefined}
          onVersionSelect={handleVersionSelect}
          showChanges={showChanges}
          onRestoreVersion={handleRestoreVersion}
          onEditVersion={() => {
            toast({ title: "Edit feature coming soon", status: "info" });
          }}
          onDownloadVersion={handleDownloadVersion}
          onDeleteVersion={handleDeleteVersion}
        />
      </Flex>

      {/* Create Version Modal */}
      <CreateVersionModal
        isOpen={isCreateModalOpen}
        onClose={onCloseCreateModal}
        onCreateVersion={handleCreateVersion}
        lastVersionTag={versions[0]?.tag}
        isLoading={createVersionMutation.isPending}
      />
    </Box>
  );
}
