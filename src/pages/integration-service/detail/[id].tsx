import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Container,
  Text,
  IconButton,
  InputGroup,
  InputLeftElement,
  Input,
  useToast,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { ChevronLeftIcon, RepeatIcon, SearchIcon } from '@chakra-ui/icons';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/constants/queryKey';
import robotApi from '@/apis/robotApi';
import { Robot } from '@/interfaces/robot';
import RobotTable from '@/components/Robot/RobotTable';
import { toastError } from '@/utils/common';
import { useTranslation } from 'next-i18next';
import { GetServerSideProps } from 'next';
import { getServerSideTranslations } from '@/utils/i18n';

const ServiceDetail = () => {
  const { t } = useTranslation('integration-service');
  const router = useRouter();
  const param = useParams();
  const toast = useToast();
  const [nameFilter, setNameFilter] = useState('');

  const connectionKey = param?.id as string;
  const provider = router.query?.provider as string;
  const user = router.query?.user as string;

  const { data: robotList } = useQuery({
    queryKey: [QUERY_KEY.ROBOT_LIST_BY_CONNECTION_KEY],
    queryFn: () => robotApi.getAllRobotsByConnectionKey(connectionKey),
  });

  const fetchData = async () => {
    // TODO: implement refresh functionallity
    toastError(toast, t('toast.refreshNotImplemented'));
  };

  const formatData: Omit<Robot, 'userId'>[] =
    robotList &&
    robotList.map((item: any) => {
      return {
        name: item.name,
        processId: item.processId,
        processVersion: item.processVersion,
        createdAt: item.createdAt,
        triggerType: item.triggerType,
        robotKey: item.robotKey,
      };
    });

  const tableProps = {
    header: [
      t('detail.robotName'),
      t('detail.processId'),
      t('detail.processVersion'),
      t('detail.createdAt'),
      t('detail.triggerType'),
      t('detail.status'),
      t('detail.actions'),
    ],
    data: formatData ?? [],
  };

  return (
    <Box className="fixed top-0 left-0 right-0 bottom-0 bg-white overflow-y-auto">
      <Box className="flex justify-between items-center w-90 m-auto">
        <IconButton
          colorScheme="teal"
          aria-label="Prev to home"
          variant="outline"
          isRound={true}
          size="lg"
          onClick={() => router.push('/integration-service')}
          icon={<ChevronLeftIcon />}
        />
        <Heading
          as="h1"
          size="xl"
          textAlign="center"
          color="teal"
          my={5}
          py={8}
        >
          {t('detail.title')}
        </Heading>
        <Box></Box>
      </Box>
      <Box
        bg="gray.100"
        p={4}
        rounded="lg"
        shadow="md"
        mb={6}
        className="w-90 m-auto"
      >
        <Text>
          <b>{t('detail.provider')}:</b> {provider}
        </Text>
        <Text>
          <b>{t('detail.email')}:</b> {user}
        </Text>
      </Box>
      {tableProps.data.length === 0 && (
        <div className="w-90 m-auto flex justify-center items-center">
          <div className="text-center">
            <div className="text-2xl font-bold">{t('detail.noRobots')}</div>
            <div className="text-gray-500">
              {t('detail.noRobotsDescription')}
            </div>
          </div>
        </div>
      )}

      {tableProps.data.length > 0 && (
        <div className="w-90 mx-auto my-[30px]">
          <div className="my-10">
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.500" />
              </InputLeftElement>
              <Input
                width="30vw"
                bg="white.300"
                type="text"
                placeholder={t('detail.searchByRobotName')}
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
              <Box className="w-[15vw] ml-[20px]">
                <IconButton
                  aria-label={t('detail.refresh')}
                  icon={<RepeatIcon />}
                  onClick={fetchData}
                />
              </Box>
            </InputGroup>
          </div>
          <RobotTable header={tableProps.header} data={tableProps.data} />
        </div>
      )}
    </Box>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      ...(await getServerSideTranslations(context, [
        'common',
        'sidebar',
        'navbar',
        'integration-service',
      ])),
    },
  };
};

export default ServiceDetail;
