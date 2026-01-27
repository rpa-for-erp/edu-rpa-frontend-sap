import {
  Container,
  Stack,
  Flex,
  Box,
  Heading,
  Text,
  Button,
  Image,
  Icon,
  IconButton,
  IconProps,
} from '@chakra-ui/react';
import { FaPlayCircle } from 'react-icons/fa';
import { useTranslation } from 'next-i18next';

export default function HeroHome() {
  const { t } = useTranslation('landing');

  return (
    <Container maxW={'8xl'} bgColor={'white'}>
      <Stack
        align={'center'}
        spacing={{ base: 8, md: 10 }}
        py={{ base: 20, md: 28 }}
        px={{ base: 10, md: 14 }}
        direction={{ base: 'column', md: 'row' }}
      >
        <Stack flex={1} spacing={{ base: 5, md: 10 }}>
          <Heading
            lineHeight={1.1}
            fontWeight={600}
            fontSize={{ base: '3xl', sm: '4xl', lg: '5xl' }}
          >
            <Text as={'span'}>{t('hero.title')}</Text>
            <br />
            <Text as={'span'} color={'#319795'} fontSize={55}>
              {t('hero.subtitle')}
            </Text>
          </Heading>
          <Text color={'gray.500'}>
            {t('hero.description')}
            <br />
            <br />
            {t('hero.descriptionContinue')}
          </Text>
          <Stack
            spacing={{ base: 4, sm: 6 }}
            direction={{ base: 'column', sm: 'row' }}
          >
            <Button
              rounded={'lg'}
              size={'lg'}
              fontWeight={'normal'}
              px={6}
              color={'white'}
              bg={'#319795'}
              _hover={{ bg: '#4FD1C5' }}
            >
              {t('hero.getStarted')}
            </Button>
            <Button
              rounded={'lg'}
              size={'lg'}
              variant="outline"
              borderColor={'#319795'}
              fontWeight={'normal'}
              px={6}
              leftIcon={<FaPlayCircle height={4} width={4} color={'#319795'} />}
            >
              {t('hero.howItWorks')}
            </Button>
          </Stack>
        </Stack>
        <Box flex={1} className="w-full h-[400px]">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/5Pq27mQelzI?si=Gi8smiZjocIYrT2T"
            title="ErpRpa"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </Box>
      </Stack>
    </Container>
  );
}

const Blob = (props: IconProps) => {
  return (
    <Icon
      width={'100%'}
      viewBox="0 0 578 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M239.184 439.443c-55.13-5.419-110.241-21.365-151.074-58.767C42.307 338.722-7.478 282.729.938 221.217c8.433-61.644 78.896-91.048 126.871-130.712 34.337-28.388 70.198-51.348 112.004-66.78C282.34 8.024 325.382-3.369 370.518.904c54.019 5.115 112.774 10.886 150.881 49.482 39.916 40.427 49.421 100.753 53.385 157.402 4.13 59.015 11.255 128.44-30.444 170.44-41.383 41.683-111.6 19.106-169.213 30.663-46.68 9.364-88.56 35.21-135.943 30.551z"
        fill="#4FD1C5"
      />
    </Icon>
  );
};
