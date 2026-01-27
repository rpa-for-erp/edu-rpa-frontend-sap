import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  useToast,
} from '@chakra-ui/react';
import { CreateWorkspaceDto } from '@/dtos/workspaceDto';
import workspaceApi from '@/apis/workspaceApi';
import { useTranslation } from 'next-i18next';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation('workspace');
  const toast = useToast();
  const [formData, setFormData] = useState<CreateWorkspaceDto>({
    name: '',
    contactEmail: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.contactEmail) {
      toast({
        title: t('messages.error', { ns: 'common' }),
        description: t('messages.pleaseFillRequired'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await workspaceApi.createWorkspace(formData);
      toast({
        title: t('messages.success', { ns: 'common' }),
        description: t('messages.workspaceCreated'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setFormData({ name: '', contactEmail: '' });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: t('messages.error', { ns: 'common' }),
        description:
          error?.response?.data?.message ||
          t('messages.failedToCreateWorkspace'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('createYourWorkspace')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isRequired mb={4}>
            <FormLabel>{t('workspaceName')}</FormLabel>
            <Input
              name="name"
              placeholder={t('enterWorkspaceName')}
              value={formData.name}
              onChange={handleChange}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>{t('contactEmail')}</FormLabel>
            <Input
              name="contactEmail"
              type="email"
              placeholder={t('enterContactEmail')}
              value={formData.contactEmail}
              onChange={handleChange}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="teal"
            mr={3}
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {t('buttons.create', { ns: 'common' })}
          </Button>
          <Button onClick={onClose}>
            {t('buttons.cancel', { ns: 'common' })}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateWorkspaceModal;
