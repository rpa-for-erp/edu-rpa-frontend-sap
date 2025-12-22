import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Text,
  Link,
  VStack,
  HStack,
  Box,
} from '@chakra-ui/react';

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateVersion: (data: { tag: string; description: string }) => void;
  lastVersionTag?: string;
  isLoading?: boolean;
}

const MAX_DESCRIPTION_LENGTH = 255;

export default function CreateVersionModal({
  isOpen,
  onClose,
  onCreateVersion,
  lastVersionTag = 'Autosaved',
  isLoading = false,
}: CreateVersionModalProps) {
  const [versionTag, setVersionTag] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    onCreateVersion({
      tag: versionTag || lastVersionTag,
      description,
    });
  };

  const handleClose = () => {
    setVersionTag('');
    setDescription('');
    onClose();
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(value);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.400" />
      <ModalContent borderRadius="md" maxW="600px">
        <ModalHeader pb={2}>
          <Text fontSize="xl" fontWeight="semibold" color="gray.800">
            Create new version
          </Text>
        </ModalHeader>

        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Description */}
            <Text fontSize="sm" color="gray.600">
              Use versioning to track and review changes across all resources in the process application.
            </Text>
            <Link
              href="#"
              color="blue.500"
              fontSize="sm"
              fontWeight="medium"
              _hover={{ textDecoration: 'underline' }}
            >
              Learn more
            </Link>

            {/* Version Tag Input */}
            <FormControl>
              <FormLabel fontSize="sm" color="gray.700" mb={1}>
                Version tag
              </FormLabel>
              <Input
                placeholder={lastVersionTag}
                value={versionTag}
                onChange={(e) => setVersionTag(e.target.value)}
                size="md"
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                _placeholder={{ color: 'gray.400' }}
                _focus={{
                  borderColor: 'blue.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                }}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                The placeholder shows the name of the last saved version for reference.
              </Text>
            </FormControl>

            {/* Version Description */}
            <FormControl>
              <HStack justify="space-between" mb={1}>
                <FormLabel fontSize="sm" color="gray.700" mb={0}>
                  Version description
                </FormLabel>
                <Text fontSize="xs" color="gray.500">
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </Text>
              </HStack>
              <Textarea
                placeholder="What changed from the previous version?"
                value={description}
                onChange={handleDescriptionChange}
                size="md"
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                _placeholder={{ color: 'gray.400' }}
                _focus={{
                  borderColor: 'blue.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                }}
                rows={4}
                resize="none"
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter pt={6} pb={4}>
          <HStack spacing={0} w="100%">
            <Button
              flex={1}
              variant="solid"
              bg="gray.800"
              color="white"
              _hover={{ bg: 'gray.700' }}
              onClick={handleClose}
              borderRadius="md"
              borderRightRadius={0}
              size="lg"
              fontWeight="medium"
            >
              Cancel
            </Button>
            <Button
              flex={1}
              variant="solid"
              bg="teal.500"
              color="white"
              _hover={{ bg: 'teal.600' }}
              onClick={handleCreate}
              isLoading={isLoading}
              borderRadius="md"
              borderLeftRadius={0}
              size="lg"
              fontWeight="medium"
            >
              Create
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

