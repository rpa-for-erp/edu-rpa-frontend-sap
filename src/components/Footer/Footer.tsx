import { EmailIcon } from '@chakra-ui/icons';
import {
  Box,
  Container,
  SimpleGrid,
  Stack,
  Text,
  Flex,
  Tag,
  useColorModeValue,
  Input,
  IconButton,
} from '@chakra-ui/react';
import { ReactNode } from 'react';
import { useTranslation } from 'next-i18next';

const ListHeader = ({ children }: { children: ReactNode }) => {
  return (
    <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
      {children}
    </Text>
  );
};

export default function Footer() {
  const { t } = useTranslation('common');
  return (
    <Box
      bg={'white'}
      className="border-t border-gray-200"
      color={useColorModeValue('gray.700', 'gray.200')}
      mt="auto"
    >
      <Container as={Stack} maxW={'6xl'} py={10}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8}>
          <Stack align={'flex-start'}>
            <ListHeader>{t('footer.product')}</ListHeader>
            <Box as="a" href={'#'}>
              {t('footer.overview')}
            </Box>
            <Stack direction={'row'} align={'center'} spacing={2}>
              <Box as="a" href={'#'}>
                {t('footer.features')}
              </Box>
              <Tag size={'sm'} bg="#319795" ml={2} color={'white'}>
                {t('footer.new')}
              </Tag>
            </Stack>
            <Box as="a" href={'#'}>
              {t('footer.tutorials')}
            </Box>
            <Box as="a" href={'#'}>
              {t('footer.pricing')}
            </Box>
            <Box as="a" href={'#'}>
              {t('footer.releases')}
            </Box>
          </Stack>
          <Stack align={'flex-start'}>
            <ListHeader>{t('footer.company')}</ListHeader>
            <Box as="a" href={'#'}>
              {t('footer.aboutUs')}
            </Box>
            <Box as="a" href={'#'}>
              {t('footer.press')}
            </Box>
            <Box as="a" href={'#'}>
              {t('footer.careers')}
            </Box>
            <Box as="a" href={'#'}>
              {t('footer.contactUs')}
            </Box>
            <Box as="a" href={'#'}>
              {t('footer.partners')}
            </Box>
          </Stack>
          <Stack align={'flex-start'}>
            <ListHeader>{t('footer.legal')}</ListHeader>
            <Box as="a" href={'#'}>
              {t('footer.cookiesPolicy')}
            </Box>
            <Box as="a" href={'#'}>
              {t('footer.privacyPolicy')}
            </Box>
            <Box as="a" href={'#'}>
              {t('footer.termsOfService')}
            </Box>
            <Box as="a" href={'#'}>
              {t('footer.lawEnforcement')}
            </Box>
            <Box as="a" href={'#'}>
              {t('footer.status')}
            </Box>
          </Stack>
          <Stack align={'flex-start'}>
            <ListHeader>{t('footer.stayUpToDate')}</ListHeader>
            <Stack direction={'row'}>
              <Input
                placeholder={t('footer.emailPlaceholder')}
                bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.100')}
                border={0}
                _focus={{
                  bg: 'whiteAlpha.300',
                }}
              />
              <IconButton
                bg="#319795"
                color={useColorModeValue('white', 'gray.800')}
                _hover={{
                  bg: '#4FD1C5',
                }}
                aria-label="Subscribe"
                icon={<EmailIcon />}
              />
            </Stack>
          </Stack>
        </SimpleGrid>
      </Container>
      <Box py={10}>
        <Flex align={'center'}>
          <Box></Box>
        </Flex>
        <Text className="text-[16px] text-center">{t('footer.copyright')}</Text>
      </Box>
    </Box>
  );
}
