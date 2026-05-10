import Link from "next/link";
import { useRouter } from "next/router";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faGear,
  faHouse,
} from "@fortawesome/free-solid-svg-icons";

type AppHeaderProps = {
  showBackButton?: boolean;
  showProgressBar?: boolean;
  progressValue?: number;
};

export default function AppHeader({
  showBackButton = false,
  showProgressBar = false,
  progressValue = 0.7,
}: AppHeaderProps) {
  const router = useRouter();

  const isHomePage = router.pathname === "/home";

  return (
    <header className="border-b border-orange-300/25 bg-orange-400 px-8 py-5 text-stone-900">
      <div className="mx-auto flex w-full max-w-200 items-center gap-4">
        {showBackButton && (
          <Link
            href="/home"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-orange-400 transition hover:bg-stone-900/60"
          >
            <FontAwesomeIcon
              icon={faChevronLeft}
              className="text-base"
              aria-label="Back"
            />
          </Link>
        )}

        <div>
          <p className="text-2xl font-black">[app name]</p>
        </div>

        {showProgressBar && (
          <div className="mx-2 flex h-3 flex-1 items-center justify-center rounded-full bg-neutral-500/25">
            <progress
              className="win-rate-bar-white win-rate-bar-rounded mx-auto h-full w-full appearance-none overflow-hidden rounded-full bg-neutral-500/10"
              value={progressValue}
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {!isHomePage && (
            <Link
              href="/home"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-orange-400 transition hover:bg-stone-900/60"
            >
              <FontAwesomeIcon
                icon={faHouse}
                className="text-base"
                aria-label="Home"
              />
            </Link>
          )}

          <Link
            href="/settings"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-orange-400 transition hover:bg-stone-900/60"
          >
            <FontAwesomeIcon
              icon={faGear}
              className="text-base"
              aria-label="Settings"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
