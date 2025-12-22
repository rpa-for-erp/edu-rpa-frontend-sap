import React, { useState, useEffect } from "react";
import { Box, IconButton, Text, Flex, Tooltip } from "@chakra-ui/react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import { MdFitScreen } from "react-icons/md";

interface BpmnZoomControlsProps {
  modelerRef?: any;
}

export default function BpmnZoomControls({
  modelerRef,
}: BpmnZoomControlsProps) {
  const [zoomLevel, setZoomLevel] = useState(100);

  const handleZoomIn = () => {
    try {
      if (modelerRef?.bpmnModeler) {
        const canvas = modelerRef.bpmnModeler.get("canvas");
        const currentZoom = canvas.zoom();
        const newZoom = currentZoom + 0.1;
        canvas.zoom(newZoom);
        setZoomLevel(Math.round(newZoom * 100));
      }
    } catch (error) {
      console.error("Zoom in error:", error);
    }
  };

  const handleZoomOut = () => {
    try {
      if (modelerRef?.bpmnModeler) {
        const canvas = modelerRef.bpmnModeler.get("canvas");
        const currentZoom = canvas.zoom();
        const newZoom = Math.max(0.2, currentZoom - 0.1);
        canvas.zoom(newZoom);
        setZoomLevel(Math.round(newZoom * 100));
      }
    } catch (error) {
      console.error("Zoom out error:", error);
    }
  };

  const handleFitViewport = () => {
    try {
      if (modelerRef?.bpmnModeler) {
        const canvas = modelerRef.bpmnModeler.get("canvas");
        canvas.zoom("fit-viewport");
        // Get the new zoom level after fit
        setTimeout(() => {
          const currentZoom = canvas.zoom();
          setZoomLevel(Math.round(currentZoom * 100));
        }, 100);
      }
    } catch (error) {
      console.error("Fit viewport error:", error);
    }
  };

  // Listen to zoom changes from mouse wheel or other sources
  useEffect(() => {
    if (modelerRef?.bpmnModeler) {
      const canvas = modelerRef.bpmnModeler.get("canvas");
      const eventBus = modelerRef.bpmnModeler.get("eventBus");

      const updateZoom = () => {
        try {
          const currentZoom = canvas.zoom();
          if (typeof currentZoom === "number") {
            setZoomLevel(Math.round(currentZoom * 100));
          }
        } catch (error) {
          console.error("Update zoom error:", error);
        }
      };

      eventBus.on("canvas.viewbox.changed", updateZoom);

      // Initial zoom level
      updateZoom();

      return () => {
        eventBus.off("canvas.viewbox.changed", updateZoom);
      };
    }
  }, [modelerRef]);

  return (
    <Box
      position="absolute"
      bottom={4}
      right={4}
      bg="white"
      borderRadius="md"
      boxShadow="md"
      border="1px solid"
      borderColor="gray.200"
      zIndex={10}
      px={2}
      py={2}
    >
      <Flex align="center" gap={1}>
        {/* Zoom Out */}
        <Tooltip label="Zoom Out" placement="top">
          <IconButton
            aria-label="Zoom out"
            icon={<MinusIcon />}
            size="sm"
            variant="ghost"
            onClick={handleZoomOut}
            borderRadius="md"
            _hover={{ bg: "gray.100" }}
          />
        </Tooltip>

        {/* Zoom Level Display */}
        <Text
          fontSize="xs"
          fontWeight="medium"
          px={2}
          color="gray.700"
          minW="50px"
          textAlign="center"
        >
          {zoomLevel}%
        </Text>

        {/* Zoom In */}
        <Tooltip label="Zoom In" placement="top">
          <IconButton
            aria-label="Zoom in"
            icon={<AddIcon />}
            size="sm"
            variant="ghost"
            onClick={handleZoomIn}
            borderRadius="md"
            _hover={{ bg: "gray.100" }}
          />
        </Tooltip>

        {/* Fit to Viewport */}
        <Tooltip label="Fit to Viewport" placement="top">
          <IconButton
            aria-label="Fit to viewport"
            icon={<MdFitScreen />}
            size="sm"
            variant="ghost"
            onClick={handleFitViewport}
            borderRadius="md"
            _hover={{ bg: "gray.100" }}
          />
        </Tooltip>
      </Flex>
    </Box>
  );
}
