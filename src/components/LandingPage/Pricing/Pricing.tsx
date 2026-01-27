'use client';

import {
  Box,
  Stack,
  HStack,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  List,
  ListItem,
  ListIcon,
  Button,
} from '@chakra-ui/react';
import { FaCheckCircle } from 'react-icons/fa';
import { useTranslation } from 'next-i18next';

interface Props {
  children: React.ReactNode;
}

function PriceWrapper(props: Props) {
  const { children } = props;

  return (
    <Box
      mb={4}
      shadow="base"
      borderWidth="1px"
      alignSelf={{ base: 'center', lg: 'flex-start' }}
      _hover={{
        cursor: 'pointer',
        transform: 'scale(1.05)',
        transition: 'transform .2s',
      }}
      borderColor={useColorModeValue('gray.200', 'gray.500')}
      borderRadius={'xl'}
    >
      {children}
    </Box>
  );
}

export default function PricingHome() {
  const { t } = useTranslation('landing');

  return (
    <Box py={12} bgColor={'white'}>
      <VStack spacing={2} textAlign="center">
        <Heading as="h1" fontSize="4xl" color="teal.500">
          {t('pricing.title')}
        </Heading>
        <Text fontSize="lg" color={'gray.500'}>
          {t('pricing.subtitle')}
        </Text>
      </VStack>
      <Stack
        direction={{ base: 'column', md: 'row' }}
        textAlign="center"
        justify="center"
        spacing={{ base: 4, lg: 10 }}
        py={10}
      >
        <PriceWrapper>
          <Box py={4} px={12}>
            <Text fontWeight="500" fontSize="2xl">
              {t('pricing.hobby.name')}
            </Text>
            <HStack justifyContent="center">
              <Text fontSize="3xl" fontWeight="600">
                $
              </Text>
              <Text fontSize="5xl" fontWeight="900">
                5
              </Text>
              <Text fontSize="3xl" color="gray.500">
                {t('pricing.month')}
              </Text>
            </HStack>
          </Box>
          <VStack
            bg={useColorModeValue('gray.50', 'gray.700')}
            py={4}
            borderBottomRadius={'xl'}
          >
            <List spacing={3} textAlign="start" px={12}>
              <ListItem>
                <ListIcon as={FaCheckCircle} color="green.500" />
                {t('pricing.hobby.feature1')}
              </ListItem>
              <ListItem>
                <ListIcon as={FaCheckCircle} color="green.500" />
                {t('pricing.hobby.feature2')}
              </ListItem>
              <ListItem>
                <ListIcon as={FaCheckCircle} color="green.500" />
                {t('pricing.hobby.feature3')}
              </ListItem>
            </List>
            <Box w="80%" pt={7}>
              <Button w="full" colorScheme="teal" variant="outline">
                {t('pricing.startTrial')}
              </Button>
            </Box>
          </VStack>
        </PriceWrapper>

        <PriceWrapper>
          <Box position="relative">
            <Box
              position="absolute"
              top="-16px"
              left="50%"
              style={{ transform: 'translate(-50%)' }}
            >
              <Text
                textTransform="uppercase"
                bg={useColorModeValue('teal.300', 'teal.700')}
                px={3}
                py={1}
                color={useColorModeValue('gray.900', 'gray.300')}
                fontSize="sm"
                fontWeight="600"
                rounded="xl"
              >
                Most Popular
              </Text>
            </Box>
            <Box py={4} px={12}>
              <Text fontWeight="500" fontSize="2xl">
                {t('pricing.standard.name')}
              </Text>
              <HStack justifyContent="center">
                <Text fontSize="3xl" fontWeight="600">
                  $
                </Text>
                <Text fontSize="5xl" fontWeight="900">
                  10
                </Text>
                <Text fontSize="3xl" color="gray.500">
                  {t('pricing.month')}
                </Text>
              </HStack>
            </Box>
            <VStack
              bg={useColorModeValue('gray.50', 'gray.700')}
              py={4}
              borderBottomRadius={'xl'}
            >
              <List spacing={3} textAlign="start" px={12}>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color="green.500" />
                  {t('pricing.standard.feature1')}
                </ListItem>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color="green.500" />
                  {t('pricing.standard.feature2')}
                </ListItem>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color="green.500" />
                  {t('pricing.standard.feature3')}
                </ListItem>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color="green.500" />
                  {t('pricing.standard.feature4')}
                </ListItem>
              </List>
              <Box w="80%" pt={7}>
                <Button w="full" colorScheme="teal">
                  {t('pricing.startTrial')}
                </Button>
              </Box>
            </VStack>
          </Box>
        </PriceWrapper>
        <PriceWrapper>
          <Box py={4} px={12}>
            <Text fontWeight="500" fontSize="2xl">
              {t('pricing.premium.name')}
            </Text>
            <HStack justifyContent="center">
              <Text fontSize="3xl" fontWeight="600">
                $
              </Text>
              <Text fontSize="5xl" fontWeight="900">
                15
              </Text>
              <Text fontSize="3xl" color="gray.500">
                {t('pricing.month')}
              </Text>
            </HStack>
          </Box>
          <VStack
            bg={useColorModeValue('gray.50', 'gray.700')}
            py={4}
            borderBottomRadius={'xl'}
          >
            <List spacing={3} textAlign="start" px={12}>
              <ListItem>
                <ListIcon as={FaCheckCircle} color="green.500" />
                {t('pricing.premium.feature1')}
              </ListItem>
              <ListItem>
                <ListIcon as={FaCheckCircle} color="green.500" />
                {t('pricing.premium.feature2')}
              </ListItem>
              <ListItem>
                <ListIcon as={FaCheckCircle} color="green.500" />
                {t('pricing.premium.feature3')}
              </ListItem>
              <ListItem>
                <ListIcon as={FaCheckCircle} color="green.500" />
                {t('pricing.premium.feature4')}
              </ListItem>
              <ListItem>
                <ListIcon as={FaCheckCircle} color="green.500" />
                {t('pricing.premium.feature5')}
              </ListItem>
            </List>
            <Box w="80%" pt={7}>
              <Button w="full" colorScheme="teal" variant="outline">
                {t('pricing.startTrial')}
              </Button>
            </Box>
          </VStack>
        </PriceWrapper>
      </Stack>
    </Box>
  );
}
