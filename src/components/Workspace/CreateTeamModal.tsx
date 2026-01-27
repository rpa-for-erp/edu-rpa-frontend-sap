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
  Textarea,
  RadioGroup,
  Radio,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { CreateTeamDto } from '@/dtos/workspaceDto';
import { TeamVisibility } from '@/interfaces/workspace';
import workspaceApi from '@/apis/workspaceApi';
import { useTranslation } from 'next-i18next';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: () => void;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  onSuccess,
}) => {
  const { t } = useTranslation('workspace');
  const toast = useToast();
  const [formData, setFormData] = useState<CreateTeamDto>({
    name: '',
    description: '',
    visibility: TeamVisibility.VISIBLE,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleVisibilityChange = (value: string) => {
    setFormData({
      ...formData,
      visibility: value as TeamVisibility,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({
        title: t('messages.error', { ns: 'common' }),
        description: t('messages.pleaseEnterTeamName'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await workspaceApi.createTeam(workspaceId, formData);
      toast({
        title: t('messages.success', { ns: 'common' }),
        description: t('messages.teamCreated'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setFormData({
        name: '',
        description: '',
        visibility: TeamVisibility.VISIBLE,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: t('messages.error', { ns: 'common' }),
        description:
          error?.response?.data?.message || t('messages.failedToCreateTeam'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('createTeamTitle')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isRequired mb={4}>
            <FormLabel>{t('teamName')}</FormLabel>
            <Input
              name="name"
              placeholder={t('enterTeamName')}
              value={formData.name}
              onChange={handleChange}
            />
            <Text fontSize="sm" color="gray.500" mt={1}>
              You'll use this name to mention this team in conversations.
            </Text>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>{t('description')}</FormLabel>
            <Textarea
              name="description"
              placeholder={t('enterDescription')}
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Team visibility</FormLabel>
            <RadioGroup
              onChange={handleVisibilityChange}
              value={formData.visibility}
            >
              <Stack>
                <Radio value={TeamVisibility.VISIBLE}>
                  <Stack spacing={0}>
                    <Text fontWeight="medium">Visible (Recommended)</Text>
                    <Text fontSize="sm" color="gray.500">
                      A visible team can be seen by every member of this
                      organization.
                    </Text>
                  </Stack>
                </Radio>
                <Radio value={TeamVisibility.SECRET}>
                  <Stack spacing={0}>
                    <Text fontWeight="medium">Secret</Text>
                    <Text fontSize="sm" color="gray.500">
                      A secret team can only be seen by its members.
                    </Text>
                  </Stack>
                </Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="teal"
            mr={3}
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {t('createTeam')}
          </Button>
          <Button onClick={onClose}>
            {t('buttons.cancel', { ns: 'common' })}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateTeamModal;
