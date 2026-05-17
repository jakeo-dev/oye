import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";

import AppHeader from "@/components/Header";
import ReminderManager from "@/components/ReminderManager";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLandingPage = router.pathname === "/";

  return (
    <>
      {!isLandingPage && <AppHeader showProgressBar={true} />}
      {!isLandingPage && <ReminderManager />}
      <Component {...pageProps} />
    </>
  );
}
