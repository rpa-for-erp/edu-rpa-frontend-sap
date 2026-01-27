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
import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';

interface Props {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  handleCreateFolder: (folderName: string) => void;
}

const CreateFolderModal: React.FC<Props> = ({
  isOpen,
  isLoading,
  onClose,
  handleCreateFolder,
}) => {
  const { t } = useTranslation('storage');
  const [folderName, setFolderName] = useState<string>('');

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('createFolder')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl>
            <FormLabel>{t('folderName')}</FormLabel>
            <Input
              placeholder={t('enterFolderName')}
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            disabled={!folderName || isLoading}
            isLoading={isLoading}
            onClick={() => handleCreateFolder(folderName)}
          >
            {t('save')}
          </Button>
          <Button onClick={onClose}>{t('cancel')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateFolderModal;
