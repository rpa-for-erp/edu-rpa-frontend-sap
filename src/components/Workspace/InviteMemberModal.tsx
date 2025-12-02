import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  Input,
  Button,
  Avatar,
  AvatarGroup,
  VStack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { InviteMemberDto } from '@/dtos/workspaceDto';
import workspaceApi from '@/apis/workspaceApi';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  teamId: string;
  onSuccess: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  teamId,
  onSuccess,
}) => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter email address',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload: InviteMemberDto = { email };
      await workspaceApi.inviteTeamMember(workspaceId, teamId, payload);
      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setEmail('');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || 'Failed to send invitation',
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
        <ModalHeader>
          <VStack spacing={2}>
            <AvatarGroup size="lg" spacing={-3}>
              <Avatar src="https://bit.ly/sage-adebayo" />
              <Avatar src="https://bit.ly/kent-c-dodds" />
              <Avatar src="https://bit.ly/ryan-florence" />
            </AvatarGroup>
            <Text fontSize="xl" fontWeight="bold">
              Invite Your Member
            </Text>
            <Text fontSize="sm" color="gray.500" fontWeight="normal">
              Excited On Starting A New Project!
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl>
            <FormLabel>Team Email Address</FormLabel>
            <Input
              type="email"
              placeholder="Enter your team member email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>

          <Button
            colorScheme="teal"
            width="full"
            mt={6}
            onClick={handleInvite}
            isLoading={isLoading}
          >
            INVITE
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default InviteMemberModal;
