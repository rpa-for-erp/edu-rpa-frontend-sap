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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import NavbarOnlyLayout from '@/components/Layouts/NavbarOnlyLayout';
import workspaceApi from '@/apis/workspaceApi';
import activityPackageApi from '@/apis/activityPackageApi';
import { TeamVisibility } from '@/interfaces/workspace';
import { ActivityPackage } from '@/interfaces/activity-package';
import { COLORS } from '@/constants/colors';

const CreateTeamPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const { workspaceId } = router.query as { workspaceId: string };

  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activityPackages, setActivityPackages] = useState<ActivityPackage[]>(
    []
  );

  useEffect(() => {
    fetchActivityPackages();
  }, []);

  const fetchActivityPackages = async () => {
    try {
      const data = await activityPackageApi.getAllPackages();
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

  const handlePackageToggle = (packageId: string) => {
    if (selectedPackages.includes(packageId)) {
      setSelectedPackages(selectedPackages.filter((id) => id !== packageId));
    } else {
      setSelectedPackages([...selectedPackages, packageId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      toast({
        title: 'Error',
        description: 'Team name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await workspaceApi.createTeam(workspaceId, {
        name: teamName,
        description: description || undefined,
        activityPackageIds:
          selectedPackages.length > 0 ? selectedPackages : undefined,
      });

      toast({
        title: 'Success',
        description: 'Team created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      router.push(`/workspace/${workspaceId}/teams`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to create team',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <NavbarOnlyLayout pt="0px">
      <Container maxW="container.md" py={5} justifyContent={'left'}>
        <Breadcrumb
          spacing="8px"
          separator={<ChevronRightIcon color="gray.500" />}
          mb={4}
          px={8}
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
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Create Team</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Box bg="white" borderRadius="lg" shadow="sm" p={8}>
          <Heading size="lg" mb={6} color={COLORS.primary}>
            Create new team
          </Heading>

          <form onSubmit={handleSubmit}>
            <Stack spacing={6} align="stretch">
              <FormControl isRequired>
                <FormLabel>Team name</FormLabel>
                <Input
                  placeholder="Enter team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  You'll use this name to mention this team in conversations.
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
                  What is this team all about?
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Activity Package</FormLabel>
                <VStack align="start" spacing={2}>
                  {activityPackages.map((pkg) => (
                    <Checkbox
                      key={pkg.id}
                      isChecked={selectedPackages.includes(pkg.id)}
                      onChange={() => handlePackageToggle(pkg.id)}
                    >
                      {pkg.displayName}
                    </Checkbox>
                  ))}
                </VStack>
              </FormControl>

              <Button
                type="submit"
                colorScheme="teal"
                size="lg"
                width="100%"
                isLoading={isSubmitting}
              >
                Create team
              </Button>
            </Stack>
          </form>
        </Box>
      </Container>
    </NavbarOnlyLayout>
  );
};

export default CreateTeamPage;
