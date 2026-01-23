import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Flex,
  Icon,
  Box,
} from "@chakra-ui/react";
import { WarningIcon } from "@chakra-ui/icons";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndExit: () => void;
  onExit: () => void;
  isLoading?: boolean;
}

export default function UnsavedChangesModal({
  isOpen,
  onClose,
  onSaveAndExit,
  onExit,
  isLoading = false,
}: UnsavedChangesModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex align="center" gap={3}>
            <Box
              w={8}
              h={8}
              borderRadius="full"
              bg="red.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={WarningIcon} color="red.500" boxSize={5} />
            </Box>
            <Box fontWeight="bold" fontSize="lg" color="gray.800">
              You have unsaved changes
            </Box>
          </Flex>
        </ModalHeader>
        <ModalBody pb={6}>
          <Box color="gray.600" fontSize="sm">
            Your changes may be lost, are you sure you want to leave the editor
            page?
          </Box>
        </ModalBody>
        <ModalFooter>
          <Flex gap={3} w="full" justify="flex-end">
            <Button
              variant="outline"
              borderColor="gray.300"
              color="gray.700"
              onClick={onClose}
              isDisabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              borderColor="gray.300"
              color="gray.700"
              onClick={onExit}
              isDisabled={isLoading}
            >
              Exit
            </Button>
            <Button
              bg="red.500"
              color="white"
              _hover={{ bg: "red.600" }}
              onClick={onSaveAndExit}
              isLoading={isLoading}
              loadingText="Saving..."
            >
              Save and exit
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
