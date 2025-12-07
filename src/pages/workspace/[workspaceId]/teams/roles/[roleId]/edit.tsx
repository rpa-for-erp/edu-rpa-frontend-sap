import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Textarea,
  Checkbox,
  VStack,
  useToast,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import NavbarOnlyLayout from '@/components/Layouts/NavbarOnlyLayout';
import workspaceApi from '@/apis/workspaceApi';
import activityPackageApi from '@/apis/activityPackageApi';
import {
  ActivityPackage,
  ActivityTemplate,
} from '@/interfaces/activity-package';
import { Permission, Role } from '@/interfaces/workspace';
import { COLORS } from '@/constants/colors';

const EditRolePage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const { workspaceId, teamId, roleId } = router.query as {
    workspaceId: string;
    teamId: string;
    roleId: string;
  };

  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [activityPackages, setActivityPackages] = useState<ActivityPackage[]>(
    []
  );
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<{
    [packageId: string]: string[];
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (teamId && roleId) {
      fetchRoleData();
      fetchActivityPackages();
      fetchPermissions();
    }
  }, [teamId, roleId]);

  const fetchRoleData = async () => {
    try {
      const roles = await workspaceApi.getRolesByTeam(teamId);
      const role = roles.find((r) => r.id === roleId);
      if (role) {
        setRoleName(role.name);
        setDescription(role.description || '');

        // Extract permission IDs and template IDs from role.permissions
        const permissionIds: string[] = [];
        const templateIdsByPackage: { [packageId: string]: string[] } = {};

        role.permissions.forEach((permission) => {
          // If permission has a packageId, it's a template
          if ((permission as any).packageId) {
            const packageId = (permission as any).packageId;
            if (!templateIdsByPackage[packageId]) {
              templateIdsByPackage[packageId] = [];
            }
            templateIdsByPackage[packageId].push(permission.id);
          } else {
            // Otherwise it's a general permission
            permissionIds.push(permission.id);
          }
        });

        setSelectedPermissions(permissionIds);
        setSelectedTemplates(templateIdsByPackage);
      }
    } catch (error) {
      console.error('Failed to fetch role:', error);
      toast({
        title: 'Error',
        description: 'Failed to load role data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const data = await workspaceApi.getAllPermissions();
      setPermissions(data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load permissions',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchActivityPackages = async () => {
    try {
      const data = await activityPackageApi.getPackagesByTeam(teamId);
      setActivityPackages(data);
    } catch (error) {
      console.error('Failed to fetch activity packages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load activity packages',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const resource = permission.resource || 'General';
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handlePermissionToggle = (permissionId: string) => {
    if (selectedPermissions.includes(permissionId)) {
      setSelectedPermissions(
        selectedPermissions.filter((id) => id !== permissionId)
      );
    } else {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    }
  };

  const handleResourceToggle = (resource: string) => {
    const resourcePermissions = groupedPermissions[resource] || [];
    const resourcePermissionIds = resourcePermissions.map((p) => p.id);
    const allSelected = resourcePermissionIds.every((id) =>
      selectedPermissions.includes(id)
    );

    if (allSelected) {
      // Unselect all
      setSelectedPermissions(
        selectedPermissions.filter((id) => !resourcePermissionIds.includes(id))
      );
    } else {
      // Select all
      const newPermissions = [
        ...selectedPermissions,
        ...resourcePermissionIds.filter(
          (id) => !selectedPermissions.includes(id)
        ),
      ];
      setSelectedPermissions(newPermissions);
    }
  };

  const isResourceChecked = (resource: string) => {
    const resourcePermissions = groupedPermissions[resource] || [];
    if (resourcePermissions.length === 0) return false;
    return resourcePermissions.every((p) => selectedPermissions.includes(p.id));
  };

  const isResourceIndeterminate = (resource: string) => {
    const resourcePermissions = groupedPermissions[resource] || [];
    const selectedCount = resourcePermissions.filter((p) =>
      selectedPermissions.includes(p.id)
    ).length;
    return selectedCount > 0 && selectedCount < resourcePermissions.length;
  };

  const handlePackageToggle = (packageId: string) => {
    const pkg = activityPackages.find((p) => p.id === packageId);
    if (!pkg) return;

    const allTemplateIds = pkg.activityTemplates.map((t) => t.id);
    const currentSelected = selectedTemplates[packageId] || [];

    if (currentSelected.length === allTemplateIds.length) {
      // Unselect all
      const newTemplates = { ...selectedTemplates };
      delete newTemplates[packageId];
      setSelectedTemplates(newTemplates);
    } else {
      // Select all
      setSelectedTemplates({
        ...selectedTemplates,
        [packageId]: allTemplateIds,
      });
    }
  };

  const handleTemplateToggle = (packageId: string, templateId: string) => {
    const currentSelected = selectedTemplates[packageId] || [];
    if (currentSelected.includes(templateId)) {
      const newSelected = currentSelected.filter((id) => id !== templateId);
      if (newSelected.length === 0) {
        const newTemplates = { ...selectedTemplates };
        delete newTemplates[packageId];
        setSelectedTemplates(newTemplates);
      } else {
        setSelectedTemplates({
          ...selectedTemplates,
          [packageId]: newSelected,
        });
      }
    } else {
      setSelectedTemplates({
        ...selectedTemplates,
        [packageId]: [...currentSelected, templateId],
      });
    }
  };

  const isPackageChecked = (packageId: string) => {
    const pkg = activityPackages.find((p) => p.id === packageId);
    if (!pkg) return false;
    const allTemplateIds = pkg.activityTemplates.map((t) => t.id);
    const currentSelected = selectedTemplates[packageId] || [];
    return (
      currentSelected.length === allTemplateIds.length &&
      allTemplateIds.length > 0
    );
  };

  const isPackageIndeterminate = (packageId: string) => {
    const pkg = activityPackages.find((p) => p.id === packageId);
    if (!pkg) return false;
    const allTemplateIds = pkg.activityTemplates.map((t) => t.id);
    const currentSelected = selectedTemplates[packageId] || [];
    return (
      currentSelected.length > 0 &&
      currentSelected.length < allTemplateIds.length
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleName.trim()) {
      toast({
        title: 'Error',
        description: 'Role name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Collect template IDs
    const templateIds: string[] = [];
    Object.values(selectedTemplates).forEach((templates) => {
      templateIds.push(...templates);
    });

    if (selectedPermissions.length === 0 && templateIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one permission or template',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await workspaceApi.updateRole(teamId, roleId, {
        name: roleName,
        description: description || undefined,
        permissionIds: selectedPermissions,
        templateIds: templateIds.length > 0 ? templateIds : undefined,
      });

      toast({
        title: 'Success',
        description: 'Role updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      router.push(`/workspace/${workspaceId}/teams/${teamId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to update role',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <NavbarOnlyLayout>
        <Center h="400px">
          <Spinner size="xl" color="teal.500" />
        </Center>
      </NavbarOnlyLayout>
    );
  }

  return (
    <NavbarOnlyLayout>
      <Container maxW="container.md" py={8}>
        <Breadcrumb
          spacing="8px"
          separator={<ChevronRightIcon color="gray.500" />}
          mb={6}
        >
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => router.push('/workspace')}>
              Workspaces
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => router.push(`/workspace/${workspaceId}/teams`)}
            >
              Teams
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() =>
                router.push(`/workspace/${workspaceId}/teams/${teamId}`)
              }
            >
              Team Detail
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Edit Role</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Box bg="white" borderRadius="lg" shadow="sm" p={8}>
          <Heading size="lg" mb={6} color={COLORS.primary}>
            Edit role
          </Heading>

          <form onSubmit={handleSubmit}>
            <Stack spacing={6}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  placeholder="Enter role name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  You'll use this name to mention this role in conversations.
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  What is this role all about?
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Select Permission</FormLabel>
                <Accordion allowMultiple>
                  {Object.keys(groupedPermissions).map((resource) => (
                    <AccordionItem
                      key={resource}
                      border="1px"
                      borderColor="gray.200"
                      mb={2}
                      borderRadius="md"
                    >
                      <h2>
                        <AccordionButton>
                          <Flex flex="1" align="center" gap={3}>
                            <Checkbox
                              isChecked={isResourceChecked(resource)}
                              isIndeterminate={isResourceIndeterminate(
                                resource
                              )}
                              onChange={() => handleResourceToggle(resource)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Box flex="1" textAlign="left">
                              <Text fontWeight="medium">{resource}</Text>
                              <Text fontSize="sm" color="gray.500">
                                All {resource.toLowerCase()} permissions
                              </Text>
                            </Box>
                          </Flex>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4} bg="gray.50">
                        <VStack align="start" spacing={2} pl={8}>
                          {groupedPermissions[resource].map((permission) => (
                            <Checkbox
                              key={permission.id}
                              isChecked={selectedPermissions.includes(
                                permission.id
                              )}
                              onChange={() =>
                                handlePermissionToggle(permission.id)
                              }
                            >
                              <Box>
                                <Text fontWeight="medium">
                                  {permission.name}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  {permission.description || permission.action}
                                </Text>
                              </Box>
                            </Checkbox>
                          ))}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </FormControl>

              <FormControl>
                <FormLabel>Select Template</FormLabel>
                <Accordion allowMultiple>
                  {activityPackages.map((pkg) => (
                    <AccordionItem
                      key={pkg.id}
                      border="1px"
                      borderColor="gray.200"
                      mb={2}
                      borderRadius="md"
                    >
                      <h2>
                        <AccordionButton>
                          <Flex flex="1" align="center" gap={3}>
                            <Checkbox
                              isChecked={isPackageChecked(pkg.id)}
                              isIndeterminate={isPackageIndeterminate(pkg.id)}
                              onChange={() => handlePackageToggle(pkg.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Box flex="1" textAlign="left">
                              <Text fontWeight="medium">{pkg.displayName}</Text>
                              <Text fontSize="sm" color="gray.500">
                                {pkg.description ||
                                  'All activities in this package'}
                              </Text>
                            </Box>
                          </Flex>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4} bg="gray.50">
                        <VStack align="start" spacing={2} pl={8}>
                          {pkg.activityTemplates.map((template) => (
                            <Checkbox
                              key={template.id}
                              isChecked={(
                                selectedTemplates[pkg.id] || []
                              ).includes(template.id)}
                              onChange={() =>
                                handleTemplateToggle(pkg.id, template.id)
                              }
                            >
                              <Box>
                                <Text fontWeight="medium">{template.name}</Text>
                                <Text fontSize="sm" color="gray.500">
                                  {template.description || 'Activity template'}
                                </Text>
                              </Box>
                            </Checkbox>
                          ))}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </FormControl>

              <Flex gap={3}>
                <Button
                  variant="outline"
                  colorScheme="gray"
                  size="lg"
                  flex={1}
                  onClick={() =>
                    router.push(`/workspace/${workspaceId}/teams/${teamId}`)
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="teal"
                  size="lg"
                  flex={1}
                  isLoading={isSubmitting}
                >
                  Update Role
                </Button>
              </Flex>
            </Stack>
          </form>
        </Box>
      </Container>
    </NavbarOnlyLayout>
  );
};

export default EditRolePage;
