import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  useToast,
  Switch,
  FormControl,
  FormLabel,
  Select,
  Input,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import robotApi from '@/apis/robotApi';
import LoadingIndicator from '@/components/LoadingIndicator/LoadingIndicator';
import { toastError, toastSuccess } from '@/utils/common';
import { EventState, TriggerType } from '@/interfaces/robot';
import connectionApi from '@/apis/connectionApi';
import { AuthorizationProvider } from '@/interfaces/enums/provider.enum';
import { providerData } from '@/constants/providerData';
import Image from 'next/image';
import { FilterEventSchedule } from '@/dtos/robotDto';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  processId: string;
  processVersion: number;
}

const TriggerEventGmailModal = ({
  isOpen,
  onClose,
  userId,
  processId,
  processVersion,
}: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState<string[]>([]);
  const [selectedConnection, setSelectedConnection] = useState('');
  const [filterEmail, setFilterEmail] = useState({
    from: '',
    subject: '',
  });
  const [enabled, setEnabled] = useState(false);

  const toast = useToast();
  const { t } = useTranslation('robot');
  const gmailProvider = providerData.find(
    (provider) => provider.name === AuthorizationProvider.G_GMAIL
  );
  const description = t('eventTrigger.gmailDescription');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const connections = await connectionApi.queryConnections(
          AuthorizationProvider.G_GMAIL
        );
        setConnections(connections.map((item) => item.name));

        const schedule = await robotApi.getSchedule(
          userId,
          processId,
          processVersion
        );
        if (schedule.Name) {
          const input = JSON.parse(schedule.Target.Input);
          setSelectedConnection(input.connection_name);
          setFilterEmail(input.filter);
          setEnabled(schedule.State === EventState.ENABLED);
        }
      } catch (error) {
        console.log(error);
        toastError(toast, t('messages.failedToFetchSchedule'));
      }
      setIsLoading(false);
    };
    fetchData();
  }, [userId, processId, processVersion]);

  const handleUpsertEventSchedule = async () => {
    setIsLoading(true);
    try {
      await robotApi.upsertEventSchedule(userId, processId, processVersion, {
        type: TriggerType.EVENT_GMAIL,
        connection_name: selectedConnection,
        filter: filterEmail,
        state: enabled ? EventState.ENABLED : EventState.DISABLED,
      } as FilterEventSchedule);
      toastSuccess(toast, t('messages.triggerConfigured'));
    } catch (error) {
      toastError(toast, t('messages.failedToConfigureTrigger'));
    }
    setIsLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className="m-auto">
          {t('eventTrigger.triggerByEvent')}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Image
            className="m-auto"
            src={gmailProvider!.icon}
            alt="Icon"
            width={50}
            height={50}
          />
          <p>{description}</p>
          <FormControl>
            <FormLabel>{t('eventTrigger.connection')}</FormLabel>
            <Select
              value={selectedConnection}
              onChange={(e) => setSelectedConnection(e.target.value)}
            >
              {selectedConnection === '' && (
                <option value="" disabled>
                  {t('eventTrigger.selectConnection')}
                </option>
              )}
              {connections.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>{t('eventTrigger.from')}</FormLabel>
            <Input
              type="text"
              value={filterEmail.from}
              onChange={(e) =>
                setFilterEmail({ ...filterEmail, from: e.target.value })
              }
              placeholder={t('eventTrigger.from')}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('eventTrigger.subject')}</FormLabel>
            <Input
              type="text"
              value={filterEmail.subject}
              onChange={(e) =>
                setFilterEmail({ ...filterEmail, subject: e.target.value })
              }
              placeholder={t('eventTrigger.subject')}
            />
          </FormControl>
          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="email-alerts" mb="0">
              {t('eventTrigger.enabled')}
            </FormLabel>
            <Switch
              id="email-alerts"
              isChecked={enabled}
              onChange={() => setEnabled(!enabled)}
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            className="mr-2"
            isLoading={isLoading}
            colorScheme="blue"
            onClick={handleUpsertEventSchedule}
          >
            {t('buttons.save', { ns: 'common' })}
          </Button>
          <Button onClick={onClose}>
            {t('buttons.cancel', { ns: 'common' })}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TriggerEventGmailModal;
