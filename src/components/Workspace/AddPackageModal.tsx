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
  VStack,
  Checkbox,
  Text,
  useToast,
  Box,
  Avatar,
  Flex,
  Stack,
} from '@chakra-ui/react';
import activityPackageApi from '@/apis/activityPackageApi';
import workspaceApi from '@/apis/workspaceApi';
import { ActivityPackage } from '@/interfaces/activity-package';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  existingPackageIds: string[];
  onSuccess: () => void;
}

const AddPackageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  teamId,
  existingPackageIds,
  onSuccess,
}) => {
  const toast = useToast();
  const [allPackages, setAllPackages] = useState<ActivityPackage[]>([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAllPackages();
    }
  }, [isOpen]);

  const fetchAllPackages = async () => {
    setIsLoading(true);
    try {
      const data = await activityPackageApi.getAllPackages();
      // Filter out packages already in the team
      const availablePackages = data.filter(
        (pkg) => !existingPackageIds.includes(pkg.id)
      );
      setAllPackages(availablePackages);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load activity packages',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (packageId: string) => {
    if (selectedPackageIds.includes(packageId)) {
      setSelectedPackageIds(
        selectedPackageIds.filter((id) => id !== packageId)
      );
    } else {
      setSelectedPackageIds([...selectedPackageIds, packageId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedPackageIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one package',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Add packages one by one
      for (const packageId of selectedPackageIds) {
        await workspaceApi.addPackageToTeam(teamId, packageId);
      }

      toast({
        title: 'Success',
        description: `${selectedPackageIds.length} package(s) added successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setSelectedPackageIds([]);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to add packages',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedPackageIds([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Activity Package</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading ? (
            <Text>Loading packages...</Text>
          ) : allPackages.length === 0 ? (
            <Box p={4} textAlign="center">
              <Text color="gray.500">
                No available packages to add. All packages are already added to
                this team.
              </Text>
            </Box>
          ) : (
            <VStack align="stretch" spacing={3}>
              {allPackages.map((pkg) => (
                <Box
                  key={pkg.id}
                  p={3}
                  borderWidth="1px"
                  borderRadius="md"
                  cursor="pointer"
                  bg={selectedPackageIds.includes(pkg.id) ? 'teal.50' : 'white'}
                  borderColor={
                    selectedPackageIds.includes(pkg.id)
                      ? 'teal.500'
                      : 'gray.200'
                  }
                  _hover={{ borderColor: 'teal.300' }}
                  onClick={() => handleToggle(pkg.id)}
                >
                  <Flex align="center" gap={3}>
                    <Checkbox
                      isChecked={selectedPackageIds.includes(pkg.id)}
                      onChange={() => handleToggle(pkg.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Avatar size="sm" name={pkg.displayName} />
                    <Stack spacing={0} flex={1}>
                      <Text fontWeight="medium">{pkg.displayName}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {pkg.description || 'No description'}
                      </Text>
                    </Stack>
                  </Flex>
                </Box>
              ))}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={
              selectedPackageIds.length === 0 || allPackages.length === 0
            }
          >
            Add Package{selectedPackageIds.length > 1 ? 's' : ''}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddPackageModal;
