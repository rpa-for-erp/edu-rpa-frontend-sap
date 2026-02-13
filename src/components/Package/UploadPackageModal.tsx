import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  Text,
  Box,
  Icon,
} from '@chakra-ui/react';
import { FiUploadCloud } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { CreatePackageRequest } from '@/interfaces/activity-package';
import activityPackageApi from '@/apis/activityPackageApi';

interface UploadPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadPackageModal: React.FC<UploadPackageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreatePackageRequest>();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const toast = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue('file', file);
      
      // Auto-fill nam from filename if empty
      const currentName = watch('name');
      if (!currentName) {
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
        setValue('name', nameWithoutExt);
        setValue('displayName', nameWithoutExt);
      }
    }
  };

  const onSubmit = async (data: CreatePackageRequest) => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a library file (.py or .whl)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await activityPackageApi.createPackage(data);
      toast({
        title: 'Success',
        description: 'Package uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      reset();
      setSelectedFile(null);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to upload package',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Upload Activity Package</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} as="form" id="upload-form" onSubmit={handleSubmit(onSubmit)}>
            
            <FormControl isInvalid={!selectedFile}>
              <FormLabel>Library File (.py, .whl)</FormLabel>
              <Box
                borderWidth={2}
                borderStyle="dashed"
                borderRadius="md"
                p={6}
                textAlign="center"
                borderColor={selectedFile ? 'teal.500' : 'gray.300'}
                _hover={{ borderColor: 'teal.500', bg: 'gray.50' }}
                cursor="pointer"
                position="relative"
              >
                <Input
                  type="file"
                  accept=".py,.whl"
                  height="100%"
                  width="100%"
                  position="absolute"
                  top={0}
                  left={0}
                  opacity={0}
                  onChange={handleFileChange}
                  cursor="pointer"
                />
                <VStack spacing={2}>
                  <Icon as={FiUploadCloud} w={8} h={8} color="gray.500" />
                  <Text color="gray.600">
                    {selectedFile ? selectedFile.name : 'Click or Drag file to upload'}
                  </Text>
                </VStack>
              </Box>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel>Package Name (Internal)</FormLabel>
              <Input
                placeholder="e.g. rpa-erpnext"
                {...register('name', { required: 'Package name is required' })}
              />
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.displayName}>
              <FormLabel>Display Name</FormLabel>
              <Input
                placeholder="e.g. ERPNext Automation"
                {...register('displayName', { required: 'Display name is required' })}
              />
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.version}>
              <FormLabel>Version</FormLabel>
              <Input
                placeholder="e.g. 1.0.0"
                {...register('version', { 
                  required: 'Version is required',
                  pattern: {
                    value: /^\d+\.\d+\.\d+$/,
                    message: 'Format must be x.y.z'
                  }
                })}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                placeholder="Describe what this package does..."
                {...register('description')}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="teal"
            type="submit"
            form="upload-form"
            isLoading={isSubmitting}
          >
            Upload
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UploadPackageModal;
