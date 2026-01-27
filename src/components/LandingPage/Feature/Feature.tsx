import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { ReactElement } from 'react';
import { useTranslation } from 'next-i18next';
import {
  FcDoughnutChart,
  FcFlowChart,
  FcCollaboration,
  FcTodoList,
  FcReading,
} from 'react-icons/fc';

interface CardProps {
  heading: string;
  description: string;
  icon: ReactElement;
  href: string;
}

const Card = ({ heading, description, icon, href }: CardProps) => {
  const { t } = useTranslation('landing');

  return (
    <Box
      maxW={{ base: 'full', md: '275px' }}
      w={'full'}
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={5}
    >
      <Stack align={'start'} spacing={2}>
        <Flex
          w={16}
          h={16}
          align={'center'}
          justify={'center'}
          color={'white'}
          rounded={'full'}
          bg={useColorModeValue('gray.100', 'gray.700')}
        >
          {icon}
        </Flex>
        <Box mt={2}>
          <Heading size="md">{heading}</Heading>
          <Text
            my={2}
            fontSize={'sm'}
            noOfLines={3}
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {description}
          </Text>
        </Box>
        <Button variant={'link'} colorScheme={'blue'} size={'sm'}>
          {t('features.learnMore')}
        </Button>
      </Stack>
    </Box>
  );
};

export default function FeatureHome() {
  const { t } = useTranslation('landing');

  return (
    <Box p={5} bgColor={'white'}>
      <Stack spacing={4} as={Container} maxW={'3xl'} textAlign={'center'}>
        <Heading
          fontSize={{ base: '2xl', sm: '4xl' }}
          fontWeight={'bold'}
          mt={5}
          color="teal.500"
        >
          {t('features.title')}
        </Heading>
        <Text color={'gray.600'} fontSize={{ base: 'sm', sm: 'lg' }}>
          {t('features.subtitle')}
        </Text>
      </Stack>

      <Container maxW={'5xl'} mt={12}>
        <Flex flexWrap="wrap" gridGap={6} justify="center">
          <Card
            heading={t('features.designWorkflow.title')}
            icon={<Icon as={FcFlowChart} w={10} h={10} />}
            description={t('features.designWorkflow.description')}
            href={'#'}
          />
          <Card
            heading={t('features.utilizePackages.title')}
            icon={<Icon as={FcCollaboration} w={10} h={10} />}
            description={t('features.utilizePackages.description')}
            href={'#'}
          />
          <Card
            heading={t('features.collaborate.title')}
            icon={<Icon as={FcReading} w={10} h={10} />}
            description={t('features.collaborate.description')}
            href={'#'}
          />
          <Card
            heading={t('features.scheduleRobot.title')}
            icon={<Icon as={FcTodoList} w={10} h={10} />}
            description={t('features.scheduleRobot.description')}
            href={'#'}
          />
          <Card
            heading={t('features.monitorLogs.title')}
            icon={<Icon as={FcDoughnutChart} w={10} h={10} />}
            description={t('features.monitorLogs.description')}
            href={'#'}
          />
        </Flex>
      </Container>
    </Box>
  );
}
