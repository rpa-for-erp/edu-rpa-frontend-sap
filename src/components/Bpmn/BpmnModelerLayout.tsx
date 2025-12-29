import React, { ReactNode } from "react";
import { Box, Flex } from "@chakra-ui/react";
import BpmnTopHeader from "./BpmnTopHeader";
import BpmnSubHeader from "./BpmnSubHeader";
import BpmnZoomControls from "./BpmnZoomControls";
import { AIChatbot, AIChatbotButton } from "./AIChatbot";

interface BpmnModelerLayoutProps {
  processID: string;
  processName: string;
  isSaved: boolean;
  version?: string;
  onSaveAll: () => void;
  onPublish: () => void;
  onRobotCode: () => void;
  onCreateVersion?: () => void;
  onShowVersions?: () => void;
  children: ReactNode;
  rightSidebar: ReactNode;
  bottomPanel: ReactNode;
  modelerRef?: any;
  // AI Chatbot props
  isChatbotOpen?: boolean;
  onToggleChatbot?: () => void;
  onApplyBpmn?: (bpmnJson: any) => Promise<void>;
  onApplyXml?: (
    xml: string,
    activities?: any[],
    automaticNodeIds?: string[]
  ) => Promise<void>;
}

export default function BpmnModelerLayout({
  processID,
  processName,
  isSaved,
  version,
  onSaveAll,
  onPublish,
  onRobotCode,
  onCreateVersion,
  onShowVersions,
  children,
  rightSidebar,
  bottomPanel,
  modelerRef,
  isChatbotOpen = false,
  onToggleChatbot,
  onApplyXml,
}: BpmnModelerLayoutProps) {
  return (
    <Flex direction="column" height="100vh" overflow="hidden">
      {/* Top Header */}
      <BpmnTopHeader processID={processID} processName={processName} />

      {/* Sub Header */}
      <BpmnSubHeader
        isSaved={isSaved}
        version={version}
        onSaveAll={onSaveAll}
        onPublish={onPublish}
        onRobotCode={onRobotCode}
        onCreateVersion={onCreateVersion}
        onShowVersions={onShowVersions}
      />

      {/* Main Content Area */}
      <Flex flex={1} overflow="hidden">
        {/* Main Canvas Area - Full width, default palette will show */}
        <Box flex={1} position="relative" overflow="hidden">
          {children}

          {/* Zoom Controls - Pass modeler directly */}
          <BpmnZoomControls modelerRef={modelerRef} />

          {/* AI Chatbot Button */}
          {onToggleChatbot && (
            <AIChatbotButton onClick={onToggleChatbot} isOpen={isChatbotOpen} />
          )}
        </Box>

        {/* Right Sidebar - Properties & Comments */}
        {rightSidebar}
      </Flex>

      {/* Bottom Panel - Variables, Logs, etc. */}
      {bottomPanel}

      {/* AI Chatbot Dialog */}
      {onApplyXml && (
        <AIChatbot
          isOpen={isChatbotOpen}
          onClose={() => onToggleChatbot?.()}
          processId={processID}
          modelerRef={modelerRef}
          onApplyXml={onApplyXml}
        />
      )}
    </Flex>
  );
}
