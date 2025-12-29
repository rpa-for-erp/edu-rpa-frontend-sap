import Image from 'next/image';
import React from 'react';
import Logo from '@/assets/images/logo.png';
import { Button, HStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';

export default function Header() {
  const router = useRouter();
  const { t } = useTranslation('header');
  return (
    <div className="bg-[#fff] w-full shadow-header fixed top-0 left-0 z-10 p-3">
      <div className="w-11/12 m-auto flex justify-between">
        <Image
          src={Logo}
          width={150}
          height={150}
          alt="Logo"
          className="hover:cursor-pointer"
          onClick={() => router.push('/')}
        />
        <HStack spacing={4}>
          <LanguageSwitcher />
          <div className="flex justify-between items-center gap-2">
            <Button
              colorScheme="teal"
              variant="outline"
              onClick={() => router.push('/auth/sign-up')}>
              {t('signUp')}
            </Button>
            <Button
              colorScheme="teal"
              variant="solid"
              onClick={() => router.push('/auth/login')}>
              {t('signIn')}
            </Button>
          </div>
        </HStack>
      </div>
    </div>
  );
}
