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
  FormErrorMessage,
  useToast,
  Text,
  Box,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import moodleConnectionApi, {
  CreateMoodleConnectionDto,
} from '@/apis/moodleConnectionApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  workspaceId?: string;
}

const CreateMoodleConnectionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  workspaceId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const formik = useFormik({
    initialValues: {
      baseUrl: '',
      token: '',
      name: '',
    },
    validationSchema: Yup.object({
      baseUrl: Yup.string()
        .url('Must be a valid URL (e.g., https://moodle.example.com)')
        .matches(
          /^https?:\/\/.+/,
          'URL must start with http:// or https://'
        )
        .required('Moodle URL is required'),
      token: Yup.string()
        .min(10, 'Token must be at least 10 characters')
        .required('Web Service Token is required'),
      name: Yup.string().max(100, 'Name must be less than 100 characters'),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const payload: CreateMoodleConnectionDto = {
          baseUrl: values.baseUrl,
          token: values.token,
        };

        if (values.name.trim()) {
          payload.name = values.name;
        }

        let response;
        if (workspaceId) {
          // Workspace Moodle connection
          response = await moodleConnectionApi.createWorkspaceMoodleConnection(
            workspaceId,
            payload
          );
        } else {
          // User Moodle connection
          response = await moodleConnectionApi.createMoodleConnection(payload);
        }

        toast({
          title: 'Success!',
          description: `Moodle connection "${response.connection.name}" created successfully`,
          status: 'success',
          position: 'top-right',
          duration: 3000,
          isClosable: true,
        });

        formik.resetForm();
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          'Failed to create Moodle connection';

        toast({
          title: 'Error',
          description: errorMessage,
          status: 'error',
          position: 'top-right',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create Moodle Connection</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={formik.handleSubmit}>
          <ModalBody pb={6}>
            <Box mb={4}>
              <Text fontSize="sm" color="gray.600">
                Connect to your Moodle site using a Web Service Token. You can
                generate this token from your Moodle site's administration
                panel.
              </Text>
            </Box>

            {/* Base URL Field */}
            <FormControl
              isInvalid={formik.touched.baseUrl && !!formik.errors.baseUrl}
              mb={4}
            >
              <FormLabel htmlFor="baseUrl">
                Moodle URL <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <Input
                id="baseUrl"
                name="baseUrl"
                type="url"
                placeholder="https://moodle.example.com"
                value={formik.values.baseUrl}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.baseUrl && formik.errors.baseUrl && (
                <FormErrorMessage>{formik.errors.baseUrl}</FormErrorMessage>
              )}
            </FormControl>

            {/* Token Field */}
            <FormControl
              isInvalid={formik.touched.token && !!formik.errors.token}
              mb={4}
            >
              <FormLabel htmlFor="token">
                Web Service Token <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <Input
                id="token"
                name="token"
                type="password"
                placeholder="Enter your Moodle web service token"
                value={formik.values.token}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.token && formik.errors.token && (
                <FormErrorMessage>{formik.errors.token}</FormErrorMessage>
              )}
              <Text fontSize="xs" color="gray.500" mt={1}>
                This token will be securely stored and encrypted
              </Text>
            </FormControl>

            {/* Name Field (Optional) */}
            <FormControl
              isInvalid={formik.touched.name && !!formik.errors.name}
            >
              <FormLabel htmlFor="name">
                Connection Name <Text as="span" color="gray.500">(Optional)</Text>
              </FormLabel>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="My Moodle Site"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.name && formik.errors.name && (
                <FormErrorMessage>{formik.errors.name}</FormErrorMessage>
              )}
              <Text fontSize="xs" color="gray.500" mt={1}>
                Leave empty to auto-detect from your Moodle site
              </Text>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              type="submit"
              isLoading={isLoading}
              loadingText="Creating..."
            >
              Create Connection
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default CreateMoodleConnectionModal;
