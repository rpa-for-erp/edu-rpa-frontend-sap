import React from 'react';
import { Box, Center, Heading, Text, Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { GetStaticProps } from 'next';
import { getStaticTranslations } from '@/utils/i18n';

const NotFound = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  return (
    <Center height="100vh">
      <Box textAlign="center">
        <Heading
          display="inline-block"
          as="h2"
          size="2xl"
          bgGradient="linear(to-r, teal.400, teal.600)"
          backgroundClip="text">
          404
        </Heading>
        <Text fontSize="18px" mt={3} mb={2}>
          {t('messages.pageNotFound')}
        </Text>
        <Text color={'gray.500'} mb={6}>
          {t('messages.pageNotFoundDescription')}
        </Text>
        <Button
          colorScheme="teal"
          className="mt-[20px]"
          bgGradient="linear(to-r, teal.400, teal.500, teal.600)"
          color="white"
          variant="solid"
          onClick={() => {
            router.push('/home');
          }}>
          {t('buttons.back')} to Home
        </Button>
      </Box>
    </Center>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {
      ...(await getStaticTranslations(context, ['common'])),
    },
  };
};

export default NotFound;
