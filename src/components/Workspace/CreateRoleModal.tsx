import React, { useState, useEffect } from 'react';
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
  Checkbox,
  CheckboxGroup,
  Stack,
  Text,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { CreateRoleDto } from '@/dtos/workspaceDto';
import { Permission } from '@/interfaces/workspace';
import workspaceApi from '@/apis/workspaceApi';
import { useTranslation } from 'next-i18next';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  teamId: string;
  onSuccess: () => void;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  teamId,
  onSuccess,
}) => {
  const { t } = useTranslation('workspace');
  const toast = useToast();
  const [formData, setFormData] = useState<CreateRoleDto>({
    name: '',
    description: '',
    permissionIds: [],
  });
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
    }
  }, [isOpen]);

  const fetchPermissions = async () => {
    try {
      const data = await workspaceApi.getAllPermissions();
      setPermissions(data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePermissionChange = (permissionIds: string[]) => {
    setFormData({
      ...formData,
      permissionIds,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({
        title: t('messages.error', { ns: 'common' }),
        description: t('messages.pleaseEnterRoleName'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await workspaceApi.createRole(teamId, formData);
      toast({
        title: t('messages.success', { ns: 'common' }),
        description: t('messages.roleCreated'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setFormData({ name: '', description: '', permissionIds: [] });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: t('messages.error', { ns: 'common' }),
        description:
          error?.response?.data?.message || t('messages.failedToCreateRole'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader>{t('createRoleTitle')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isRequired mb={4}>
            <FormLabel>{t('roleName')}</FormLabel>
            <Input
              name="name"
              placeholder={t('enterRoleName')}
              value={formData.name}
              onChange={handleChange}
            />
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
            <FormLabel>{t('permissions')}</FormLabel>
            <CheckboxGroup
              value={formData.permissionIds}
              onChange={handlePermissionChange}
            >
              <Stack spacing={4}>
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <Stack key={resource} spacing={2}>
                    <Text fontWeight="bold" color="teal.500">
                      {resource.charAt(0).toUpperCase() + resource.slice(1)}
                    </Text>
                    {perms.map((permission) => (
                      <Checkbox key={permission.id} value={permission.id}>
                        <Stack spacing={0}>
                          <Text fontWeight="medium">
                            {permission.name} ({permission.action})
                          </Text>
                          {permission.description && (
                            <Text fontSize="sm" color="gray.500">
                              {permission.description}
                            </Text>
                          )}
                        </Stack>
                      </Checkbox>
                    ))}
                    <Divider />
                  </Stack>
                ))}
              </Stack>
            </CheckboxGroup>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="teal"
            mr={3}
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {t('createRole')}
          </Button>
          <Button onClick={onClose}>
            {t('buttons.cancel', { ns: 'common' })}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateRoleModal;
