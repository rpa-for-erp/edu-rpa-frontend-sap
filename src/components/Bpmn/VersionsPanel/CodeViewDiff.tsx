import React from "react";
import { Box, Flex, Text, Center } from "@chakra-ui/react";
import { DiffEditor, Editor } from "@monaco-editor/react";

interface CodeViewDiffProps {
  originalXml: string;
  modifiedXml: string;
  originalLabel?: string;
  modifiedLabel?: string;
  showDiff?: boolean;
}

export default function CodeViewDiff({
  originalXml,
  modifiedXml,
  originalLabel = "Process 1",
  modifiedLabel = "Process 2",
  showDiff = true,
}: CodeViewDiffProps) {
  // When showDiff is false, show single editor with originalXml
  if (!showDiff) {
    return (
      <Box h="100%" w="100%" bg="white">
        {/* Single Label */}
        <Box
          px={4}
          py={2}
          bg="gray.50"
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            {originalLabel}
          </Text>
        </Box>

        {/* Single Editor or Empty State */}
        <Box h="calc(100% - 40px)">
          {originalXml ? (
            <Editor
              value={originalXml}
              language="xml"
              theme="vs"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: "on",
                folding: true,
                wordWrap: "off",
                automaticLayout: true,
              }}
            />
          ) : (
            <Center h="100%" bg="gray.50">
              <Text color="gray.500">Select a version to view its code</Text>
            </Center>
          )}
        </Box>
      </Box>
    );
  }

  // Diff mode - show side by side comparison
  return (
    <Box h="100%" w="100%" bg="white">
      {/* Labels */}
      <Flex borderBottom="1px solid" borderColor="gray.200">
        <Box
          flex={1}
          px={4}
          py={1}
          bg="red.50"
          borderRight="1px solid"
          borderColor="gray.200"
        >
          <Text fontSize="sm" fontWeight="medium" color="red.700">
            {originalLabel}
          </Text>
        </Box>
        <Box flex={1} px={4} py={1} bg="green.50">
          <Text fontSize="sm" fontWeight="medium" color="green.700">
            {modifiedLabel}
          </Text>
        </Box>
      </Flex>

      {/* Diff Editor */}
      <Box h="calc(100% - 40px)">
        <DiffEditor
          original={originalXml}
          modified={modifiedXml}
          language="xml"
          theme="vs"
          options={{
            readOnly: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: "on",
            folding: true,
            wordWrap: "off",
            automaticLayout: true,
            renderOverviewRuler: true,
            diffWordWrap: "off",
            enableSplitViewResizing: true,
            ignoreTrimWhitespace: false,
            renderIndicators: true,
            originalEditable: false,
          }}
        />
      </Box>
    </Box>
  );
}
