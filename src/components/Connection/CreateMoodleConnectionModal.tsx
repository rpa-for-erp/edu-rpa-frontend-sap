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
import { useTranslation } from 'next-i18next';

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
  const { t } = useTranslation('integration-service');
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
        .url(t('modal.moodle.validation.urlInvalid'))
        .matches(/^https?:\/\/.+/, t('modal.moodle.validation.urlProtocol'))
        .required(t('modal.moodle.validation.urlRequired')),
      token: Yup.string()
        .min(10, t('modal.moodle.validation.tokenMin'))
        .required(t('modal.moodle.validation.tokenRequired')),
      name: Yup.string().max(100, t('modal.moodle.validation.nameMax')),
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
          title: t('modal.moodle.success'),
          description: t('modal.moodle.successDescription', {
            name: response.connection.name,
          }),
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
          t('modal.moodle.errorDefault');

        toast({
          title: t('modal.moodle.error'),
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
        <ModalHeader>{t('modal.moodle.title')}</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={formik.handleSubmit}>
          <ModalBody pb={6}>
            <Box mb={4}>
              <Text fontSize="sm" color="gray.600">
                {t('modal.moodle.description')}
              </Text>
            </Box>

            {/* Base URL Field */}
            <FormControl
              isInvalid={formik.touched.baseUrl && !!formik.errors.baseUrl}
              mb={4}
            >
              <FormLabel htmlFor="baseUrl">
                {t('modal.moodle.baseUrl')}{' '}
                <Text as="span" color="red.500">
                  {t('modal.moodle.required')}
                </Text>
              </FormLabel>
              <Input
                id="baseUrl"
                name="baseUrl"
                type="url"
                placeholder={t('modal.moodle.baseUrlPlaceholder')}
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
                {t('modal.moodle.token')}{' '}
                <Text as="span" color="red.500">
                  {t('modal.moodle.required')}
                </Text>
              </FormLabel>
              <Input
                id="token"
                name="token"
                type="password"
                placeholder={t('modal.moodle.tokenPlaceholder')}
                value={formik.values.token}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.token && formik.errors.token && (
                <FormErrorMessage>{formik.errors.token}</FormErrorMessage>
              )}
              <Text fontSize="xs" color="gray.500" mt={1}>
                {t('modal.moodle.tokenHelp')}
              </Text>
            </FormControl>

            {/* Name Field (Optional) */}
            <FormControl
              isInvalid={formik.touched.name && !!formik.errors.name}
            >
              <FormLabel htmlFor="name">
                {t('modal.moodle.name')}{' '}
                <Text as="span" color="gray.500">
                  {t('modal.moodle.nameOptional')}
                </Text>
              </FormLabel>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={t('modal.moodle.namePlaceholder')}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.name && formik.errors.name && (
                <FormErrorMessage>{formik.errors.name}</FormErrorMessage>
              )}
              <Text fontSize="xs" color="gray.500" mt={1}>
                {t('modal.moodle.nameHelp')}
              </Text>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose}>
              {t('modal.cancel')}
            </Button>
            <Button
              colorScheme="teal"
              type="submit"
              isLoading={isLoading}
              loadingText={t('modal.moodle.creating')}
            >
              {t('modal.moodle.createConnection')}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default CreateMoodleConnectionModal;
