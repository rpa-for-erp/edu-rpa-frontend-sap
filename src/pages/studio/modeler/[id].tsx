import React from 'react';
import dynamic from 'next/dynamic';
import { GetServerSideProps } from 'next';
import { getServerSideTranslations } from '@/utils/i18n';

const DynamicCustomModeler = dynamic(
  () => import('@/components/Bpmn/CustomModeler'),
  { ssr: false }
);

export default function Modeler() {
  return (
    <div>
      <DynamicCustomModeler />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      ...(await getServerSideTranslations(context, [
        'common',
        'sidebar',
        'navbar',
        'studio',
        'activities',
      ])),
    },
  };
};
