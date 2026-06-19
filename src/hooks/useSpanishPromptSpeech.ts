import { useCallback, useEffect, useRef, useState } from "react";

import type { Lesson } from "@/server/types";

const FALLBACK_PROMPT = "Hola, ¿cómo estás?";

function getPromptText(
  lesson: Lesson | null,
  textOverride: string | null | undefined,
): string {
  const override = textOverride?.trim();
  if (override) {
    return override;
  }
  const trimmed = lesson?.spanishPrompt?.trim();
  return trimmed || FALLBACK_PROMPT;
}

export type UseSpanishPromptSpeechOptions = {
  /** When set, read this instead of the lesson's spanishPrompt. */
  textOverride?: string | null;
};

/**
 * Read aloud the lesson Spanish prompt (or fallback) using Piper through the
 * app's audio endpoint. Click again while speaking to stop.
 */
export function useSpanishPromptSpeech(
  lesson: Lesson | null,
  onError?: (message: string) => void,
  options?: UseSpanishPromptSpeechOptions,
) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const promptText = getPromptText(lesson, options?.textOverride);
  const onErrorRef = useRef(onError);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const stopSpeaking = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    audioRef.current = null;
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => stopSpeaking();
  }, [stopSpeaking]);

  useEffect(() => {
    stopSpeaking();
  }, [promptText, stopSpeaking]);

  const toggleSpeakPrompt = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (audioRef.current) {
      stopSpeaking();
      return;
    }

    const params = new URLSearchParams({ text: promptText });
    const audio = new Audio(`/api/tts?${params.toString()}`);
    audio.preload = "auto";
    audioRef.current = audio;

    audio.onended = () => {
      if (audioRef.current === audio) {
        audioRef.current = null;
        setIsSpeaking(false);
      }
    };
    audio.onerror = () => {
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
      setIsSpeaking(false);
      onErrorRef.current?.(
        "Could not play the prompt aloud. Make sure Piper is running and the Spanish voice is installed.",
      );
    };

    setIsSpeaking(true);
    void audio.play().catch(() => {
      if (audioRef.current !== audio) {
        return;
      }
      audioRef.current = null;
      setIsSpeaking(false);
      onErrorRef.current?.("Could not start audio playback.");
    });
  }, [promptText, stopSpeaking]);

  return { toggleSpeakPrompt, isSpeaking, promptText };
}
