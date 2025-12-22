import React, { useState, useCallback, useRef, useEffect } from "react";
import { Box, VStack, HStack, Text, Badge } from "@chakra-ui/react";
import { DetectedChange } from "./VisualViewDiff";

interface ChangesPanelProps {
  changes: DetectedChange[];
  onChangeClick?: (change: DetectedChange) => void;
  selectedChangeId?: string;
}

// Resize constraints
const MIN_WIDTH = 180;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 220;

const getChangeTypeColor = (changeType: DetectedChange["changeType"]) => {
  switch (changeType) {
    case "added":
      return "green";
    case "changed":
      return "orange";
    case "layoutChanged":
      return "purple";
    case "removed":
      return "red";
    default:
      return "gray";
  }
};

const getChangeTypeLabel = (changeType: DetectedChange["changeType"]) => {
  switch (changeType) {
    case "added":
      return "Added";
    case "changed":
      return "Changed";
    case "layoutChanged":
      return "Moved";
    case "removed":
      return "Removed";
    default:
      return changeType;
  }
};

export default function ChangesPanel({
  changes,
  onChangeClick,
  selectedChangeId,
}: ChangesPanelProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const changesByType = {
    added: changes.filter((c) => c.changeType === "added"),
    changed: changes.filter((c) => c.changeType === "changed"),
    layoutChanged: changes.filter((c) => c.changeType === "layoutChanged"),
    removed: changes.filter((c) => c.changeType === "removed"),
  };

  const totalChanges = changes.length;

  // Handle mouse move during resize
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const panelRect = panelRef.current.getBoundingClientRect();
      const newWidth = e.clientX - panelRect.left;

      // Clamp width between min and max
      const clampedWidth = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
      setWidth(clampedWidth);
    },
    [isResizing]
  );

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, []);

  // Start resizing
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <Box
      ref={panelRef}
      w={`${width}px`}
      minW={`${MIN_WIDTH}px`}
      maxW={`${MAX_WIDTH}px`}
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      h="100%"
      position="relative"
      flexShrink={0}
    >
      {/* Header */}
      <Box p={3} borderBottom="1px solid" borderColor="gray.200">
        <Text fontSize="sm" fontWeight="medium" color="gray.700">
          Changes ({totalChanges})
        </Text>
      </Box>

      {/* Changes List */}
      <Box overflowY="auto" h="calc(100% - 48px)">
        <VStack spacing={0} align="stretch">
          {Object.entries(changesByType).map(([type, typeChanges]) => {
            if (typeChanges.length === 0) return null;

            return typeChanges.map((change) => (
              <Box
                key={change.id}
                px={3}
                py={2}
                cursor="pointer"
                bg={selectedChangeId === change.id ? "blue.50" : "transparent"}
                _hover={{ bg: "gray.50" }}
                onClick={() => onChangeClick?.(change)}
                borderBottom="1px solid"
                borderColor="gray.100"
              >
                <HStack spacing={2} align="start">
                  <Text fontSize="sm" color="gray.800" noOfLines={2} flex={1}>
                    {change.elementName}
                  </Text>
                  <Badge
                    colorScheme={getChangeTypeColor(change.changeType)}
                    fontSize="xs"
                    px={2}
                    py={0.5}
                    borderRadius="md"
                    fontWeight="medium"
                    flexShrink={0}
                  >
                    {getChangeTypeLabel(change.changeType)}
                  </Badge>
                </HStack>
              </Box>
            ));
          })}

          {totalChanges === 0 && (
            <Box p={4} textAlign="center">
              <Text fontSize="sm" color="gray.500">
                No changes detected
              </Text>
            </Box>
          )}
        </VStack>
      </Box>

      {/* Resize Handle */}
      <Box
        position="absolute"
        top={0}
        right={0}
        w="6px"
        h="100%"
        cursor="col-resize"
        bg={isResizing ? "blue.200" : "transparent"}
        _hover={{ bg: "blue.100" }}
        onMouseDown={handleResizeStart}
        transition="background-color 0.15s"
        zIndex={10}
      >
        {/* Visual indicator line */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w="2px"
          h="40px"
          bg={isResizing ? "blue.400" : "gray.300"}
          borderRadius="full"
          opacity={isResizing ? 1 : 0}
          _groupHover={{ opacity: 1 }}
          transition="opacity 0.15s"
        />
      </Box>
    </Box>
  );
}
