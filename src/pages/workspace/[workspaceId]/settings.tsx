import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  FormControl,
  FormLabel,
  Textarea,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Avatar,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import WorkspaceLayout from '@/components/Layouts/WorkspaceLayout';
import { Workspace } from '@/interfaces/workspace';
import workspaceApi from '@/apis/workspaceApi';
import { COLORS } from '@/constants/colors';
import { userSelector } from '@/redux/selector';
import { useSelector } from 'react-redux';

const WorkspaceSettingsPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const user = useSelector(userSelector);
  const { workspaceId } = router.query as { workspaceId: string };
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace();
    }
  }, [workspaceId]);

  const fetchWorkspace = async () => {
    try {
      const data = await workspaceApi.getWorkspaceById(workspaceId);
      setWorkspace(data);
      setName(data.name);
      setDescription(data.description || '');
    } catch (error) {
      console.error('Failed to fetch workspace:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch workspace details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Workspace name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await workspaceApi.updateWorkspace(workspaceId, {
        name: name.trim(),
        description: description.trim(),
      });
      toast({
        title: 'Success',
        description: 'Workspace updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchWorkspace();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || 'Failed to update workspace',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await workspaceApi.deleteWorkspace(workspaceId);
      toast({
        title: 'Success',
        description: 'Workspace deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/workspace');
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || 'Failed to delete workspace',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const isOwner = workspace && workspace.ownerId === user.id;

  if (!workspace) {
    return (
      <WorkspaceLayout>
        <Container maxW="container.xl" py={5}>
          <Text>Loading...</Text>
        </Container>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <Container maxW="container.xl" py={5}>
        <Breadcrumb
          spacing="8px"
          separator={<ChevronRightIcon color="gray.500" />}
          mb={4}
        >
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => router.push('/workspace')}>
              Workspaces
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => router.push(`/workspace/${workspaceId}`)}
            >
              {workspace.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Settings</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg" color={COLORS.primary}>
            Workspace Settings
          </Heading>
        </Flex>

        <Stack spacing={6}>
          {/* General Information */}
          <Box bg="white" borderRadius="lg" shadow="sm" p={6}>
            <Heading size="md" mb={4}>
              General Information
            </Heading>
            <form onSubmit={handleUpdate}>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Workspace Name</FormLabel>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter workspace name"
                    isDisabled={!isOwner}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter workspace description"
                    rows={4}
                    isDisabled={!isOwner}
                  />
                </FormControl>

                {isOwner && (
                  <Flex justify="flex-end">
                    <Button
                      type="submit"
                      colorScheme="teal"
                      isLoading={isSubmitting}
                    >
                      Save Changes
                    </Button>
                  </Flex>
                )}
              </Stack>
            </form>
          </Box>

          {/* Workspace Owner */}
          <Box bg="white" borderRadius="lg" shadow="sm" p={6}>
            <Heading size="md" mb={4}>
              Workspace Owner
            </Heading>
            <Flex align="center" gap={3}>
              <Avatar
                size="sm"
                name={workspace.owner?.name}
                src={workspace.owner?.avatarUrl || undefined}
              />
              <Stack spacing={0}>
                <Text fontWeight="medium">{workspace.owner?.name}</Text>
                <Text fontSize="sm" color="gray.500">
                  {workspace.owner?.email}
                </Text>
              </Stack>
            </Flex>
          </Box>

          {/* Danger Zone */}
          {isOwner && (
            <Box
              bg="white"
              borderRadius="lg"
              shadow="sm"
              p={6}
              borderColor="red.200"
              borderWidth="1px"
            >
              <Heading size="md" mb={2} color="red.600">
                Danger Zone
              </Heading>
              <Text fontSize="sm" color="gray.600" mb={4}>
                Once you delete a workspace, there is no going back. Please be
                certain.
              </Text>
              <Button colorScheme="red" onClick={onDeleteOpen}>
                Delete Workspace
              </Button>
            </Box>
          )}
        </Stack>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Workspace</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete <strong>{workspace.name}</strong>?
              This action cannot be undone and will permanently delete all data
              associated with this workspace.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDelete}>
              Delete Permanently
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </WorkspaceLayout>
  );
};

export default WorkspaceSettingsPage;
