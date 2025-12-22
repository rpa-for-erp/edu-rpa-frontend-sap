import React from "react";
import { Box, IconButton, Tooltip } from "@chakra-ui/react";
import { RiRobot2Fill } from "react-icons/ri";

interface AIChatbotButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export default function AIChatbotButton({
  onClick,
  isOpen,
}: AIChatbotButtonProps) {
  return (
    <Box
      position="absolute"
      bottom={4}
      right="220px" // Position next to zoom controls (zoom controls at right: 4)
      bg="white"
      borderRadius="full"
      boxShadow="md"
      border="1px solid"
      borderColor="gray.200"
      zIndex={10}
    >
      <Tooltip label="AI Chatbot - Generate BPMN" placement="top">
        <IconButton
          aria-label="AI Chatbot"
          icon={<RiRobot2Fill size={24} />}
          colorScheme="teal"
          size="lg"
          borderRadius="full"
          onClick={onClick}
          isActive={isOpen}
          _hover={{
            transform: "scale(1.05)",
            bg: "teal.500",
            color: "white",
          }}
          _active={{
            transform: "scale(0.95)",
          }}
          transition="all 0.2s"
          bg={isOpen ? "teal.500" : "white"}
          color={isOpen ? "white" : "teal.500"}
          width="56px"
          height="56px"
        />
      </Tooltip>
    </Box>
  );
}
