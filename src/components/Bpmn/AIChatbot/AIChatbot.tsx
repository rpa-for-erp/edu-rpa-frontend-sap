import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  IconButton,
  CloseButton,
  VStack,
  HStack,
  Spinner,
  Button,
  useToast,
  Link,
  Badge,
  Avatar,
  Textarea,
  Checkbox,
  Tag,
  TagLabel,
} from "@chakra-ui/react";
import { ArrowForwardIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { RiRobot2Fill } from "react-icons/ri";
import chatbotApi, {
  ChatMessage,
  PipelineResponse,
  InterruptData,
} from "@/apis/chatbotApi";
import { useMutation } from "@tanstack/react-query";
import { convertJsonToProcess } from "@/utils/bpmn-parser/json-to-bpmn-xml.util";
import { layoutProcess } from "bpmn-auto-layout";
import { ActivityPackages } from "@/constants/activityPackage";
import {
  getActivityInProcess,
  getProcessFromLocalStorage,
  updateActivityInProcess,
  updateLocalStorage,
} from "@/utils/processService";
import { setLocalStorageObject } from "@/utils/localStorageService";
import { LocalStorage } from "@/constants/localStorage";
import { getLibrary, getArgumentsByActivity } from "@/utils/propertyService";

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  processId: string;
  modelerRef?: any;
  onApplyXml?: (
    xml: string,
    activities?: any[],
    automaticNodeIds?: string[]
  ) => Promise<void>;
}

type PipelineStage =
  | "idle"
  | "processing"
  | "bpmn_feedback"
  | "mapping_feedback"
  | "completed";

// Mapping node names to loading messages
const getLoadingMessage = (nodeName?: string): string => {
  if (!nodeName) return "Processing...";

  const nodeMap: Record<string, string> = {
    user_input: "📝 Handling user input...",
    bpmn_free: "🎨 Generating BPMN structure...",
    apply_feedback: "🔄 Apply user feedbackText...",
    retrieve_map: "🔍 Retrieving activityPackage...",
    select_assign: "📦 Select/Assign activityPackage...",
    validate: "✅ Validating process...",
    render: "📄 Generate XML...",
  };

  // Try exact match first
  if (nodeMap[nodeName]) {
    return nodeMap[nodeName];
  }

  // Try partial match
  for (const [key, message] of Object.entries(nodeMap)) {
    if (nodeName.toLowerCase().includes(key)) {
      return message;
    }
  }

  return `⚙️ Processing: ${nodeName}...`;
};

// Parse activity_id to find package and activity
const parseActivityId = (
  activityId: string
): {
  packageName: string;
  activityDisplayName: string;
  activityTemplate: any;
} | null => {
  if (!activityId) return null;

  // Activity ID format: "package_prefix.activity_name"
  // Examples: "gmail.send_email", "drive.upload_file", "sheet.create_spreadsheet"

  // Map activity prefix to package display name
  const prefixToPackageMap: Record<string, string> = {
    gmail: "Gmail",
    drive: "Google Drive",
    google_drive: "Google Drive",
    sheet: "Google Sheet",
    google_sheets: "Google Sheet",
    google_classroom: "Google Classroom",
    google_form: "Google Form",
    control: "Control",
    browser_automation: "Browser automation",
    browser: "Browser automation",
    document_automation: "Document automation",
    document: "Document automation",
    data_manipulation: "Data manipulation",
    data: "Data manipulation",
    file_storage: "File storage",
    file: "File storage",
    sap_mock: "SAP MOCK",
    sap: "SAP MOCK",
    erpnext: "ERPNext",
    erp: "ERPNext",
    moodle: "Moodle",
  };

  // Try to split the activity ID
  const parts = activityId.split(".");
  if (parts.length < 2) return null;

  const prefix = parts[0];
  const activityName = parts.slice(1).join(".");

  // Find the package
  const packageDisplayName = prefixToPackageMap[prefix];
  if (!packageDisplayName) {
    console.warn(`[AIChatbot] Unknown package prefix: ${prefix}`);
    return null;
  }

  // Find the package in ActivityPackages
  const activityPackage = ActivityPackages.find(
    (pkg) => pkg.displayName === packageDisplayName
  );

  if (!activityPackage) {
    console.warn(`[AIChatbot] Package not found: ${packageDisplayName}`);
    return null;
  }

  // Find the activity template by templateId
  const activityTemplate = activityPackage.activityTemplates.find(
    (template: any) => template.templateId === activityId
  );

  if (!activityTemplate) {
    console.warn(`[AIChatbot] Activity template not found: ${activityId}`);
    return null;
  }

  return {
    packageName: packageDisplayName,
    activityDisplayName: activityTemplate.displayName,
    activityTemplate,
  };
};

