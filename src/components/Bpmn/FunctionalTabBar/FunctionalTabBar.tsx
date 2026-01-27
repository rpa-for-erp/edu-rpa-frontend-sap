import { useSaveShortcut } from '@/hooks/useSaveShortCut';
import {
  Button,
  Stack,
  useDisclosure,
  Modal,
  ModalOverlay,
} from '@chakra-ui/react';
import React, { useRef, useState } from 'react';
import { FaPlay, FaSave } from 'react-icons/fa';
import { IoMdShare } from 'react-icons/io';
import { MdPublish } from 'react-icons/md';
import { ShareWithModal } from './ShareWithModal';
import { PublishRobotModal } from './PublishRobotModal';
import { useTranslation } from 'next-i18next';

interface FunctionalTabBarProps {
  processID: string;
  genRobotCode: any;
  onSaveAll: any;
}

export default function FunctionalTabBar(props: FunctionalTabBarProps) {
  const { t } = useTranslation('studio');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalType, setType] = useState('publish');
  // Ctrl + S for save
  useSaveShortcut(props.onSaveAll);

  const initialRef = useRef<HTMLInputElement>(null);
  const finalRef = useRef(null);

  return (
    <Stack direction="row" spacing={4}>
      <Button
        leftIcon={<FaSave />}
        colorScheme="teal"
        variant="solid"
        onClick={props.onSaveAll}
      >
        {t('buttons.saveAll')}
      </Button>
      {/* <Button leftIcon={<FaPlay />} colorScheme="teal" variant="solid">
        Run
      </Button> */}
      <Button
        leftIcon={<MdPublish />}
        onClick={() => {
          onOpen();
          props.onSaveAll();
          setType('publish');
        }}
        colorScheme="blue"
        variant="solid"
      >
        {t('buttons.publish')}
      </Button>
      <Button
        leftIcon={<IoMdShare />}
        onClick={() => {
          onOpen();
          setType('share');
        }}
        colorScheme="red"
        variant="solid"
      >
        {t('buttons.share')}
      </Button>

      <Modal
        initialFocusRef={initialRef}
        finalFocusRef={finalRef}
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        {modalType == 'publish' ? (
          <PublishRobotModal {...props} onClose={onClose} />
        ) : (
          <ShareWithModal onClose={onClose} processID={props.processID} />
        )}
      </Modal>
    </Stack>
  );
}
