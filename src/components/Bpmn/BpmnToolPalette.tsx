import React from 'react';
import { Box, VStack, IconButton, Divider, Tooltip } from '@chakra-ui/react';
import { FaHandPaper, FaMousePointer, FaUndo, FaRedo } from 'react-icons/fa';
import {
  MdCropSquare,
  MdCircle,
  MdChangeHistory,
  MdCallSplit,
} from 'react-icons/md';

interface BpmnToolPaletteProps {
  modelerRef?: any;
}

export default function BpmnToolPalette({ modelerRef }: BpmnToolPaletteProps) {
  const handleUndo = () => {
    if (modelerRef?.current?.bpmnModeler) {
      const commandStack = modelerRef.current.bpmnModeler.get('commandStack');
      commandStack.undo();
    }
  };

  const handleRedo = () => {
    if (modelerRef?.current?.bpmnModeler) {
      const commandStack = modelerRef.current.bpmnModeler.get('commandStack');
      commandStack.redo();
    }
  };

  return (
    <Box
      w="80px"
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      display="flex"
      flexDirection="column"
      alignItems="center"
      py={4}
    >
      <VStack spacing={2} flex={1}>
        {/* Hand Tool */}
        <Tooltip label="Hand Tool" placement="right">
          <IconButton
            aria-label="Hand Tool"
            icon={<FaHandPaper />}
            variant="ghost"
            size="md"
            _hover={{ bg: 'gray.100' }}
          />
        </Tooltip>

        {/* Lasso Tool / Selection */}
        <Tooltip label="Lasso Tool" placement="right">
          <IconButton
            aria-label="Lasso Tool"
            icon={<FaMousePointer />}
            variant="ghost"
            size="md"
            _hover={{ bg: 'gray.100' }}
          />
        </Tooltip>

        <Divider my={2} />

        {/* Create Task / Activity */}
        <Tooltip label="Create Task" placement="right">
          <IconButton
            aria-label="Create Task"
            icon={<MdCropSquare />}
            variant="ghost"
            size="md"
            _hover={{ bg: 'gray.100' }}
          />
        </Tooltip>

        {/* Create Event */}
        <Tooltip label="Create Event" placement="right">
          <IconButton
            aria-label="Create Event"
            icon={<MdCircle />}
            variant="ghost"
            size="md"
            _hover={{ bg: 'gray.100' }}
          />
        </Tooltip>

        {/* Create Gateway */}
        <Tooltip label="Create Gateway" placement="right">
          <IconButton
            aria-label="Create Gateway"
            icon={<MdChangeHistory />}
            variant="ghost"
            size="md"
            _hover={{ bg: 'gray.100' }}
          />
        </Tooltip>

        {/* Create Subprocess */}
        <Tooltip label="Create Subprocess" placement="right">
          <IconButton
            aria-label="Create Subprocess"
            icon={<MdCallSplit />}
            variant="ghost"
            size="md"
            _hover={{ bg: 'gray.100' }}
          />
        </Tooltip>
      </VStack>

      {/* Bottom Actions: Undo/Redo */}
      <VStack spacing={2} mt={4}>
        <Divider mb={2} />
        
        <Tooltip label="Undo" placement="right">
          <IconButton
            aria-label="Undo"
            icon={<FaUndo />}
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            _hover={{ bg: 'gray.100' }}
          />
        </Tooltip>

        <Tooltip label="Redo" placement="right">
          <IconButton
            aria-label="Redo"
            icon={<FaRedo />}
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            _hover={{ bg: 'gray.100' }}
          />
        </Tooltip>
      </VStack>
    </Box>
  );
}

