import { EditDocumentTemplateDto } from '@/dtos/documentTemplateDto';
import { DocumentTemplate } from '@/interfaces/document-template';
import { DocumentTemplateType } from '@/interfaces/enums/document-template-type';
import { useTranslation } from 'next-i18next';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  Select,
  ModalFooter,
  Button,
  Input,
} from '@chakra-ui/react';
import { use, useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documentTemplate?: DocumentTemplate;
  handleEditDocumentTemplate: (
    editDocumentTemplateDto: EditDocumentTemplateDto
  ) => void;
}

const EditDocumentTemplateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  documentTemplate,
  handleEditDocumentTemplate,
}) => {
  const { t } = useTranslation('document-template');
  const [editDocumentTemplate, setEditDocumentTemplate] =
    useState<EditDocumentTemplateDto>({
      name: '',
      description: '',
    });

  useEffect(() => {
    if (documentTemplate) {
      setEditDocumentTemplate({
        name: documentTemplate.name,
        description: documentTemplate.description,
      });
    }
  }, [documentTemplate]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('modals.edit.title')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl>
            <FormLabel>{t('modals.edit.nameLabel')}</FormLabel>
            <Input
              placeholder={t('modals.edit.namePlaceholder')}
              value={editDocumentTemplate.name}
              onChange={(e) =>
                setEditDocumentTemplate({
                  ...editDocumentTemplate,
                  name: e.target.value,
                })
              }
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('modals.edit.descriptionLabel')}</FormLabel>
            <Input
              placeholder={t('modals.edit.descriptionPlaceholder')}
              value={editDocumentTemplate.description}
              onChange={(e) =>
                setEditDocumentTemplate({
                  ...editDocumentTemplate,
                  description: e.target.value,
                })
              }
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('modals.edit.typeLabel')}</FormLabel>
            <Select
              value={documentTemplate?.type || DocumentTemplateType.IMAGE}
              disabled
            >
              <option value={DocumentTemplateType.IMAGE}>
                {t('modals.edit.typeImage')}
              </option>
            </Select>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={() => handleEditDocumentTemplate(editDocumentTemplate)}
          >
            {t('buttons.save')}
          </Button>
          <Button onClick={onClose}>{t('buttons.cancel')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditDocumentTemplateModal;
