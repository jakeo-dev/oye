import { useCallback, useEffect, useState } from "react";

type SettingsResponse = {
  settings?: {
    soundEnabled?: boolean;
  };
};

export function useSoundEffect() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((response) => response.json())
      .then((data: SettingsResponse) => {
        if (!cancelled && typeof data.settings?.soundEnabled === "boolean") {
          setSoundEnabled(data.settings.soundEnabled);
        }
      })
      .catch(() => {
        /* keep default */
      });

    function onSettingsUpdated() {
      void fetch("/api/settings")
        .then((response) => response.json())
        .then((data: SettingsResponse) => {
          if (typeof data.settings?.soundEnabled === "boolean") {
            setSoundEnabled(data.settings.soundEnabled);
          }
        })
        .catch(() => {
          /* keep current */
        });
    }

    window.addEventListener("oye:settings-updated", onSettingsUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("oye:settings-updated", onSettingsUpdated);
    };
  }, []);

  return useCallback(
    (kind: "success" | "tap" = "success") => {
      if (!soundEnabled || typeof window === "undefined") {
        return;
      }
      const AudioContextCtor =
        window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContextCtor) {
        return;
      }
      const audio = new AudioContextCtor();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = kind === "success" ? 660 : 420;
      gain.gain.setValueAtTime(0.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06, audio.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.16);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.18);
      window.setTimeout(() => {
        void audio.close();
      }, 240);
    },
    [soundEnabled],
  );
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
