import React, { useState } from "react";
import {
  Box,
  Flex,
  Button,
  Switch,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tabs,
  TabList,
  Tab,
} from "@chakra-ui/react";
import { ChevronDownIcon, HamburgerIcon } from "@chakra-ui/icons";
import { FaSave } from "react-icons/fa";
import { useSaveShortcut } from "@/hooks/useSaveShortCut";

interface BpmnSubHeaderProps {
  isSaved: boolean;
  version?: string;
  onSaveAll: () => void;
  onPublish: () => void;
  onRobotCode: () => void;
  onCreateVersion?: () => void;
  onShowVersions?: () => void;
  tokenSimulation?: boolean;
  onTokenSimulationChange?: (enabled: boolean) => void;
}

export default function BpmnSubHeader({
  isSaved,
  version,
  onSaveAll,
  onPublish,
  onRobotCode,
  onCreateVersion,
  onShowVersions,
  tokenSimulation = false,
  onTokenSimulationChange,
}: BpmnSubHeaderProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleChangeToSimulateTab = () => {
    setActiveTab(1);
    onTokenSimulationChange?.(false);
  }
  // Add Ctrl+S shortcut support
  useSaveShortcut(onSaveAll);

  return (
    <Box
      bg="gray.50"
      borderBottom="1px solid"
      borderColor="gray.200"
      px={4}
      py={2}
    >
      <Flex justify="space-between" align="center">
        {/* Left Section: Tabs */}
        <Flex align="center" gap={6}>
          <Tabs
            index={activeTab}
            onChange={setActiveTab}
            variant="unstyled"
            size="sm"
          >
            <TabList>
              <Tab
                _selected={{
                  color: "teal.600",
                  borderBottom: "2px solid",
                  borderColor: "teal.600",
                }}
                fontWeight="medium"
                pb={2}
              >
                Design
              </Tab>
              <Tab
                _selected={{
                  color: "teal.600",
                  borderBottom: "2px solid",
                  borderColor: "teal.600",
                }}
                onClick={handleChangeToSimulateTab}
                fontWeight="medium"
                pb={2}
              >
                Simulate
              </Tab>
            </TabList>
          </Tabs>

          {/* Token Simulation Toggle */}
          {activeTab === 0 && (
            <Flex align="center" gap={2}>
              <Switch
              colorScheme="teal"
              isChecked={tokenSimulation}
              onChange={(e) => onTokenSimulationChange?.(e.target.checked)}
              size="sm"
            />
              <Text fontSize="sm" color="gray.700">
                Token simulation
              </Text>
            </Flex>
          )}
        </Flex>

        {/* Right Section: Actions */}
        <Flex align="center" gap={3}>
          {/* Save Button */}
          <Button
            size="sm"
            leftIcon={<FaSave />}
            colorScheme={isSaved ? "gray" : "orange"}
            variant={isSaved ? "outline" : "solid"}
            onClick={onSaveAll}
            fontWeight="medium"
            px={4}
            isDisabled={isSaved}
          >
            {isSaved ? "Saved" : "Save"}
          </Button>

          {/* Version Dropdown */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              size="sm"
              variant="outline"
              borderColor="blue.500"
              color="blue.600"
              _hover={{ bg: "blue.50" }}
              fontWeight="medium"
            >
              Version
            </MenuButton>
            <MenuList minW="200px">
              <MenuItem
                _hover={{
                  bg: "transparent",
                  outline: "2px solid",
                  outlineColor: "#5B5DD9",
                  outlineOffset: "-2px",
                }}
                onClick={onCreateVersion}
              >
                Create version
              </MenuItem>
              <MenuItem
                _hover={{
                  bg: "transparent",
                  outline: "2px solid",
                  outlineColor: "#5B5DD9",
                  outlineOffset: "-2px",
                }}
                onClick={onShowVersions}
              >
                Show versions
              </MenuItem>
            </MenuList>
          </Menu>

          {/* Publish Button */}
          <Button
            size="sm"
            bg="pink.500"
            color="white"
            _hover={{ bg: "pink.600" }}
            onClick={onPublish}
            fontWeight="medium"
            px={6}
          >
            Publish
          </Button>

          {/* RobotCode Button */}
          <Button
            size="sm"
            colorScheme="teal"
            onClick={onRobotCode}
            fontWeight="medium"
            px={6}
          >
            RobotCode
          </Button>

          {/* More Menu */}
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<HamburgerIcon />}
              variant="ghost"
              size="sm"
              aria-label="More options"
            />
            <MenuList>
              <MenuItem icon={<FaSave />} onClick={onSaveAll}>
                Save All
              </MenuItem>
              <MenuItem>Export XML</MenuItem>
              <MenuItem>Import BPMN</MenuItem>
              <MenuItem>Settings</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
}
