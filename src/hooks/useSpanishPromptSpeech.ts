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
 * Read aloud the lesson Spanish prompt (or fallback) using the browser
 * Speech Synthesis API. Click again while speaking to stop.
 */
export function useSpanishPromptSpeech(
  lesson: Lesson | null,
  onError?: (message: string) => void,
  options?: UseSpanishPromptSpeechOptions,
) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const promptText = getPromptText(lesson, options?.textOverride);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [promptText]);

  const toggleSpeakPrompt = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    const synth = window.speechSynthesis;
    if (!synth) {
      onErrorRef.current?.("Read aloud is not supported in this browser.");
      return;
    }

    if (synth.speaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(promptText);
    utterance.lang = "es-ES";
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      onErrorRef.current?.("Could not play the prompt aloud.");
    };
    setIsSpeaking(true);
    synth.speak(utterance);
  }, [promptText]);

  return { toggleSpeakPrompt, isSpeaking, promptText };
}
