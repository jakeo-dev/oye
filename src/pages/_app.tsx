import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";

import AppHeader from "@/components/AppHeader";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLandingPage = router.pathname === "/";
  const isHomePage = router.pathname === "/home";
  const isLessonsPage = router.pathname === "/lessons";
  const isConversationPage = router.pathname === "/conversation";

  return (
    <>
      {!isLandingPage && (
        <AppHeader
          showBackButton={isLessonsPage || isConversationPage}
          showProgressBar={true}
        />
      )}
      <Component {...pageProps} />
    </>
  );
}
