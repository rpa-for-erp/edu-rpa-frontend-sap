import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  IconButton,
  CloseButton,
  VStack,
  HStack,
  Spinner,
  Button,
  useToast,
  Link,
  Badge,
  Divider,
  Avatar,
  Textarea,
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

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  processId: string;

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

export default function AIChatbot({
  isOpen,
  onClose,
  processId,

  onApplyXml,
}: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Certainly! I usually take around 50 seconds to handle your request.

I don't always get it right, so please review the process and feel free to try again with a different prompt. To learn more, visit the Chatbot RPA Documentation.

I will model this process, ignoring the previous AI agent context and any code.`,
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
          content: `Certainly! I usually take around 50 seconds to handle your request.

I don't always get it right, so please review the process and feel free to try again with a different prompt. To learn more, visit the Chatbot RPA Documentation.

I will model this process, ignoring the previous AI agent context and any code.`,
          timestamp: Date.now(),
        },
      ]);
      setCurrentStage("idle");
      setCurrentInterrupt(null);
      setFinalXml(null);
      setFeedbackText("");
    }
  }, [isOpen]);

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

    // Mapping may be an object keyed by node id or an array
    const entries: any[] = Array.isArray(mapping)
      ? mapping
      : Object.values(mapping);

    // First, collect all node_ids with is_automatic === true
    const baseIds = entries
      .filter((m: any) => m && m.is_automatic && m.node_id)
      .map((m: any) => m.node_id as string);

    // If we don't have BPMN nodes, just return the raw list
    if (!bpmn || !Array.isArray(bpmn.nodes)) {
      return baseIds;
    }

    // Filter only ids that actually exist in BPMN nodes
    const nodeIdSet = new Set(
      bpmn.nodes.map((n: any) => (n && n.id ? n.id : null)).filter(Boolean)
    );

    return baseIds.filter((id) => nodeIdSet.has(id));
  };

  const applyAutoLayoutAndSetState = async (
    xml: string,
    activities?: any[] | null,
    automaticIds?: string[]
  ) => {
    try {
      const layoutedXml = await layoutProcess(xml);
      setFinalXml(layoutedXml);
    } catch (e) {
      console.error("❌ [Pipeline] bpmn-auto-layout failed, using raw XML:", e);
      setFinalXml(xml);
    }

    if (activities) {
      setPendingActivities(activities);
    }

    if (automaticIds && automaticIds.length > 0) {
      setAutomaticNodeIds(automaticIds);
    } else {
      setAutomaticNodeIds([]);
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

        // Display BPMN info
        const bpmnInfo = data.interrupt.bpmn;
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

        // Convert BPMN JSON -> XML for preview / apply
        try {
          const result = convertJsonToProcess({ bpmn: bpmnInfo });
          if (result.success && result.xml) {
            const automaticIds = extractAutomaticNodeIds(
              data.state?.mapping || data.mapping,
              bpmnInfo
            );
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
        const message: ChatMessage = {
          id: `mapping-feedback-${Date.now()}`,
          role: "assistant",
          content:
            data.interrupt.instruction ||
            "I've mapped activities to the BPMN nodes. Please review the mapping.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, message]);

        // Display mapping info
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

        // Convert BPMN (if provided) for preview / apply
        if (data.interrupt.bpmn) {
          try {
            const result = convertJsonToProcess({ bpmn: data.interrupt.bpmn });
            if (result.success && result.xml) {
              const automaticIds = extractAutomaticNodeIds(
                data.interrupt.mapping,
                data.interrupt.bpmn
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

      // Always derive XML from BPMN (nodes, flows), ignore any XML returned from backend
      const completedMapping = data.mapping || data.state?.mapping;
      const completedBpmn = data.bpmn || data.state?.bpmn;

      if (completedBpmn) {
        try {
          const result = convertJsonToProcess({ bpmn: completedBpmn });
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
      const processingMessage: ChatMessage = {
        id: `processing-${Date.now()}`,
        role: "assistant",
        content: `Processing at node: ${data.current_node || "unknown"}...`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, processingMessage]);
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

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Start pipeline
    setCurrentStage("processing");
    startPipelineMutation.mutate(inputValue);

    // Clear input
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
    submitFeedbackMutation.mutate({
      threadId,
      feedback: { user_decision: "approve" },
    });
    setFeedbackText("");
  };

  const handleRejectBpmn = () => {
    if (!threadId) return;

    const userMessage: ChatMessage = {
      id: `user-reject-${Date.now()}`,
      role: "user",
      content: `❌ Rejected BPMN structure${
        feedbackText ? `\nFeedback: ${feedbackText}` : ""
      }`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setCurrentStage("processing");
    submitFeedbackMutation.mutate({
      threadId,
      feedback: {
        user_decision: "reject",
        user_feedback_text: feedbackText || undefined,
      },
    });
    setFeedbackText("");
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
    submitFeedbackMutation.mutate({
      threadId,
      feedback: { user_mapping_decision: "approve" },
    });
    setFeedbackText("");
  };

  const handleRejectMapping = () => {
    if (!threadId) return;

    const userMessage: ChatMessage = {
      id: `user-reject-mapping-${Date.now()}`,
      role: "user",
      content: `❌ Rejected activity mapping${
        feedbackText ? `\nFeedback: ${feedbackText}` : ""
      }`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setCurrentStage("processing");
    submitFeedbackMutation.mutate({
      threadId,
      feedback: {
        user_mapping_decision: "reject",
        user_mapping_feedback_text: feedbackText || undefined,
      },
    });
    setFeedbackText("");
  };

  // Auto-apply to canvas whenever we have fresh XML and handler provided
  useEffect(() => {
    const apply = async () => {
      if (!finalXml || !onApplyXml) return;
      setIsApplying(true);
      try {
        await onApplyXml(
          finalXml,
          pendingActivities || undefined,
          automaticNodeIds
        );
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
      content: `Certainly! I usually take around 50 seconds to handle your request.

I don't always get it right, so please review the process and feel free to try again with a different prompt. To learn more, visit the Chatbot RPA Documentation.

I will model this process, ignoring the previous AI agent context and any code.`,
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
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={4}
      right={4}
      pb={6}
      width="500px"
      height="700px"
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
                    {currentStage === "processing"
                      ? "Processing..."
                      : "Thinking..."}
                  </Text>
                </HStack>
              </Box>
            </HStack>
          </Flex>
        )}

        {/* BPMN Feedback Buttons */}
        {currentStage === "bpmn_feedback" &&
          !submitFeedbackMutation.isPending && (
            <VStack spacing={2} width="100%" pt={2}>
              <Textarea
                placeholder="Optional: Provide feedback if rejecting..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                size="sm"
                bg="white"
                rows={2}
              />
              <HStack spacing={3} width="100%" justify="center">
                <Button
                  size="sm"
                  colorScheme="green"
                  leftIcon={<CheckIcon />}
                  onClick={handleApproveBpmn}
                >
                  Approve BPMN
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  leftIcon={<CloseIcon />}
                  onClick={handleRejectBpmn}
                >
                  Reject BPMN
                </Button>
              </HStack>
            </VStack>
          )}

        {/* Mapping Feedback Buttons */}
        {currentStage === "mapping_feedback" &&
          !submitFeedbackMutation.isPending && (
            <VStack spacing={2} width="100%" pt={2}>
              <Textarea
                placeholder="Optional: Provide feedback if rejecting..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                size="sm"
                bg="white"
                rows={2}
              />
              <HStack spacing={3} width="100%" justify="center">
                <Button
                  size="sm"
                  colorScheme="green"
                  leftIcon={<CheckIcon />}
                  onClick={handleApproveMapping}
                >
                  Approve Mapping
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  leftIcon={<CloseIcon />}
                  onClick={handleRejectMapping}
                >
                  Reject Mapping
                </Button>
              </HStack>
            </VStack>
          )}

        <div ref={messagesEndRef} />
      </VStack>

      {/* Input Area */}
      <Box
        px={4}
        py={3}
        borderTop="1px solid"
        borderColor="gray.200"
        bg="white"
        borderBottomRadius="lg"
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={handleResetChat}
          isDisabled={
            startPipelineMutation.isPending || submitFeedbackMutation.isPending
          }
        >
          Reset chat
        </Button>
        <HStack spacing={2} align="center">
          <Input
            placeholder="Enter a process description"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            size="md"
            bg="gray.50"
            border="2px solid"
            borderColor="teal.200"
            _focus={{
              borderColor: "teal.500",
              boxShadow: "0 0 0 1px #319795",
            }}
            isDisabled={
              startPipelineMutation.isPending ||
              submitFeedbackMutation.isPending ||
              isApplying ||
              currentStage !== "idle"
            }
          />
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
              isApplying ||
              currentStage !== "idle"
            }
            isLoading={startPipelineMutation.isPending}
          />
        </HStack>
      </Box>
    </Box>
  );
}
