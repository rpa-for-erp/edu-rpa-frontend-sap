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
import { Permission, PermissionCategory } from '@/interfaces/workspace';
import workspaceApi from '@/apis/workspaceApi';

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
        title: 'Error',
        description: 'Please enter role name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await workspaceApi.createRole(workspaceId, teamId, formData);
      toast({
        title: 'Success',
        description: 'Role created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setFormData({ name: '', description: '', permissionIds: [] });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to create role',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<PermissionCategory, Permission[]>);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader>Create new role</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isRequired mb={4}>
            <FormLabel>Name</FormLabel>
            <Input
              name="name"
              placeholder="Enter role name"
              value={formData.name}
              onChange={handleChange}
            />
            <Text fontSize="sm" color="gray.500" mt={1}>
              You'll use this name to mention this role in conversations.
            </Text>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Description</FormLabel>
            <Textarea
              name="description"
              placeholder="What is this role all about?"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Select template</FormLabel>
            <CheckboxGroup
              value={formData.permissionIds}
              onChange={handlePermissionChange}
            >
              <Stack spacing={4}>
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <Stack key={category} spacing={2}>
                    <Text fontWeight="bold" color="teal.500">
                      {category}
                    </Text>
                    {perms.map((permission) => (
                      <Checkbox key={permission.id} value={permission.id}>
                        <Stack spacing={0}>
                          <Text fontWeight="medium">{permission.name}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {permission.description}
                          </Text>
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
            Create Role
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateRoleModal;
