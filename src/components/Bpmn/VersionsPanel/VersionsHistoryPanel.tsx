import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Badge,
} from "@chakra-ui/react";
import { VersionListItem } from "@/interfaces/version";
import {
  FiMoreVertical,
  FiRotateCcw,
  FiEdit2,
  FiDownload,
  FiTrash2,
} from "react-icons/fi";

interface VersionsHistoryPanelProps {
  versions: VersionListItem[];
  // Support selecting 2 versions for comparison
  baseVersionId?: string;
  compareVersionId?: string;
  onVersionSelect: (version: VersionListItem, isBaseVersion: boolean) => void;
  showChanges: boolean;
  onRestoreVersion?: (version: VersionListItem) => void;
  onEditVersion?: (version: VersionListItem) => void;
  onDownloadVersion?: (version: VersionListItem) => void;
  onDeleteVersion?: (version: VersionListItem) => void;
}

// Helper function to group versions by date
const getVersionsGroupedByDate = (
  versions: VersionListItem[]
): Record<string, VersionListItem[]> => {
  const groups: Record<string, VersionListItem[]> = {};

  versions.forEach((version) => {
    const date = new Date(version.updatedAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey: string;

    if (date.toDateString() === today.toDateString()) {
      dateKey = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = "Yesterday";
    } else {
      dateKey = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(version);
  });

  return groups;
};

// Helper function to format time
const formatVersionTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export default function VersionsHistoryPanel({
  versions,
  baseVersionId,
  compareVersionId,
  onVersionSelect,
  showChanges,
  onRestoreVersion,
  onEditVersion,
  onDownloadVersion,
  onDeleteVersion,
}: VersionsHistoryPanelProps) {
  const groupedVersions = getVersionsGroupedByDate(versions);

  const getSelectionState = (versionId: string) => {
    if (versionId === baseVersionId) return "base";
    if (versionId === compareVersionId) return "compare";
    return null;
  };

  const handleVersionClick = (version: VersionListItem) => {
    if (!showChanges) {
      // When showChanges is off, only select one version (base)
      onVersionSelect(version, true);
      return;
    }

    // When showChanges is on, allow selecting 2 versions
    const state = getSelectionState(version.id);

    if (state === "base") {
      // Clicking on base version - do nothing or could deselect
      return;
    } else if (state === "compare") {
      // Clicking on compare version - swap to base
      onVersionSelect(version, true);
    } else {
      // Clicking on unselected version
      if (!baseVersionId) {
        // No base selected - select as base
        onVersionSelect(version, true);
      } else if (!compareVersionId) {
        // Base selected, no compare - select as compare
        onVersionSelect(version, false);
      } else {
        // Both selected - replace compare
        onVersionSelect(version, false);
      }
    }
  };

  // Get creator display name
  const getCreatorName = (version: VersionListItem): string => {
    if (version.creator?.name) {
      return version.creator.name;
    }
    return `User ${version.createdBy}`;
  };

  return (
    <Box
      w="280px"
      bg="white"
      borderLeft="1px solid"
      borderColor="gray.200"
      h="100%"
      overflowY="auto"
    >
      {/* Header */}
      <Box p={3} borderBottom="1px solid" borderColor="gray.200">
        <Text fontSize="sm" fontWeight="semibold" color="gray.800">
          Versions ({versions.length})
        </Text>
      </Box>

      {/* Selection Guide */}
      {showChanges && (
        <Box
          px={3}
          py={2}
          bg="blue.50"
          borderBottom="1px solid"
          borderColor="blue.100"
        >
          <Text fontSize="xs" color="blue.600">
            {!baseVersionId
              ? "Click to select base version"
              : !compareVersionId
              ? "Click to select version to compare"
              : "Click on another version to change comparison"}
          </Text>
        </Box>
      )}

      {/* Versions List */}
      <VStack spacing={0} align="stretch">
        {Object.entries(groupedVersions).map(
          ([date, dateVersions], groupIndex) => (
            <Box key={date}>
              {/* Date Separator */}
              <Box px={3} py={2} bg="gray.50">
                <Text fontSize="xs" color="gray.500" fontWeight="medium">
                  {date}
                </Text>
              </Box>

              {/* Versions for this date */}
              {dateVersions.map((version) => {
                const selectionState = getSelectionState(version.id);
                const isSelected = selectionState !== null;

                return (
                  <Box
                    key={version.id}
                    px={3}
                    py={3}
                    cursor="pointer"
                    bg={
                      selectionState === "base"
                        ? "red.50"
                        : selectionState === "compare"
                        ? "green.50"
                        : "transparent"
                    }
                    _hover={{
                      bg: isSelected
                        ? selectionState === "base"
                          ? "red.100"
                          : "green.100"
                        : "gray.50",
                    }}
                    onClick={() => handleVersionClick(version)}
                    borderBottom="1px solid"
                    borderColor="gray.100"
                    borderLeft={
                      isSelected
                        ? `3px solid ${
                            selectionState === "base" ? "#E53E3E" : "#38A169"
                          }`
                        : "3px solid transparent"
                    }
                    position="relative"
                  >
                    <HStack spacing={3} align="start">
                      {/* Avatar */}
                      <Avatar
                        size="sm"
                        name={getCreatorName(version)}
                        bg="cyan.500"
                        color="white"
                        fontSize="xs"
                      />

                      {/* Version Info */}
                      <VStack spacing={0.5} align="start" flex={1}>
                        <HStack spacing={2}>
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color="gray.800"
                          >
                            {version.tag}
                          </Text>

                          {showChanges && selectionState && (
                            <Badge
                              colorScheme={
                                selectionState === "base" ? "red" : "green"
                              }
                              fontSize="xs"
                              px={2}
                              borderRadius="full"
                            >
                              {selectionState === "base" ? "Base" : "Compare"}
                            </Badge>
                          )}
                          {/* {!showChanges && isSelected && !version.isCurrent && (
                            <Badge
                              colorScheme="blue"
                              fontSize="xs"
                              px={2}
                              borderRadius="full"
                            >
                              Selected
                            </Badge>
                          )} */}
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                          {formatVersionTime(version.updatedAt)} -{" "}
                          {getCreatorName(version)}
                        </Text>
                        {version.description && (
                          <Text
                            fontSize="xs"
                            color="gray.600"
                            noOfLines={2}
                            mt={1}
                          >
                            {version.description}
                          </Text>
                        )}
                      </VStack>

                      {/* Actions Menu */}
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FiMoreVertical />}
                          variant="ghost"
                          size="sm"
                          aria-label="Version options"
                          onClick={(e) => e.stopPropagation()}
                          _hover={{ bg: "gray.200" }}
                        />
                        <MenuList minW="160px" shadow="lg">
                          {!version.isCurrent && (
                            <MenuItem
                              icon={<FiRotateCcw />}
                              onClick={(e) => {
                                e.stopPropagation();
                                onRestoreVersion?.(version);
                              }}
                              _hover={{
                                bg: "transparent",
                                outline: "2px solid",
                                outlineColor: "#5B5DD9",
                                outlineOffset: "-2px",
                              }}
                            >
                              Restore as latest
                            </MenuItem>
                          )}
                          <MenuItem
                            icon={<FiEdit2 />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditVersion?.(version);
                            }}
                            _hover={{
                              bg: "transparent",
                              outline: "2px solid",
                              outlineColor: "#5B5DD9",
                              outlineOffset: "-2px",
                            }}
                          >
                            Edit
                          </MenuItem>
                          <MenuItem
                            icon={<FiDownload />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownloadVersion?.(version);
                            }}
                            _hover={{
                              bg: "transparent",
                              outline: "2px solid",
                              outlineColor: "#5B5DD9",
                              outlineOffset: "-2px",
                            }}
                          >
                            Download
                          </MenuItem>
                          {!version.isCurrent && (
                            <MenuItem
                              icon={<FiTrash2 />}
                              color="red.500"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteVersion?.(version);
                              }}
                              _hover={{
                                bg: "transparent",
                                outline: "2px solid",
                                outlineColor: "#5B5DD9",
                                outlineOffset: "-2px",
                              }}
                            >
                              Delete
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    </HStack>
                  </Box>
                );
              })}
            </Box>
          )
        )}

        {versions.length === 0 && (
          <Box p={4} textAlign="center">
            <Text fontSize="sm" color="gray.500">
              No versions available
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
