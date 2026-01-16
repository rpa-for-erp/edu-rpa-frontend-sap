/**
 * Utility functions for i18n
 * This file provides helper functions to easily use translations in components
 */

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSidePropsContext, GetStaticPropsContext } from 'next';

/**
 * Get server side translations for a page
 * Use this in getServerSideProps to enable translations for that page
 * 
 * @example
 * export const getServerSideProps = async (context: GetServerSidePropsContext) => {
 *   return {
 *     props: {
 *       ...(await getServerSideTranslations(context)),
 *     },
 *   };
 * };
 */
export async function getServerSideTranslations(
  context: GetServerSidePropsContext,
  namespaces: string[] = ['common']
) {
  return {
    ...(await serverSideTranslations(context.locale || 'en', namespaces)),
  };
}

/**
 * Get static translations for a page
 * Use this in getStaticProps to enable translations for that page
 * 
 * @example
 * export const getStaticProps = async (context: GetStaticPropsContext) => {
 *   return {
 *     props: {
 *       ...(await getStaticTranslations(context)),
 *     },
 *   };
 * };
 */
export async function getStaticTranslations(
  context: GetStaticPropsContext,
  namespaces: string[] = ['common']
) {
  return {
    ...(await serverSideTranslations(context.locale || 'en', namespaces)),
  };
}

