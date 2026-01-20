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

      setMessages((prev) => {
        // Remove any previous loading message
        const filteredPrev = prev.filter(
          (msg) =>
            !msg.id.startsWith("loading-") &&
            !/^[⚙️📝🎨🔍📦🔄✅]/.test(msg.content)
        );

        const newMessages = [...filteredPrev];

        const completionMessage: ChatMessage = {
          id: `completed-${Date.now()}`,
          role: "assistant",
          content: `✅ Pipeline completed successfully! BPMN process has been generated and validated. You can now apply it to the canvas.`,
          timestamp: Date.now(),
        };
        newMessages.push(completionMessage);

        if (data.render_activities && data.render_activities.length > 0) {
          const activitiesMessage: ChatMessage = {
            id: `activities-${Date.now()}`,
            role: "system",
            content: `**Generated:**\n- XML: ✅\n- Activities: ${data.render_activities.length}\n- Ready to apply!`,
            timestamp: Date.now(),
          };
          newMessages.push(activitiesMessage);
        }

        const loadedMessage: ChatMessage = {
          id: `loaded-${Date.now()}`,
          role: "system",
          content: "Message loaded",
          timestamp: Date.now(),
        };
        newMessages.push(loadedMessage);

        return newMessages;
      });
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
  const updateLoadingState = (content: string, stage: string) => {
    setSimulatedLoadingStage(stage as any);
    setCurrentLoadingMessage(content);
    setMessages((prev) => {
      const lastMsg = prev[prev.length - 1];
      const isLoader =
        lastMsg?.id.startsWith("loading-") ||
        (lastMsg?.role === "assistant" &&
          /^[⚙️📝🎨🔍📦🔄✅]/.test(lastMsg.content));

      if (isLoader && lastMsg.content === content) return prev;

      const newMessage: ChatMessage = {
        id: isLoader ? lastMsg.id : `loading-${Date.now()}`,
        role: "assistant",
        content,
        timestamp: Date.now(),
      };

      return isLoader
        ? [...prev.slice(0, -1), newMessage]
        : [...prev, newMessage];
    });
  };

  const handleSendMessage = () => {
    const content = inputValue.trim();
    if (!content) return;

    const timestamp = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${timestamp}`,
        role: "user",
        content,
        timestamp: timestamp,
      },
      {
        id: `ack-${timestamp + 1}`,
        role: "assistant",
        content: `Certainly! I usually take around 50 seconds to handle your request.
I don't always get it right, so please review the process and feel free to try again with a different prompt`,
        timestamp: timestamp + 1,
      },
    ]);
    setInputValue("");
    setCurrentStage("processing");

    updateLoadingState("📝 Handling user input...", "user_input");

    setTimeout(() => {
      updateLoadingState("🎨 Generating BPMN structure...", "bpmn_generating");
      startPipelineMutation.mutate(content);
    }, 800);
  };

  const handleApproveBpmn = () => {
    if (!threadId) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `approve-${Date.now()}`,
        role: "user",
        content: "✅ Approved BPMN structure",
        timestamp: Date.now(),
      },
    ]);
    setCurrentStage("processing");

    updateLoadingState("🔍 Retrieving activityPackage...", "retrieving");
    submitFeedbackMutation.mutate({
      threadId,
      feedback: { user_decision: "approve" },
    });

    setTimeout(() => {
      updateLoadingState(
        "📦 Select/Assign activityPackage...",
        "select_assign"
      );
    }, 1200);

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
      pb={4}
      width="520px"
      height="680px"
      bg="white"
      borderRadius="2xl"
      boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 128, 128, 0.1)"
      zIndex={1000}
      display="flex"
      flexDirection="column"
      overflow="hidden"
      css={{
        animation: "slideIn 0.3s ease-out",
        "@keyframes slideIn": {
          from: {
            opacity: 0,
            transform: "translateY(-10px) scale(0.98)",
          },
          to: {
            opacity: 1,
            transform: "translateY(0) scale(1)",
          },
        },
        "@keyframes pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        "@keyframes bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "@keyframes typingDot": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: 0.4 },
          "30%": { transform: "translateY(-4px)", opacity: 1 },
        },
      }}
    >
      {/* Header */}
      <Flex
        align="center"
        justify="space-between"
        px={4}
        py={2.5}
        bgGradient="linear(to-r, teal.300, teal.400, cyan.300)"
        borderTopRadius="2xl"
        position="relative"
        _before={{
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "1px",
          bgGradient: "linear(to-r, transparent, whiteAlpha.400, transparent)",
        }}
      >
        <HStack spacing={2.5}>
          <Box
            p={1.5}
            bg="whiteAlpha.300"
            borderRadius="lg"
            backdropFilter="blur(10px)"
            css={{
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <Avatar
              size="xs"
              bg="white"
              icon={<RiRobot2Fill size={14} color="#319795" />}
            />
          </Box>
          <Box>
            <Text
              fontWeight="semibold"
              fontSize="sm"
              color="white"
              letterSpacing="tight"
            >
              Chatbot RPA
            </Text>
            <Badge
              px={1.5}
              py={0}
              borderRadius="full"
              fontSize="2xs"
              fontWeight="medium"
              bg={
                currentStage === "idle"
                  ? "whiteAlpha.400"
                  : currentStage === "processing"
                  ? "yellow.300"
                  : currentStage === "completed"
                  ? "green.300"
                  : "blue.300"
              }
              color={currentStage === "idle" ? "white" : "gray.700"}
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
            fontSize="xs"
            color="whiteAlpha.900"
            fontWeight="medium"
            _hover={{ color: "white", textDecoration: "none" }}
            transition="all 0.2s"
          >
            Docs
          </Link>
          <CloseButton
            size="sm"
            color="white"
            _hover={{ bg: "whiteAlpha.300" }}
            borderRadius="md"
            onClick={onClose}
          />
        </HStack>
      </Flex>

      {/* Messages Area */}
      <VStack
        flex={1}
        overflowY="auto"
        px={4}
        py={4}
        spacing={3}
        align="stretch"
        bgGradient="linear(to-b, gray.50, white)"
        css={{
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "linear-gradient(180deg, #81E6D9 0%, #319795 100%)",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "linear-gradient(180deg, #4FD1C5 0%, #2C7A7B 100%)",
          },
        }}
      >
        {messages
          .filter((msg) => {
            const isLoading =
              startPipelineMutation.isPending ||
              submitFeedbackMutation.isPending;
            if (!isLoading) return true;

            const isLoadingMessage =
              msg.id.startsWith("loading-") ||
              (msg.role === "assistant" &&
                /^[⚙️📝🎨🔍📦🔄✅]/.test(msg.content));
            return !isLoadingMessage;
          })
          .map((msg, index) => (
            <Flex
              key={msg.id}
              justify={msg.role === "user" ? "flex-end" : "flex-start"}
              width="100%"
              css={{
                animation: "fadeInUp 0.3s ease-out",
                animationDelay: `${index * 0.05}s`,
                animationFillMode: "backwards",
                "@keyframes fadeInUp": {
                  from: {
                    opacity: 0,
                    transform: "translateY(10px)",
                  },
                  to: {
                    opacity: 1,
                    transform: "translateY(0)",
                  },
                },
              }}
            >
              {msg.role === "assistant" || msg.role === "system" ? (
                <HStack align="start" maxW="88%" spacing={2}>
                  <Box
                    p={1}
                    bg={msg.role === "system" ? "blue.100" : "teal.100"}
                    borderRadius="full"
                    flexShrink={0}
                  >
                    <Avatar
                      size="xs"
                      bg={msg.role === "system" ? "blue.500" : "teal.500"}
                      icon={<RiRobot2Fill size={10} color="white" />}
                    />
                  </Box>
                  <Box
                    bg="white"
                    px={4}
                    py={3}
                    borderRadius="2xl"
                    borderTopLeftRadius="sm"
                    boxShadow="0 2px 8px rgba(0, 0, 0, 0.06)"
                    border="1px solid"
                    borderColor={
                      msg.role === "system" ? "blue.100" : "gray.100"
                    }
                    transition="all 0.2s"
                    _hover={{
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      transform: "translateY(-1px)",
                    }}
                  >
                    <Text
                      fontSize="sm"
                      whiteSpace="pre-wrap"
                      color={msg.role === "system" ? "blue.700" : "gray.700"}
                      lineHeight="1.6"
                    >
                      {msg.content}
                    </Text>
                  </Box>
                </HStack>
              ) : (
                <Box
                  bgGradient="linear(to-r, teal.500, teal.400)"
                  color="white"
                  px={4}
                  py={3}
                  borderRadius="2xl"
                  borderTopRightRadius="sm"
                  maxW="88%"
                  boxShadow="0 2px 8px rgba(49, 151, 149, 0.3)"
                  transition="all 0.2s"
                  _hover={{
                    boxShadow: "0 4px 16px rgba(49, 151, 149, 0.4)",
                    transform: "translateY(-1px)",
                  }}
                >
                  <Text fontSize="sm" whiteSpace="pre-wrap" lineHeight="1.6">
                    {msg.content}
                  </Text>
                </Box>
              )}
            </Flex>
          ))}

        {/* Loading indicator with typing animation */}
        {(startPipelineMutation.isPending ||
          submitFeedbackMutation.isPending) && (
          <Flex justify="flex-start" width="100%">
            <HStack align="start" spacing={2}>
              <Box p={1} bg="teal.100" borderRadius="full" flexShrink={0}>
                <Avatar
                  size="xs"
                  bg="teal.500"
                  icon={<RiRobot2Fill size={10} color="white" />}
                />
              </Box>
              <Box
                bg="white"
                px={4}
                py={3}
                borderRadius="2xl"
                borderTopLeftRadius="sm"
                boxShadow="0 2px 8px rgba(0, 0, 0, 0.06)"
                border="1px solid"
                borderColor="teal.100"
              >
                <HStack spacing={3}>
                  <HStack spacing={1}>
                    {[0, 1, 2].map((i) => (
                      <Box
                        key={i}
                        w="6px"
                        h="6px"
                        bg="teal.400"
                        borderRadius="full"
                        css={{
                          animation: "typingDot 1.4s ease-in-out infinite",
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </HStack>
                  <Text fontSize="sm" color="gray.500" fontWeight="medium">
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
            bgGradient="linear(to-r, yellow.50, orange.50)"
            p={4}
            borderRadius="xl"
            border="1px solid"
            borderColor="yellow.200"
            boxShadow="0 2px 8px rgba(251, 211, 141, 0.3)"
          >
            <Text fontSize="xs" fontWeight="bold" mb={2} color="yellow.800">
              Selected Nodes for Feedback:
            </Text>
            <HStack spacing={2} flexWrap="wrap" gap={2}>
              {selectedNodeIds.map((nodeId) => {
                const node = availableNodes.find((n) => n.id === nodeId);
                return (
                  <Tag
                    key={nodeId}
                    size="sm"
                    colorScheme="yellow"
                    borderRadius="full"
                    px={3}
                    py={1}
                    boxShadow="sm"
                  >
                    <TagLabel fontWeight="medium">
                      {node?.name || nodeId}
                    </TagLabel>
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
          borderTop="1px solid"
          borderColor="teal.200"
          bgGradient="linear(to-b, teal.50, cyan.50)"
          css={{
            animation: "slideUp 0.3s ease-out",
            "@keyframes slideUp": {
              from: { opacity: 0, transform: "translateY(10px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between" align="center">
              <HStack spacing={3} flex={1}>
                <Box
                  p={2}
                  bg="teal.500"
                  borderRadius="lg"
                  boxShadow="0 2px 8px rgba(49, 151, 149, 0.3)"
                >
                  <RiRobot2Fill size={14} color="white" />
                </Box>
                <Box>
                  <HStack spacing={2} mb={0.5}>
                    <Badge
                      colorScheme="teal"
                      fontSize="xs"
                      borderRadius="full"
                      px={2}
                      textTransform="none"
                    >
                      AI Suggestions
                    </Badge>
                  </HStack>
                  <Text fontWeight="semibold" fontSize="sm" color="teal.800">
                    {selectedAutomaticNode.nodeName}
                  </Text>
                </Box>
              </HStack>
              <Button
                size="xs"
                variant="solid"
                bg="white"
                color="teal.600"
                borderRadius="full"
                px={3}
                boxShadow="sm"
                _hover={{ bg: "teal.50", transform: "scale(1.02)" }}
                transition="all 0.2s"
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
                  maxH="250px"
                  overflowY="auto"
                  pr={1}
                  css={{
                    "&::-webkit-scrollbar": { width: "4px" },
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#81E6D9",
                      borderRadius: "10px",
                    },
                  }}
                >
                  {selectedAutomaticNode.mappingEntry.candidates
                    .filter((candidate: any) => {
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
                          bg={isSelected ? "white" : "whiteAlpha.700"}
                          border="2px solid"
                          borderColor={isSelected ? "teal.400" : "transparent"}
                          borderRadius="xl"
                          cursor="pointer"
                          position="relative"
                          overflow="hidden"
                          onClick={() =>
                            handleCandidateChange(
                              selectedAutomaticNode.nodeId,
                              candidate.activity_id
                            )
                          }
                          _hover={{
                            borderColor: "teal.300",
                            bg: "white",
                            transform: "translateX(4px)",
                            boxShadow: "0 4px 12px rgba(49, 151, 149, 0.15)",
                          }}
                          transition="all 0.2s ease-out"
                          boxShadow={
                            isSelected
                              ? "0 4px 12px rgba(49, 151, 149, 0.2)"
                              : "sm"
                          }
                          _before={
                            isSelected
                              ? {
                                  content: '""',
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: "4px",
                                  bgGradient:
                                    "linear(to-b, teal.400, cyan.400)",
                                  borderLeftRadius: "xl",
                                }
                              : undefined
                          }
                        >
                          <HStack justify="space-between" align="start">
                            <VStack align="start" spacing={1} flex={1}>
                              <HStack>
                                {isSelected && (
                                  <Box p={1} bg="teal.100" borderRadius="full">
                                    <CheckIcon color="teal.600" boxSize={2.5} />
                                  </Box>
                                )}
                                <Text
                                  fontSize="sm"
                                  fontWeight={
                                    isSelected ? "semibold" : "medium"
                                  }
                                  color={isSelected ? "teal.700" : "gray.700"}
                                >
                                  {candidate.keyword || candidate.activity_id}
                                </Text>
                              </HStack>
                              <Text fontSize="xs" color="gray.400">
                                {candidate.activity_id}
                              </Text>
                              {candidate.pkg && (
                                <Badge
                                  size="sm"
                                  bg="blue.50"
                                  color="blue.600"
                                  fontSize="xs"
                                  borderRadius="full"
                                  px={2}
                                >
                                  {candidate.pkg}
                                </Badge>
                              )}
                            </VStack>
                            <Box
                              px={2}
                              py={1}
                              borderRadius="full"
                              bg={
                                score >= 0.8
                                  ? "green.100"
                                  : score >= 0.7
                                  ? "yellow.100"
                                  : "red.100"
                              }
                            >
                              <Text
                                fontSize="xs"
                                fontWeight="bold"
                                color={
                                  score >= 0.8
                                    ? "green.600"
                                    : score >= 0.7
                                    ? "yellow.700"
                                    : "red.600"
                                }
                              >
                                {Math.round(score * 100)}%
                              </Text>
                            </Box>
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
        py={3}
        bg="white"
        borderBottomRadius="2xl"
        boxShadow="0 -4px 20px rgba(0, 0, 0, 0.03)"
      >
        {/* Approve/Reject Buttons - Above textarea */}
        {showFeedbackButtons && (
          <HStack spacing={3} mb={3} justify="center">
            <Button
              size="sm"
              bgGradient="linear(to-r, green.400, green.500)"
              color="white"
              leftIcon={<CheckIcon />}
              borderRadius="full"
              px={5}
              fontWeight="semibold"
              boxShadow="0 4px 14px rgba(72, 187, 120, 0.3)"
              _hover={{
                bgGradient: "linear(to-r, green.500, green.600)",
                transform: "translateY(-2px)",
                boxShadow: "0 6px 20px rgba(72, 187, 120, 0.4)",
              }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.2s"
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
              bg="white"
              color="red.500"
              border="2px solid"
              borderColor="red.200"
              leftIcon={<CloseIcon />}
              borderRadius="full"
              px={5}
              fontWeight="semibold"
              _hover={{
                bg: "red.50",
                borderColor: "red.400",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 14px rgba(245, 101, 101, 0.2)",
              }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.2s"
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
            bgGradient="linear(to-r, blue.50, purple.50)"
            p={3}
            borderRadius="xl"
            mb={3}
            border="1px solid"
            borderColor="blue.200"
            css={{
              animation: "fadeIn 0.3s ease-out",
              "@keyframes fadeIn": {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            <HStack spacing={2}>
              <Box p={1.5} bg="blue.100" borderRadius="lg">
                <Text fontSize="xs">⚠️</Text>
              </Box>
              <Text fontSize="xs" color="blue.700" fontWeight="medium">
                Select nodes on the canvas, then provide feedback below.
              </Text>
            </HStack>
          </Box>
        )}

        {/* Textarea - Unified input */}
        <HStack spacing={2} align="center">
          <Box flex={1} position="relative">
            <Textarea
              placeholder={
                currentStage === "idle"
                  ? "Describe your process workflow..."
                  : isRejectMode
                  ? "Provide feedback for selected nodes..."
                  : "Optional feedback..."
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
              border="2px solid"
              borderColor={isRejectMode ? "red.200" : "gray.200"}
              borderRadius="xl"
              _focus={{
                borderColor: isRejectMode ? "red.400" : "teal.400",
                bg: "white",
                boxShadow: isRejectMode
                  ? "0 0 0 3px rgba(245, 101, 101, 0.1)"
                  : "0 0 0 3px rgba(49, 151, 149, 0.1)",
              }}
              _hover={{
                borderColor: isRejectMode ? "red.300" : "gray.300",
              }}
              transition="all 0.2s"
              rows={currentStage === "idle" ? 2 : 2}
              resize="none"
              py={3}
              px={4}
              fontSize="sm"
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
          </Box>
          {currentStage === "idle" && (
            <IconButton
              aria-label="Send message"
              icon={<ArrowForwardIcon />}
              bgGradient="linear(to-r, teal.500, teal.400)"
              color="white"
              size="md"
              borderRadius="xl"
              boxShadow="0 4px 14px rgba(49, 151, 149, 0.3)"
              _hover={{
                bgGradient: "linear(to-r, teal.600, teal.500)",
                transform: "translateY(-2px) scale(1.02)",
                boxShadow: "0 6px 20px rgba(49, 151, 149, 0.4)",
              }}
              _active={{ transform: "translateY(0) scale(0.98)" }}
              _disabled={{
                bgGradient: "linear(to-r, gray.300, gray.400)",
                cursor: "not-allowed",
                boxShadow: "none",
              }}
              transition="all 0.2s"
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
        <Flex justify="center" mt={2}>
          <Button
            size="xs"
            variant="ghost"
            color="gray.400"
            fontWeight="medium"
            borderRadius="full"
            px={4}
            _hover={{ color: "gray.600", bg: "gray.100" }}
            transition="all 0.2s"
            onClick={handleResetChat}
            isDisabled={
              startPipelineMutation.isPending ||
              submitFeedbackMutation.isPending
            }
          >
            Reset conversation
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
