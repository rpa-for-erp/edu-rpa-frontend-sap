import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Code,
} from "@chakra-ui/react";

interface CreateProcessFromSubProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (processName: string) => Promise<void>;
  subProcessName: string;
  elementCount: number;
  hasNestedSubProcesses: boolean;
  isLoading?: boolean;
}

const CreateProcessFromSubProcessModal: React.FC<
  CreateProcessFromSubProcessModalProps
> = ({
  isOpen,
  onClose,
  onConfirm,
  subProcessName,
  elementCount,
  hasNestedSubProcesses,
  isLoading = false,
}) => {
  const [processName, setProcessName] = useState(subProcessName || "");

  // Reset processName when modal opens with new subProcessName
  React.useEffect(() => {
    if (isOpen) {
      setProcessName(subProcessName || "");
    }
  }, [isOpen, subProcessName]);

  const handleConfirm = async () => {
    if (!processName.trim()) return;
    await onConfirm(processName.trim());
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      closeOnOverlayClick={!isLoading}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create Process from SubProcess</ModalHeader>
        {!isLoading && <ModalCloseButton />}

        <ModalBody>
          <VStack spacing={4} align="stretch">
            {hasNestedSubProcesses && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Nested SubProcess Detected</AlertTitle>
                  <AlertDescription>
                    This subprocess contains nested subprocesses. Creating a
                    separate process will make it easier to manage.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            <FormControl isRequired>
              <FormLabel>Process Name</FormLabel>
              <Input
                placeholder="Enter process name"
                value={processName}
                onChange={(e) => setProcessName(e.target.value)}
                isDisabled={isLoading}
              />
              <FormHelperText>
                This will be the name of the new process
              </FormHelperText>
            </FormControl>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                SubProcess Information:
              </Text>
              <VStack align="stretch" spacing={1} fontSize="sm">
                <HStack>
                  <Text color="gray.600">Current Name:</Text>
                  <Code>{subProcessName}</Code>
                </HStack>
                <HStack>
                  <Text color="gray.600">Elements:</Text>
                  <Text>{elementCount}</Text>
                </HStack>
                <HStack>
                  <Text color="gray.600">Nested SubProcesses:</Text>
                  <Text>{hasNestedSubProcesses ? "Yes" : "No"}</Text>
                </HStack>
              </VStack>
            </Box>

            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box fontSize="sm">
                <AlertDescription>
                  A new process will be created with the content of this
                  subprocess. You can find it in the process list.
                </AlertDescription>
              </Box>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={handleClose}
            isDisabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleConfirm}
            isLoading={isLoading}
            loadingText="Creating..."
            isDisabled={!processName.trim() || isLoading}
          >
            Create Process
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateProcessFromSubProcessModal;
