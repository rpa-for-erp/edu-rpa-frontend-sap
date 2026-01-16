/**
 * HOC to automatically add translations to pages
 * This ensures translations are loaded for all pages that use this HOC
 */

import { GetServerSideProps, GetStaticProps } from 'next';
import { getServerSideTranslations } from './i18n';

/**
 * Higher-order function to add translations to getServerSideProps
 * Usage: export const getServerSideProps = withServerSideTranslations(['common', 'navbar']);
 */
export function withServerSideTranslations(
  namespaces: string[] = ['common']
) {
  return async (context: any) => {
    return {
      props: {
        ...(await getServerSideTranslations(context, namespaces)),
      },
    };
  };
}

/**
 * Higher-order function to add translations to getStaticProps
 * Usage: export const getStaticProps = withStaticTranslations(['common', 'navbar']);
 */
export function withStaticTranslations(namespaces: string[] = ['common']) {
  return async (context: any) => {
    return {
      props: {
        ...(await getServerSideTranslations(context, namespaces)),
      },
    };
  };
}

