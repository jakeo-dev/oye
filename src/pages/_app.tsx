import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";

import AppHeader from "@/components/Header";
import ReminderManager from "@/components/ReminderManager";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLandingPage = router.pathname === "/";

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>¡Oye!</title>

        <meta name="theme-color" content="#ffb86a" />
      </Head>

      {!isLandingPage && <AppHeader showProgressBar={true} />}
      {!isLandingPage && <ReminderManager />}

      <Component {...pageProps} />
    </>
  );
}
