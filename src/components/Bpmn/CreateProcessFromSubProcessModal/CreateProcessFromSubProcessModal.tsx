import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';

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
  const { t } = useTranslation('studio');
  const [processName, setProcessName] = useState(subProcessName || '');

  // Reset processName when modal opens with new subProcessName
  React.useEffect(() => {
    if (isOpen) {
      setProcessName(subProcessName || '');
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
        <ModalHeader>{t('createProcessModal.title')}</ModalHeader>
        {!isLoading && <ModalCloseButton />}

        <ModalBody>
          <VStack spacing={4} align="stretch">
            {hasNestedSubProcesses && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>
                    {t('createProcessModal.nestedDetected')}
                  </AlertTitle>
                  <AlertDescription>
                    {t('createProcessModal.nestedDetectedDesc')}
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            <FormControl isRequired>
              <FormLabel>{t('createProcessModal.processName')}</FormLabel>
              <Input
                placeholder={t('createProcessModal.enterProcessName')}
                value={processName}
                onChange={(e) => setProcessName(e.target.value)}
                isDisabled={isLoading}
              />
              <FormHelperText>
                {t('createProcessModal.helperText')}
              </FormHelperText>
            </FormControl>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                {t('createProcessModal.subprocessInfo')}
              </Text>
              <VStack align="stretch" spacing={1} fontSize="sm">
                <HStack>
                  <Text color="gray.600">{t('subprocess.currentName')}:</Text>
                  <Code>{subProcessName}</Code>
                </HStack>
                <HStack>
                  <Text color="gray.600">{t('subprocess.elements')}:</Text>
                  <Text>{elementCount}</Text>
                </HStack>
                <HStack>
                  <Text color="gray.600">
                    {t('subprocess.nestedSubProcesses')}:
                  </Text>
                  <Text>
                    {hasNestedSubProcesses
                      ? t('subprocess.yes')
                      : t('subprocess.no')}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box fontSize="sm">
                <AlertDescription>
                  {t('createProcessModal.warningMessage')}
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
            {t('buttons.cancel')}
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleConfirm}
            isLoading={isLoading}
            loadingText={t('buttons.create') + '...'}
            isDisabled={!processName.trim() || isLoading}
          >
            {t('buttons.create')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateProcessFromSubProcessModal;
