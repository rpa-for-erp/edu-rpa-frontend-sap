import { CreateDocumentTemplateDto } from '@/dtos/documentTemplateDto';
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
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  handleCreateNewDocumentTemplate: (
    createDocumentTemplateDto: CreateDocumentTemplateDto
  ) => void;
}

const CreateDocumentTemplateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  handleCreateNewDocumentTemplate,
}) => {
  const { t } = useTranslation('document-template');
  const [createDocumentTemplate, setCreateDocumentTemplate] =
    useState<CreateDocumentTemplateDto>({
      name: '',
      description: '',
      type: DocumentTemplateType.IMAGE,
    });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('modals.create.title')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl>
            <FormLabel>{t('modals.create.nameLabel')}</FormLabel>
            <Input
              placeholder={t('modals.create.namePlaceholder')}
              value={createDocumentTemplate.name}
              onChange={(e) =>
                setCreateDocumentTemplate({
                  ...createDocumentTemplate,
                  name: e.target.value,
                })
              }
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('modals.create.descriptionLabel')}</FormLabel>
            <Input
              placeholder={t('modals.create.descriptionPlaceholder')}
              value={createDocumentTemplate.description}
              onChange={(e) =>
                setCreateDocumentTemplate({
                  ...createDocumentTemplate,
                  description: e.target.value,
                })
              }
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('modals.create.typeLabel')}</FormLabel>
            <Select
              value={createDocumentTemplate.type}
              onChange={(e) =>
                setCreateDocumentTemplate({
                  ...createDocumentTemplate,
                  type: e.target.value as DocumentTemplateType,
                })
              }
            >
              <option value={DocumentTemplateType.IMAGE}>
                {t('modals.create.typeImage')}
              </option>
            </Select>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="teal"
            mr={3}
            onClick={() =>
              handleCreateNewDocumentTemplate(createDocumentTemplate)
            }
          >
            {t('buttons.create')}
          </Button>
          <Button variant="outline" colorScheme="teal" onClick={onClose}>
            {t('buttons.cancel')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateDocumentTemplateModal;
