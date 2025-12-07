import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import { CreateWorkspaceDto } from '@/dtos/workspaceDto';
import workspaceApi from '@/apis/workspaceApi';

const CreateWorkspacePage: React.FC = () => {
  const router = useRouter();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.contactEmail) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
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
        title: 'Success',
        description: 'Workspace created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/workspace');
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || 'Failed to create workspace',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarContent>
      <Container maxW="container.md" py={8}>
        <Box
          bg="white"
          borderRadius="lg"
          shadow="md"
          p={8}
          border="1px"
          borderColor="gray.200"
        >
          <VStack spacing={6} align="stretch">
            <Box textAlign="center" mb={4}>
              <Heading size="lg" mb={2}>
                Create your workspace
              </Heading>
              <Text color="gray.500" fontSize="sm">
                Workspace - Place for team work
              </Text>
            </Box>

            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel>Workspace name</FormLabel>
                  <Input
                    name="name"
                    placeholder="Enter workspace name"
                    value={formData.name}
                    onChange={handleChange}
                    size="md"
                    borderRadius="5px"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Contact email</FormLabel>
                  <Input
                    name="contactEmail"
                    type="email"
                    placeholder="Enter contact email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    size="md"
                    borderRadius="5px"
                  />
                </FormControl>

                <Flex gap={4} width="100%" mt={4}>
                  <Button
                    variant="outline"
                    size="lg"
                    flex={1}
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="teal"
                    size="lg"
                    flex={1}
                    isLoading={isLoading}
                  >
                    Create
                  </Button>
                </Flex>
              </VStack>
            </form>
          </VStack>
        </Box>
      </Container>
    </SidebarContent>
  );
};

export default CreateWorkspacePage;
