import { NextPage } from 'next';
import { AppProps } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import '@/styles/global.css';
import theme from '@/utils/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import store from '@/redux/store';
import { useRouter } from 'next/router';
import HeaderLayout from '@/components/Layouts/HeaderLayout';
import SidebarLayout from '@/components/Layouts/SidebarLayout';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import NavbarOnlyLayout from '@/components/Layouts/NavbarOnlyLayout';
import { PubNubProvider } from 'pubnub-react';
import PubNub from 'pubnub';
import GoogleAnalytics from '@/components/GoogleAnalytics/GoogleAnalytics';
import { GA } from '@/constants/ga';
import Head from 'next/head';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (_page: React.ReactElement) => React.ReactElement;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function App({ Component, pageProps }: AppPropsWithLayout) {
  const queryClient = new QueryClient();
  const pubnub = new PubNub({
    subscribeKey: process.env.NEXT_PUBLIC_PUBNUB_SUBSCRIBE_KEY,
    userId: 'user',
  });
  const useGetLayout = () => {
    const router = useRouter();
    const path = router.pathname;

    // Personal/default sidebar routes
    const personalSidebarRoutes = [
      '/home',
      '/studio',
      '/robot',
      '/profile',
      '/integration-service',
      '/storage',
      '/document-template',
      '/invitation',
    ];

    // Auth routes use HeaderLayout
    if (path.startsWith('/auth') || path === '/') {
      return HeaderLayout;
    }
    // Create pages use NavbarOnlyLayout
    else if (path === '/workspace/create' || path.endsWith('/create')) {
      return NavbarOnlyLayout;
    }
    // Workspace routes (except /workspace list page) don't use any layout
    // because they use WorkspaceLayout internally
    else if (path.startsWith('/workspace/') && path !== '/workspace') {
      return DefaultLayout;
    }
    // Personal routes and workspace list page use SidebarLayout
    else if (personalSidebarRoutes.includes(path) || path === '/workspace') {
      return SidebarLayout;
    }
    // Default for other routes
    else {
      return DefaultLayout;
    }
  };

  const Layout = useGetLayout();

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          <PubNubProvider client={pubnub}>
            <Head>
              <title>ERP_RPA</title>
            </Head>
            <Layout>
              <Component {...pageProps} />
              <GoogleAnalytics gaID={GA.MEASUREMENT_ID} />
            </Layout>
          </PubNubProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
