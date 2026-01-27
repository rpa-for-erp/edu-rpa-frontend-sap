import React, { useState, useEffect } from 'react';
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
  Select,
} from '@chakra-ui/react';
import { InviteMemberDto } from '@/dtos/workspaceDto';
import workspaceApi from '@/apis/workspaceApi';
import { Role } from '@/interfaces/workspace';
import { useTranslation } from 'next-i18next';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  teamId: string;
  defaultRoleId?: string;
  onSuccess: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  teamId,
  defaultRoleId,
  onSuccess,
}) => {
  const { t } = useTranslation('workspace');
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && teamId) {
      fetchRoles();
    }
  }, [isOpen, teamId]);

  useEffect(() => {
    if (defaultRoleId) {
      setRoleId(defaultRoleId);
    }
  }, [defaultRoleId]);

  const fetchRoles = async () => {
    try {
      const data = await workspaceApi.getRolesByTeam(teamId);
      setRoles(data);
      if (data.length > 0 && !roleId) {
        setRoleId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleInvite = async () => {
    if (!email) {
      toast({
        title: t('messages.error', { ns: 'common' }),
        description: t('messages.pleaseEnterEmail'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!roleId) {
      toast({
        title: t('messages.error', { ns: 'common' }),
        description: t('messages.pleaseSelectRole'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload: InviteMemberDto = { email, roleId };
      await workspaceApi.inviteTeamMember(teamId, payload);
      toast({
        title: t('messages.success', { ns: 'common' }),
        description: t('messages.invitationSent'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setEmail('');
      setRoleId(defaultRoleId || '');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: t('messages.error', { ns: 'common' }),
        description:
          error?.response?.data?.message || t('messages.failedToInvite'),
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
        <ModalHeader>
          <VStack spacing={2}>
            <AvatarGroup size="lg" spacing={-3}>
              <Avatar src="https://bit.ly/sage-adebayo" />
              <Avatar src="https://bit.ly/kent-c-dodds" />
              <Avatar src="https://bit.ly/ryan-florence" />
            </AvatarGroup>
            <Text fontSize="xl" fontWeight="bold">
              {t('inviteMemberTitle')}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl mb={4}>
            <FormLabel>{t('memberEmail')}</FormLabel>
            <Input
              type="email"
              placeholder={t('enterMemberEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>{t('selectRole')}</FormLabel>
            <Select
              placeholder={t('selectRole')}
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <Button
            colorScheme="teal"
            width="full"
            onClick={handleInvite}
            isLoading={isLoading}
          >
            {t('inviteMember')}
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default InviteMemberModal;