export default function AIChatbot({
  isOpen,
  onClose,
  processId,
  modelerRef,
  onApplyXml,
}: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Chat with the Chatbot RPA 
for assistance creating a new BPMN process and assign existing activity package properly. For the best results:
- Please provide your goal, the actors involved, the step-by-step actions, conditions/branches, and any systems or data used.
- You can also mention existing activity packages so the assistant can map tasks correctly into your RPA library.`,
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<PipelineStage>("idle");
  const [currentInterrupt, setCurrentInterrupt] =
    useState<InterruptData | null>(null);
  const [finalXml, setFinalXml] = useState<string | null>(null);
  const [automaticNodeIds, setAutomaticNodeIds] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [pendingActivities, setPendingActivities] = useState<any[] | null>(
    null
  );
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedNodesInfo, setSelectedNodesInfo] = useState<
    Array<{ id: string; name: string; type: string }>
  >([]);
  const [availableNodes, setAvailableNodes] = useState<
    Array<{ id: string; name: string; type: string }>
  >([]);
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] =
    useState<string>("");
  const [simulatedLoadingStage, setSimulatedLoadingStage] = useState<
    "user_input" | "bpmn_generating" | "retrieving" | "select_assign" | null
  >(null);
  const [pendingMapping, setPendingMapping] = useState<any>(null);
  const [storedMappingData, setStoredMappingData] = useState<any>(null);
  const [selectedAutomaticNode, setSelectedAutomaticNode] = useState<{
    nodeId: string;
    nodeName: string;
    mappingEntry: any;
  } | null>(null);
  const [showCandidates, setShowCandidates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset conversation when opened
  useEffect(() => {
    if (isOpen && !threadId) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Chat with the Chatbot RPA 
for assistance creating a new BPMN process and assign existing activity package properly. For the best results:
- Please provide your goal, the actors involved, the step-by-step actions, conditions/branches, and any systems or data used.
- You can also mention existing activity packages so the assistant can map tasks correctly into your RPA library.`,
          timestamp: Date.now(),
        },
      ]);
      setCurrentStage("idle");
      setCurrentInterrupt(null);
      setFinalXml(null);
      setFeedbackText("");
      setSelectedNodeIds([]);
      setSelectedNodesInfo([]);
      setIsRejectMode(false);
      setSimulatedLoadingStage(null);
    }
  }, [isOpen]);

  // Listen to BPMN modeler selection changes (for reject mode)
  useEffect(() => {
    if (!modelerRef?.bpmnModeler || !isRejectMode) return;

    const eventBus = modelerRef.bpmnModeler.get("eventBus");
    const selection = modelerRef.bpmnModeler.get("selection");
    const elementRegistry = modelerRef.bpmnModeler.get("elementRegistry");

    const handleSelectionChanged = () => {
      try {
        const selectedElements = selection.get();
        const nodesInfo: Array<{ id: string; name: string; type: string }> = [];

        selectedElements.forEach((el: any) => {
          if (!el?.id) return;

          // Get element from registry to access businessObject
          const element = elementRegistry.get(el.id);
          if (!element || !element.businessObject) return;

          const bo = element.businessObject;
          const nodeName = bo.name || el.id;
          const nodeType = bo.$type || "Unknown";

          // Filter: Only include Tasks, Gateways, and non-start/end Events
          const isTask = nodeType.includes("Task");
          const isGateway = nodeType.includes("Gateway");
          const isEvent = nodeType.includes("Event");
          const isStartOrEnd =
            el.id.includes("StartEvent") || el.id.includes("EndEvent");

          if (isTask || isGateway || (isEvent && !isStartOrEnd)) {
            nodesInfo.push({
              id: el.id,
              name: nodeName,
              type: nodeType,
            });
          }
        });

        setSelectedNodesInfo(nodesInfo);
        setSelectedNodeIds(nodesInfo.map((n) => n.id));

        // Add/update message showing selected nodes
        if (nodesInfo.length > 0) {
          const selectedNodesText = nodesInfo
            .map((n) => `${n.name} (${n.id})`)
            .join(", ");

          setMessages((prev) => {
            // Remove previous selection message if exists
            const filtered = prev.filter(
              (msg) => !msg.id.startsWith("selected-nodes-")
            );
            return [
              ...filtered,
              {
                id: `selected-nodes-${Date.now()}`,
                role: "system",
                content: `**Selected Nodes:** ${selectedNodesText}`,
                timestamp: Date.now(),
              },
            ];
          });
        } else {
          // Remove selection message if no nodes selected
          setMessages((prev) =>
            prev.filter((msg) => !msg.id.startsWith("selected-nodes-"))
          );
        }
      } catch (error) {
        console.error("❌ [Chatbot] Error handling selection:", error);
      }
    };

    // Initial check
    handleSelectionChanged();

    eventBus.on("selection.changed", handleSelectionChanged);

    return () => {
      eventBus.off("selection.changed", handleSelectionChanged);
    };
  }, [modelerRef, isRejectMode]);

  // Listen to BPMN modeler selection changes (for automatic node candidates)
  useEffect(() => {
    if (!modelerRef?.bpmnModeler || !storedMappingData) return;

    const eventBus = modelerRef.bpmnModeler.get("eventBus");
    const selection = modelerRef.bpmnModeler.get("selection");
    const elementRegistry = modelerRef.bpmnModeler.get("elementRegistry");

    const handleSelectionChanged = () => {
      try {
        const selectedElements = selection.get();

        // Only handle single selection
        if (selectedElements.length !== 1) {
          setSelectedAutomaticNode(null);
          return;
        }

        const el = selectedElements[0];
        if (!el?.id) {
          setSelectedAutomaticNode(null);
          return;
        }

        // Get element info
        const element = elementRegistry.get(el.id);
        if (!element || !element.businessObject) {
          setSelectedAutomaticNode(null);
          return;
        }

        const bo = element.businessObject;
        const nodeName = bo.name || el.id;

        // Check if this node has mapping data
        const mappingEntries: any[] = Array.isArray(storedMappingData)
          ? storedMappingData.flatMap((item: any) => Object.values(item))
          : Object.values(storedMappingData);

        const mappingEntry = mappingEntries.find(
          (entry: any) => entry?.node_id === el.id
        );

        // Show candidates for nodes that have candidates (both automatic and manual)
        if (
          mappingEntry &&
          mappingEntry.candidates &&
          mappingEntry.candidates.length > 0
        ) {
          console.log(
            `🎯 [Chatbot] Selected node with candidates: ${el.id}`,
            mappingEntry
          );
          setSelectedAutomaticNode({
            nodeId: el.id,
            nodeName: nodeName,
            mappingEntry: mappingEntry,
          });
          // setShowCandidates(true); // Always show candidates when selecting a new node
        } else {
          setSelectedAutomaticNode(null);
        }
      } catch (error) {
        console.error(
          "❌ [Chatbot] Error handling automatic node selection:",
          error
        );
      }
    };

    // Initial check
    handleSelectionChanged();

    eventBus.on("selection.changed", handleSelectionChanged);

    return () => {
      eventBus.off("selection.changed", handleSelectionChanged);
    };
  }, [modelerRef, storedMappingData]);

  // Extract available nodes from BPMN structure
  const extractAvailableNodes = (
    bpmn: any
  ): Array<{ id: string; name: string; type: string }> => {
    if (!bpmn?.nodes) return [];
    return bpmn.nodes
      .filter((node: any) => {
        if (!node.id) return false;
        // Include Tasks, Gateways, but exclude Start/End Events
        const isTask = node.type?.includes("Task");
        const isGateway = node.type?.includes("Gateway");
        const isEvent = node.type?.includes("Event");
        const isStartOrEnd =
          node.id.includes("StartEvent") || node.id.includes("EndEvent");
        return isTask || isGateway || (isEvent && !isStartOrEnd);
      })
      .map((node: any) => ({
        id: node.id,
        name: node.name || node.id,
        type: node.type || "Unknown",
      }));
  };

  // Start Pipeline Mutation
  const startPipelineMutation = useMutation({
    mutationFn: async (text: string) => {
      return await chatbotApi.startPipeline(text);
    },
    onSuccess: (data: PipelineResponse) => {
      console.log("📦 [Pipeline] Started:", data);
      setThreadId(data.thread_id);
      handlePipelineResponse(data);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start pipeline",
        description: error?.message || "An error occurred",
        status: "error",
        position: "top-right",
        duration: 3000,
        isClosable: true,
      });

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "Sorry, I encountered an error starting the pipeline. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setCurrentStage("idle");
    },
  });

  // Submit Feedback Mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async ({
      threadId,
      feedback,
    }: {
      threadId: string;
      feedback: any;
    }) => {
      return await chatbotApi.submitFeedback(threadId, feedback);
    },
    onSuccess: (data: PipelineResponse) => {
      console.log("✅ [Pipeline] Feedback submitted:", data);
      setIsRejectMode(false);
      setSelectedNodeIds([]);
      handlePipelineResponse(data);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit feedback",
        description: error?.message || "An error occurred",
        status: "error",
        position: "top-right",
        duration: 3000,
        isClosable: true,
      });

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "Sorry, I encountered an error processing your feedback. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  // Handle pipeline response
  const extractAutomaticNodeIds = (mapping: any, bpmn?: any): string[] => {
    if (!mapping) return [];

    const entries: any[] = Array.isArray(mapping)
      ? mapping.flatMap((item) => Object.values(item))
      : Object.values(mapping);

    const baseIds = entries
      .filter(
        (m: any) =>
          m && m.is_automatic === true && typeof m.node_id === "string"
      )
      .map((m: any) => m.node_id);

    if (!bpmn || !Array.isArray(bpmn.nodes)) {
      return baseIds;
    }

    const nodeIdSet = new Set(
      bpmn.nodes.map((n: any) => n?.id).filter(Boolean)
    );

    return baseIds.filter((id) => nodeIdSet.has(id));
  };

  const applyAutoLayoutAndSetState = async (
    xml: string,
    activities?: any[] | null,
    automaticIds?: string[]
  ) => {
    if (activities) {
      setPendingActivities(activities);
    }

    if (automaticIds && automaticIds.length > 0) {
      setAutomaticNodeIds(automaticIds);
    } else {
      setAutomaticNodeIds([]);
    }
    try {
      const layoutedXml = await layoutProcess(xml);
      setFinalXml(layoutedXml);
    } catch (e) {
      console.error("❌ [Pipeline] bpmn-auto-layout failed, using raw XML:", e);
      setFinalXml(xml);
    }
  };

  // Handle candidate selection change for an automatic node
  const handleCandidateChange = (nodeId: string, newActivityId: string) => {
    console.log(
      `🔄 [Chatbot] Changing candidate for ${nodeId} to ${newActivityId}`
    );

    // Parse the new activity ID
    const parsedActivity = parseActivityId(newActivityId);
    if (!parsedActivity) {
      console.warn(
        `❌ [Chatbot] Failed to parse activity ID: ${newActivityId}`
      );
      toast({
        title: "Failed to change activity",
        description: "Could not parse the selected activity",
        status: "error",
        position: "top-right",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const { packageName, activityDisplayName, activityTemplate } =
      parsedActivity;

    // Get existing activity from storage
    const existingActivity = getActivityInProcess(processId, nodeId);
    if (!existingActivity) {
      console.warn(`❌ [Chatbot] Activity ${nodeId} not found in storage`);
      return;
    }

    // Prepare arguments with empty/default values
    const emptyArguments: Record<string, any> = {};
    if (activityTemplate.arguments) {
      Object.keys(activityTemplate.arguments).forEach((argKey) => {
        const argDef = activityTemplate.arguments[argKey];
        emptyArguments[argKey] = {
          keywordArg: argDef.keywordArg || null,
          overrideType: argDef.overrideType || null,
          value: argDef.value !== undefined ? argDef.value : "",
        };
      });
    }

    // Create update payload
    const updatePayload = {
      ...existingActivity,
      activityID: nodeId,
      keyword: activityTemplate.keyword || "",
      properties: {
        activityPackage: packageName,
        activityName: activityDisplayName,
        library: getLibrary(packageName),
        arguments: emptyArguments,
        return: null,
      },
    };

    console.log(`✅ [Chatbot] Updating activity for ${nodeId}:`, updatePayload);

    // Update in localStorage
    const updatedActivities = updateActivityInProcess(processId, updatePayload);
    const updatedProcess = updateLocalStorage({
      ...getProcessFromLocalStorage(processId),
      activities: updatedActivities,
    });

    setLocalStorageObject(LocalStorage.PROCESS_LIST, updatedProcess);

    // Update the stored mapping to reflect the new selection
    if (storedMappingData) {
      const mappingEntries: any[] = Array.isArray(storedMappingData)
        ? storedMappingData
        : [storedMappingData];

      const updatedMapping = mappingEntries.map((entry: any) => {
        const entryKeys = Object.keys(entry);
        if (entryKeys.length > 0 && entry[entryKeys[0]]?.node_id === nodeId) {
          return {
            [entryKeys[0]]: {
              ...entry[entryKeys[0]],
              activity_id: newActivityId,
            },
          };
        }
        return entry;
      });

      setStoredMappingData(updatedMapping);
    }

    // Update selected automatic node to reflect the change
    if (selectedAutomaticNode && selectedAutomaticNode.nodeId === nodeId) {
      setSelectedAutomaticNode({
        ...selectedAutomaticNode,
        mappingEntry: {
          ...selectedAutomaticNode.mappingEntry,
          activity_id: newActivityId,
        },
      });
    }

    toast({
      title: "Activity changed",
      description: `Changed to ${activityDisplayName}`,
      status: "success",
      position: "top-right",
      duration: 2000,
      isClosable: true,
    });
  };

  // Auto-assign activities for nodes with is_automatic = true
  const autoAssignActivities = (mapping: any) => {
    if (!mapping || !processId) {
      console.warn(
        "❌ [AIChatbot] Cannot auto-assign: missing mapping or processId"
      );
      return;
    }

    console.log(
      "🤖 [AIChatbot] Starting auto-assign for processId:",
      processId
    );
    console.log("🤖 [AIChatbot] Mapping data:", mapping);

    // Parse mapping array
    const mappingEntries: any[] = Array.isArray(mapping)
      ? mapping.flatMap((item) => Object.values(item))
      : Object.values(mapping);

    console.log("🤖 [AIChatbot] Parsed mapping entries:", mappingEntries);

    let assignedCount = 0;

    mappingEntries.forEach((entry: any, index: number) => {
      console.log(`\n🔍 [AIChatbot] Processing entry ${index}:`, entry);

      if (!entry || !entry.is_automatic || !entry.activity_id) {
        console.log(
          `⏭️ [AIChatbot] Skipping entry ${index}: not automatic or no activity ID`
        );
        return;
      }

      const { node_id, activity_id } = entry;

      console.log(
        `🤖 [AIChatbot] Auto-assigning ${activity_id} to node ${node_id}`
      );

      // Parse the activity ID to get package and activity info
      const parsedActivity = parseActivityId(activity_id);
      if (!parsedActivity) {
        console.warn(
          `❌ [AIChatbot] Failed to parse activity ID: ${activity_id}`
        );
        return;
      }

      console.log(`✅ [AIChatbot] Parsed activity:`, parsedActivity);

      const { packageName, activityDisplayName, activityTemplate } =
        parsedActivity;

      // Get existing activity from storage
      const existingActivity = getActivityInProcess(processId, node_id);
      console.log(
        `📦 [AIChatbot] Existing activity for ${node_id}:`,
        existingActivity
      );

      if (!existingActivity) {
        console.warn(
          `❌ [AIChatbot] Activity ${node_id} not found in storage. Skipping auto-assign.`
        );
        console.log(
          `💡 [AIChatbot] This might mean the activity hasn't been created yet. It will be created when XML is applied.`
        );
        return;
      }

      // Prepare arguments with empty values
      const emptyArguments: Record<string, any> = {};
      if (activityTemplate.arguments) {
        Object.keys(activityTemplate.arguments).forEach((argKey) => {
          const argDef = activityTemplate.arguments[argKey];
          emptyArguments[argKey] = {
            keywordArg: argDef.keywordArg || null,
            overrideType: argDef.overrideType || null,
            value: argDef.value !== undefined ? argDef.value : "",
          };
        });
      }
      console.log(
        `📝 [AIChatbot] Prepared arguments for ${node_id}:`,
        emptyArguments
      );

      // Create update payload
      const updatePayload = {
        ...existingActivity,
        activityID: node_id,
        keyword: activityTemplate.keyword || "",
        properties: {
          activityPackage: packageName,
          activityName: activityDisplayName,
          library: getLibrary(packageName),
          arguments: emptyArguments,
          return: null,
        },
      };

      console.log(
        `💾 [AIChatbot] Update payload for ${node_id}:`,
        JSON.stringify(updatePayload, null, 2)
      );

      // Update in localStorage
      const updatedActivities = updateActivityInProcess(
        processId,
        updatePayload
      );
      console.log(
        `📚 [AIChatbot] Updated activities array:`,
        updatedActivities
      );

      const updatedProcess = updateLocalStorage({
        ...getProcessFromLocalStorage(processId),
        activities: updatedActivities,
      });
      console.log(`🗂️ [AIChatbot] Updated process:`, updatedProcess);

      setLocalStorageObject(LocalStorage.PROCESS_LIST, updatedProcess);

      // Verify the data was saved
      const verifyActivity = getActivityInProcess(processId, node_id);
      console.log(
        `✔️ [AIChatbot] Verification - Activity in storage after save:`,
        verifyActivity
      );

      // Check properties structure
      if (verifyActivity?.properties) {
        console.log(
          `📋 [AIChatbot] Properties keys:`,
          Object.keys(verifyActivity.properties)
        );
        console.log(
          `📋 [AIChatbot] Has activityPackage:`,
          !!verifyActivity.properties.activityPackage
        );
        console.log(
          `📋 [AIChatbot] Has activityName:`,
          !!verifyActivity.properties.activityName
        );
        console.log(
          `📋 [AIChatbot] Arguments count:`,
          Object.keys(verifyActivity.properties.arguments || {}).length
        );
      }

      assignedCount++;
    });

    console.log(
      `\n🎉 [AIChatbot] Auto-assign complete. Assigned ${assignedCount} activities.`
    );

    if (assignedCount > 0) {
      toast({
        title: "Activities auto-assigned",
        description: `${assignedCount} automatic node${
          assignedCount > 1 ? "s have" : " has"
        } been assigned ${assignedCount > 1 ? "activities" : "an activity"}`,
        status: "success",
        position: "top-right",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handlePipelineResponse = (data: PipelineResponse) => {
    if (data.status === "waiting_feedback" && data.interrupt) {
      setCurrentInterrupt(data.interrupt);
      console.log("📦 [Pipeline] Interrupt:", data.interrupt);
      if (data.interrupt.type === "bpmn_feedback") {
        console.log("📦 [Pipeline] BPMN feedback:", data.interrupt);
        setCurrentStage("bpmn_feedback");
        const message: ChatMessage = {
          id: `bpmn-feedback-${Date.now()}`,
          role: "assistant",
          content:
            data.interrupt.instruction ||
            "I've generated a BPMN structure. Please review it.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, message]);

        const bpmnInfo = data.interrupt.bpmn;
        const nodes = extractAvailableNodes(bpmnInfo);
        setAvailableNodes(nodes);

        const bpmnMessage: ChatMessage = {
          id: `bpmn-info-${Date.now()}`,
          role: "system",
          content: `**BPMN Structure Generated:**\n- Nodes: ${
            bpmnInfo?.nodes?.length || 0
          }\n- Flows: ${
            bpmnInfo?.flows?.length || 0
          }\n\nPlease approve or reject this structure.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, bpmnMessage]);

        try {
          const mappingData = data.state?.mapping || data.mapping;
          const result = convertJsonToProcess({
            bpmn: bpmnInfo,
            mapping: mappingData,
          });
          if (result.success && result.xml) {
            const automaticIds = extractAutomaticNodeIds(mappingData, bpmnInfo);
            void applyAutoLayoutAndSetState(
              result.xml,
              result.activities || null,
              automaticIds
            );
          }
        } catch (e) {
          console.error(
            "❌ [Pipeline] Failed to convert BPMN JSON to XML (bpmn_feedback):",
            e
          );
        }
      } else if (data.interrupt.type === "mapping_feedback") {
        console.log("📦 [Pipeline] Mapping feedback:", data.interrupt);
        setCurrentStage("mapping_feedback");
        setSimulatedLoadingStage(null); // Clear simulation when feedback arrives

        // Remove loading messages
        setMessages((prev) =>
          prev.filter((msg) => !msg.id.startsWith("loading-"))
        );

        const message: ChatMessage = {
          id: `mapping-feedback-${Date.now()}`,
          role: "assistant",
          content:
            data.interrupt.instruction ||
            "I've mapped activities to the BPMN nodes. Please review the mapping.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, message]);

        const mappingInfo = data.interrupt.mapping;
        const mappingMessage: ChatMessage = {
          id: `mapping-info-${Date.now()}`,
          role: "system",
          content: `**Activity Mapping Generated:**\n- Total mappings: ${
            mappingInfo?.length || 0
          }\n\nPlease approve or reject this mapping.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, mappingMessage]);

        // Always store mapping data for candidate selection
        if (data.interrupt.mapping) {
          setPendingMapping(data.interrupt.mapping);
          setStoredMappingData(data.interrupt.mapping);
          console.log(
            "📝 [AIChatbot] Stored mapping for auto-assign and candidate selection"
          );
        }

        if (data.interrupt.bpmn) {
          const nodes = extractAvailableNodes(data.interrupt.bpmn);
          setAvailableNodes(nodes);

          try {
            const result = convertJsonToProcess({
              bpmn: data.interrupt.bpmn,
              mapping: data.interrupt.mapping,
            });
            if (result.success && result.xml) {
              const automaticIds = extractAutomaticNodeIds(
                data.interrupt.mapping,
                data.interrupt.bpmn
              );
              console.log(
                "🚀 [Pipeline] Extracted Automatic node IDs:",
                automaticIds
              );
              void applyAutoLayoutAndSetState(
                result.xml,
                result.activities || null,
                automaticIds
              );
            }
          } catch (e) {
            console.error(
              "❌ [Pipeline] Failed to convert BPMN JSON to XML (mapping_feedback):",
              e
            );
          }
        }
      }
    } else if (data.status === "completed") {
      console.log("📦 [Pipeline] Completed:", data);
      setCurrentStage("completed");

      const completedMapping = data.mapping || data.state?.mapping;
      const completedBpmn = data.bpmn || data.state?.bpmn;

      if (completedBpmn) {
        try {
          const result = convertJsonToProcess({
            bpmn: completedBpmn,
            mapping: completedMapping,
          });
          if (result.success && result.xml) {
            const automaticIds = extractAutomaticNodeIds(
              completedMapping,
              completedBpmn
            );
            void applyAutoLayoutAndSetState(
              result.xml,
              result.activities || null,
              automaticIds
            );

            // Store mapping for auto-assign after XML is applied
            if (completedMapping) {
              setPendingMapping(completedMapping);
              setStoredMappingData(completedMapping);
              console.log(
                "📝 [AIChatbot] Stored mapping for auto-assign and candidate selection (completed)"
              );
            }
          } else {
            setFinalXml(null);
            setPendingActivities(null);
            setAutomaticNodeIds([]);
          }
        } catch (e) {
          console.error(
            "❌ [Pipeline] Failed to convert BPMN JSON to XML (completed):",
            e
          );
          setFinalXml(null);
          setPendingActivities(null);
          setAutomaticNodeIds([]);
        }
      } else {
        setFinalXml(null);
        setPendingActivities(null);
        setAutomaticNodeIds([]);
      }

      const completionMessage: ChatMessage = {
        id: `completed-${Date.now()}`,
        role: "assistant",
        content: `✅ Pipeline completed successfully! BPMN process has been generated and validated. You can now apply it to the canvas.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, completionMessage]);

      if (data.render_activities && data.render_activities.length > 0) {
        const activitiesMessage: ChatMessage = {
          id: `activities-${Date.now()}`,
          role: "system",
          content: `**Generated:**\n- XML: ✅\n- Activities: ${data.render_activities.length}\n- Ready to apply!`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, activitiesMessage]);
      }
    } else if (data.status === "running") {
      console.log("📦 [Pipeline] Running:", data);
      setCurrentStage("processing");
      const loadingMsg = getLoadingMessage(data.current_node);
      setCurrentLoadingMessage(loadingMsg);

      // Update last message if it's a loading message, otherwise add new one
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (
          lastMsg &&
          lastMsg.role === "assistant" &&
          (lastMsg.id.startsWith("loading-") ||
            lastMsg.content.includes("⚙️") ||
            lastMsg.content.includes("📝") ||
            lastMsg.content.includes("🎨") ||
            lastMsg.content.includes("🔍") ||
            lastMsg.content.includes("📦") ||
            lastMsg.content.includes("🔄") ||
            lastMsg.content.includes("✅"))
        ) {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMsg,
              content: loadingMsg,
              timestamp: Date.now(),
            },
          ];
        }
        return [
          ...prev,
          {
            id: `loading-${Date.now()}`,
            role: "assistant",
            content: loadingMsg,
            timestamp: Date.now(),
          },
        ];
      });
    } else if (data.status === "error") {
      console.log("📦 [Pipeline] Error:", data);
      setCurrentStage("idle");
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `❌ Pipeline error: ${data.error || "Unknown error"}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setCurrentStage("processing");
    setSimulatedLoadingStage("user_input");
    setCurrentLoadingMessage("📝 Handling user input...");

    // Add loading message
    const loadingMsg: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "📝 Handling user input...",
      timestamp: Date.now(),
    };

    // Simulate 2s delay before generating BPMN
    setTimeout(() => {
      setMessages((prev) => [...prev, loadingMsg]);
      setSimulatedLoadingStage("bpmn_generating");
      setCurrentLoadingMessage("🎨 Generating BPMN structure...");

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.id.startsWith("loading-")) {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMsg,
              content: "🎨 Generating BPMN structure...",
              timestamp: Date.now(),
            },
          ];
        }
        return [
          ...prev,
          {
            id: `loading-${Date.now()}`,
            role: "assistant",
            content: "🎨 Generating BPMN structure...",
            timestamp: Date.now(),
          },
        ];
      });

      // Then start actual pipeline
      startPipelineMutation.mutate(inputValue);
    }, 3000);

    setInputValue("");
  };

  const handleApproveBpmn = () => {
    if (!threadId) return;

    const userMessage: ChatMessage = {
      id: `user-approve-${Date.now()}`,
      role: "user",
      content: "✅ Approved BPMN structure",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setCurrentStage("processing");
    setSimulatedLoadingStage("retrieving");
    setCurrentLoadingMessage("🔍 Retrieving activityPackage...");

    // Add loading message
    const loadingMsg: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "🔍 Retrieving activityPackage...",
      timestamp: Date.now(),
    };

    submitFeedbackMutation.mutate({
      threadId,
      feedback: { user_decision: "approve" },
    });
    // Simulate 3s delay before select_assign
    setTimeout(() => {
      setMessages((prev) => [...prev, loadingMsg]);
      setSimulatedLoadingStage("select_assign");
      setCurrentLoadingMessage("📦 Select/Assign activityPackage...");

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.id.startsWith("loading-")) {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMsg,
              content: "📦 Select/Assign activityPackage...",
              timestamp: Date.now(),
            },
          ];
        }
        return [
          ...prev,
          {
            id: `loading-${Date.now()}`,
            role: "assistant",
            content: "📦 Select/Assign activityPackage...",
            timestamp: Date.now(),
          },
        ];
      });

      // Then submit feedback
    }, 3000);

    setFeedbackText("");
    setIsRejectMode(false);
  };

  const handleRejectBpmn = () => {
    if (!threadId) return;

    if (!isRejectMode) {
      setIsRejectMode(true);
      toast({
        title: "Please select BPMN nodes",
        description:
          "Click on the canvas to select nodes/elements that need feedback",
        status: "info",
        position: "top-right",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (selectedNodeIds.length === 0) {
      toast({
        title: "No nodes selected",
        description:
          "Please select at least one BPMN node/element on the canvas",
        status: "warning",
        position: "top-right",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!feedbackText.trim()) {
      toast({
        title: "Feedback required",
        description: "Please provide feedback text when rejecting",
        status: "warning",
        position: "top-right",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const selectedNodesText = selectedNodesInfo
      .map((n) => `${n.name} (${n.id})`)
      .join(", ");

    const userMessage: ChatMessage = {
      id: `user-reject-${Date.now()}`,
      role: "user",
      content: `❌ Rejected BPMN structure\nSelected nodes: ${selectedNodesText}\nFeedback: ${feedbackText}`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setCurrentStage("processing");
    setSimulatedLoadingStage(null);
    setCurrentLoadingMessage("🔄 Apply user feedbackText...");

    const loadingMsg: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "🔄 Apply user feedbackText...",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, loadingMsg]);

    submitFeedbackMutation.mutate({
      threadId,
      feedback: {
        user_decision: "reject",
        user_feedback_text: feedbackText,
        selected_node_ids: selectedNodeIds,
      },
    });
    setFeedbackText("");
    setIsRejectMode(false);
    setSelectedNodeIds([]);
    setSelectedNodesInfo([]);
  };

  const handleApproveMapping = () => {
    if (!threadId) return;

    const userMessage: ChatMessage = {
      id: `user-approve-mapping-${Date.now()}`,
      role: "user",
      content: "✅ Approved activity mapping",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setCurrentStage("processing");
    setCurrentLoadingMessage("🔄 Processing approval...");
    submitFeedbackMutation.mutate({
      threadId,
      feedback: { user_mapping_decision: "approve" },
    });
    setFeedbackText("");
    setIsRejectMode(false);
  };

  const handleRejectMapping = () => {
    if (!threadId) return;

    if (!isRejectMode) {
      setIsRejectMode(true);
      toast({
        title: "Please select BPMN nodes",
        description:
          "Click on the canvas to select nodes/elements that need feedback",
        status: "info",
        position: "top-right",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (selectedNodeIds.length === 0) {
      toast({
        title: "No nodes selected",
        description:
          "Please select at least one BPMN node/element on the canvas",
        status: "warning",
        position: "top-right",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!feedbackText.trim()) {
      toast({
        title: "Feedback required",
        description: "Please provide feedback text when rejecting",
        status: "warning",
        position: "top-right",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const selectedNodesText = selectedNodesInfo
      .map((n) => `${n.name} (${n.id})`)
      .join(", ");

    const userMessage: ChatMessage = {
      id: `user-reject-mapping-${Date.now()}`,
      role: "user",
      content: `❌ Rejected activity mapping\nSelected nodes: ${selectedNodesText}\nFeedback: ${feedbackText}`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setCurrentStage("processing");
    setSimulatedLoadingStage(null);
    setCurrentLoadingMessage("🔄 Apply user feedbackText...");

    const loadingMsg: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "🔄 Apply user feedbackText...",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, loadingMsg]);

    submitFeedbackMutation.mutate({
      threadId,
      feedback: {
        user_mapping_decision: "reject",
        user_mapping_feedback_text: feedbackText,
        selected_node_ids: selectedNodeIds,
      },
    });
    setFeedbackText("");
    setIsRejectMode(false);
    setSelectedNodeIds([]);
    setSelectedNodesInfo([]);
  };

  // Auto-apply to canvas whenever we have fresh XML and handler provided
  useEffect(() => {
    const apply = async () => {
      if (!finalXml || !onApplyXml) return;
      setIsApplying(true);
      console.log("🚀 [AI Chatbot] Applying XML:", finalXml);
      console.log("🚀 [AI Chatbot] Pending activities:", pendingActivities);
      console.log("🚀 [AI Chatbot] Automatic node IDs:", automaticNodeIds);
      try {
        await onApplyXml(
          finalXml,
          pendingActivities || undefined,
          automaticNodeIds
        );

        console.log("✅ [AI Chatbot] XML applied successfully");

        // Auto-assign activities after XML is fully applied
        if (pendingMapping) {
          console.log(
            "🤖 [AI Chatbot] Auto-assigning activities after XML apply..."
          );
          // Small delay to ensure localStorage is fully updated
          setTimeout(() => {
            autoAssignActivities(pendingMapping);
            setPendingMapping(null); // Clear after processing
          }, 500);
        }
      } catch (error: any) {
        console.error("❌ [AI Chatbot] Auto apply XML failed:", error);
        toast({
          title: "Failed to update canvas",
          description: error?.message || "An error occurred",
          status: "error",
          position: "top-right",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsApplying(false);
      }
    };
    apply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalXml]);

  const handleResetChat = () => {
    const welcome: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: `Chat with the Chatbot RPA 
for assistance creating a new BPMN process and assign existing activity package properly. For the best results:
- Please provide your goal, the actors involved, the step-by-step actions, conditions/branches, and any systems or data used.
- You can also mention existing activity packages so the assistant can map tasks correctly into your RPA library.`,
      timestamp: Date.now(),
    };

    setMessages([welcome]);
    setThreadId(null);
    setCurrentStage("idle");
    setCurrentInterrupt(null);
    setFinalXml(null);
    setAutomaticNodeIds([]);
    setPendingActivities(null);
    setFeedbackText("");
    setInputValue("");
    setIsRejectMode(false);
    setSelectedNodeIds([]);
    setSelectedNodesInfo([]);
    setSimulatedLoadingStage(null);
    setPendingMapping(null);
    setStoredMappingData(null);
    setSelectedAutomaticNode(null);
    setShowCandidates(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (currentStage === "idle") {
        handleSendMessage();
      }
    }
  };

  if (!isOpen) return null;

  const showFeedbackButtons =
    (currentStage === "bpmn_feedback" || currentStage === "mapping_feedback") &&
    !submitFeedbackMutation.isPending;

  return (
    <Box
      position="fixed"
      top={4}
      right={4}
      pb={6}
      width="500px"
      height="650px"
      bg="white"
      borderRadius="lg"
      boxShadow="2xl"
      zIndex={1000}
      display="flex"
      flexDirection="column"
      border="1px solid"
      borderColor="gray.200"
    >
      {/* Header */}
      <Flex
        align="center"
        justify="space-between"
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor="gray.200"
        bg="teal.50"
        borderTopRadius="lg"
      >
        <HStack spacing={3}>
          <Avatar
            size="sm"
            bg="teal.500"
            icon={<RiRobot2Fill size={20} color="white" />}
          />
          <Box>
            <Text fontWeight="bold" fontSize="md">
              Chatbot RPA
            </Text>
            <Badge
              colorScheme={
                currentStage === "idle"
                  ? "gray"
                  : currentStage === "processing"
                  ? "yellow"
                  : currentStage === "completed"
                  ? "green"
                  : "blue"
              }
              fontSize="xs"
            >
              {currentStage === "idle"
                ? "Ready"
                : currentStage === "processing"
                ? "Processing..."
                : currentStage === "bpmn_feedback"
                ? "Awaiting BPMN Approval"
                : currentStage === "mapping_feedback"
                ? "Awaiting Mapping Approval"
                : "Completed"}
            </Badge>
          </Box>
        </HStack>
        <HStack spacing={2}>
          <Link
            href="#"
            fontSize="sm"
            color="teal.600"
            fontWeight="medium"
            _hover={{ textDecoration: "underline" }}
          >
            Docs
          </Link>
          <CloseButton size="sm" onClick={onClose} />
        </HStack>
      </Flex>

      {/* Messages Area */}
      <VStack
        flex={1}
        overflowY="auto"
        px={4}
        py={4}
        spacing={4}
        align="stretch"
        bg="gray.50"
        css={{
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#888",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#555",
          },
        }}
      >
        {messages.map((msg) => (
          <Flex
            key={msg.id}
            justify={msg.role === "user" ? "flex-end" : "flex-start"}
            width="100%"
          >
            {msg.role === "assistant" || msg.role === "system" ? (
              <HStack align="start" maxW="85%" spacing={2}>
                <Avatar
                  size="xs"
                  bg={msg.role === "system" ? "blue.500" : "teal.500"}
                  icon={<RiRobot2Fill size={12} color="white" />}
                  mt={1}
                />
                <Box
                  bg="white"
                  px={4}
                  py={3}
                  borderRadius="lg"
                  boxShadow="sm"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Text
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                    color={msg.role === "system" ? "blue.700" : "gray.700"}
                  >
                    {msg.content}
                  </Text>
                </Box>
              </HStack>
            ) : (
              <Box
                bg="teal.500"
                color="white"
                px={4}
                py={3}
                borderRadius="lg"
                maxW="85%"
                boxShadow="sm"
              >
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {msg.content}
                </Text>
              </Box>
            )}
          </Flex>
        ))}

        {/* Loading indicator */}
        {(startPipelineMutation.isPending ||
          submitFeedbackMutation.isPending) && (
          <Flex justify="flex-start" width="100%">
            <HStack align="start" spacing={2}>
              <Avatar
                size="xs"
                bg="teal.500"
                icon={<RiRobot2Fill size={12} color="white" />}
                mt={1}
              />
              <Box bg="white" px={4} py={3} borderRadius="lg" boxShadow="sm">
                <HStack spacing={2}>
                  <Spinner size="xs" color="teal.500" />
                  <Text fontSize="sm" color="gray.500">
                    {currentLoadingMessage || "Processing..."}
                  </Text>
                </HStack>
              </Box>
            </HStack>
          </Flex>
        )}

        {/* Selected Nodes Display */}
        {isRejectMode && selectedNodeIds.length > 0 && (
          <Box
            bg="yellow.50"
            p={3}
            borderRadius="md"
            border="1px solid"
            borderColor="yellow.200"
          >
            <Text fontSize="xs" fontWeight="bold" mb={2} color="yellow.800">
              Selected Nodes for Feedback:
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              {selectedNodeIds.map((nodeId) => {
                const node = availableNodes.find((n) => n.id === nodeId);
                return (
                  <Tag key={nodeId} size="sm" colorScheme="yellow">
                    <TagLabel>{node?.name || nodeId}</TagLabel>
                  </Tag>
                );
              })}
            </HStack>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </VStack>

      {/* Automatic Node Candidate Selection */}
      {selectedAutomaticNode && (
        <Box
          px={4}
          py={3}
          borderTop="2px solid"
          borderColor="teal.300"
          bg="teal.50"
        >
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between" align="start">
              <Box flex={1}>
                <HStack spacing={2} mb={1}>
                  <Badge colorScheme="teal" fontSize="xs">
                    AI Suggestion Activities
                  </Badge>
                  <Text fontWeight="bold" fontSize="sm" color="teal.800">
                    {selectedAutomaticNode.nodeName}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.600">
                  {/* The system has recommended activities for this node. You can
                  change the selection below: */}
                </Text>
              </Box>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="teal"
                onClick={() => setShowCandidates(!showCandidates)}
              >
                {showCandidates ? "Hide" : "Show"}
              </Button>
            </HStack>

            {/* Candidates List */}
            {showCandidates &&
              selectedAutomaticNode.mappingEntry.candidates &&
              selectedAutomaticNode.mappingEntry.candidates.length > 0 && (
                <VStack
                  spacing={2}
                  align="stretch"
                  maxH="300px"
                  overflowY="auto"
                >
                  {selectedAutomaticNode.mappingEntry.candidates
                    .filter((candidate: any) => {
                      // Only show candidates with score > 0.7
                      const score = candidate.score || 0;
                      return score > 0.7;
                    })
                    .map((candidate: any, index: number) => {
                      const isSelected =
                        candidate.activity_id ===
                        selectedAutomaticNode.mappingEntry.activity_id;

                      const score = candidate.score || 0;

                      return (
                        <Box
                          key={index}
                          p={3}
                          bg={isSelected ? "teal.100" : "white"}
                          border="2px solid"
                          borderColor={isSelected ? "teal.500" : "gray.200"}
                          borderRadius="md"
                          cursor="pointer"
                          onClick={() =>
                            handleCandidateChange(
                              selectedAutomaticNode.nodeId,
                              candidate.activity_id
                            )
                          }
                          _hover={{
                            borderColor: isSelected ? "teal.600" : "teal.300",
                            bg: isSelected ? "teal.200" : "gray.50",
                          }}
                          transition="all 0.2s"
                        >
                          <HStack justify="space-between" align="start">
                            <VStack align="start" spacing={1} flex={1}>
                              <HStack>
                                {isSelected && (
                                  <CheckIcon color="teal.600" boxSize={3} />
                                )}
                                <Text
                                  fontSize="sm"
                                  fontWeight={isSelected ? "bold" : "medium"}
                                  color={isSelected ? "teal.800" : "gray.700"}
                                >
                                  {candidate.keyword || candidate.activity_id}
                                </Text>
                              </HStack>
                              <Text fontSize="xs" color="gray.500">
                                ID: {candidate.activity_id}
                              </Text>
                              {candidate.pkg && (
                                <Badge
                                  size="sm"
                                  colorScheme="blue"
                                  fontSize="xs"
                                >
                                  {candidate.pkg}
                                </Badge>
                              )}
                            </VStack>
                            <Badge
                              colorScheme={
                                score >= 0.8
                                  ? "green"
                                  : score >= 0.7
                                  ? "yellow"
                                  : "red"
                              }
                              fontSize="xs"
                            >
                              {Math.round(score * 100)}%
                            </Badge>
                          </HStack>
                        </Box>
                      );
                    })}
                </VStack>
              )}
          </VStack>
        </Box>
      )}

      {/* Input Area - Unified for all stages */}
      <Box
        px={4}
        // py={3}
        borderTop="1px solid"
        borderColor="gray.200"
        bg="white"
        borderBottomRadius="lg"
      >
        {/* Approve/Reject Buttons - Above textarea */}
        {showFeedbackButtons && (
          <HStack spacing={3} mb={3} justify="center">
            <Button
              size="sm"
              colorScheme="green"
              leftIcon={<CheckIcon />}
              onClick={
                currentStage === "bpmn_feedback"
                  ? handleApproveBpmn
                  : handleApproveMapping
              }
              isDisabled={submitFeedbackMutation.isPending}
            >
              {currentStage === "bpmn_feedback"
                ? "Approve BPMN"
                : "Approve Mapping"}
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              leftIcon={<CloseIcon />}
              onClick={
                currentStage === "bpmn_feedback"
                  ? handleRejectBpmn
                  : handleRejectMapping
              }
              isDisabled={submitFeedbackMutation.isPending}
            >
              {currentStage === "bpmn_feedback"
                ? "Reject BPMN"
                : "Reject Mapping"}
            </Button>
          </HStack>
        )}

        {/* Reject Mode Instructions */}
        {isRejectMode && (
          <Box
            bg="blue.50"
            p={2}
            borderRadius="md"
            mb={2}
            border="1px solid"
            borderColor="blue.200"
          >
            <Text fontSize="xs" color="blue.800">
              ⚠️ Please select node/element BPMN need feedback on the canvas,
              then provide feedback text below.
            </Text>
          </Box>
        )}

        {/* Textarea - Unified input */}
        <HStack spacing={1} align="flex-end">
          <Textarea
            placeholder={
              currentStage === "idle"
                ? "Enter a process description"
                : isRejectMode
                ? "Please provide feedback for selected nodes (required)"
                : "Optional: Provide feedback if rejecting..."
            }
            value={currentStage === "idle" ? inputValue : feedbackText}
            onChange={(e) => {
              if (currentStage === "idle") {
                setInputValue(e.target.value);
              } else {
                setFeedbackText(e.target.value);
              }
            }}
            onKeyPress={handleKeyPress}
            size="sm"
            bg="gray.50"
            borderColor={isRejectMode ? "red.200" : "teal.100"}
            _focus={{
              borderColor: isRejectMode ? "red.500" : "teal.500",
              boxShadow: "0 0 0 1px #319795",
            }}
            rows={currentStage === "idle" ? 3 : 2}
            isDisabled={
              (currentStage !== "idle" &&
                currentStage !== "bpmn_feedback" &&
                currentStage !== "mapping_feedback") ||
              startPipelineMutation.isPending ||
              submitFeedbackMutation.isPending ||
              isApplying
            }
            isRequired={isRejectMode}
          />
          {currentStage === "idle" && (
            <IconButton
              aria-label="Send message"
              icon={<ArrowForwardIcon />}
              colorScheme="teal"
              size="md"
              onClick={handleSendMessage}
              isDisabled={
                !inputValue.trim() ||
                startPipelineMutation.isPending ||
                submitFeedbackMutation.isPending ||
                isApplying
              }
              isLoading={startPipelineMutation.isPending}
            />
          )}
        </HStack>

        {/* Reset Chat Button */}
        <Button
          size="xs"
          variant="ghost"
          onClick={handleResetChat}
          mt={2}
          isDisabled={
            startPipelineMutation.isPending || submitFeedbackMutation.isPending
          }
        >
          Reset chat
        </Button>
      </Box>
    </Box>
  );
}
