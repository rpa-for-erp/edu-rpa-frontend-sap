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
        title: 'Error',
        description: 'Please enter team name',
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
        title: 'Success',
        description: 'Team created successfully',
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
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to create team',
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
        <ModalHeader>Create new team</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isRequired mb={4}>
            <FormLabel>Team name</FormLabel>
            <Input
              name="name"
              placeholder="Enter team name"
              value={formData.name}
              onChange={handleChange}
            />
            <Text fontSize="sm" color="gray.500" mt={1}>
              You'll use this name to mention this team in conversations.
            </Text>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Description</FormLabel>
            <Textarea
              name="description"
              placeholder="What is this team all about?"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
            <Text fontSize="sm" color="gray.500" mt={1}>
              What is this team all about?
            </Text>
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
            Create team
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateTeamModal;
