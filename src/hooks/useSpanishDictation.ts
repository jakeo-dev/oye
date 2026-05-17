import { useCallback, useEffect, useRef, useState } from "react";

type DictationMessages = {
  listening: string;
  unsupported: string;
  denied: string;
  startError: string;
  genericError: (code: string) => string;
};

type UseSpanishDictationOptions = {
  value: string;
  onChange: (value: string) => void;
  onStatus: (message: string) => void;
  lang?: string;
  messages: DictationMessages;
};

type BrowserSpeechRecognitionAlternative = {
  transcript: string;
};

type BrowserSpeechRecognitionResult =
  ArrayLike<BrowserSpeechRecognitionAlternative> & {
    length: number;
    isFinal: boolean;
  };

type BrowserSpeechRecognitionResultListEvent = {
  results: ArrayLike<BrowserSpeechRecognitionResult> & {
    length: number;
    item?: (index: number) => BrowserSpeechRecognitionResult | null;
    [index: number]: BrowserSpeechRecognitionResult;
  };
};

type BrowserSpeechRecognitionErrorEvent = {
  error?: string;
};

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: BrowserSpeechRecognitionResultListEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

function getSpeechRecognitionConstructor():
  | BrowserSpeechRecognitionConstructor
  | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function mergeTranscript(prefix: string, transcript: string): string {
  const trimmedPrefix = prefix.trim();
  const trimmedTranscript = transcript.trim();

  if (trimmedPrefix && trimmedTranscript) {
    return `${trimmedPrefix} ${trimmedTranscript}`;
  }
  return trimmedTranscript || trimmedPrefix;
}

export function useSpanishDictation({
  value,
  onChange,
  onStatus,
  lang = "es-ES",
  messages,
}: UseSpanishDictationOptions) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const baseTextRef = useRef("");
  const clearListeningStatusOnEndRef = useRef(false);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }
    try {
      recognitionRef.current.stop();
    } catch {
      recognitionRef.current.abort();
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();

    if (!SpeechRecognitionCtor) {
      onStatus(messages.unsupported);
      return;
    }

    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore stale recognition sessions */
    }
    recognitionRef.current = null;

    baseTextRef.current = value;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: BrowserSpeechRecognitionResultListEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        const first = result?.[0];
        if (first?.transcript) {
          transcript += first.transcript;
        }
      }
      onChange(mergeTranscript(baseTextRef.current, transcript));
    };

    recognition.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
      setIsListening(false);
      recognitionRef.current = null;

      const code = event.error ?? "unknown";
      if (code === "aborted" || code === "no-speech") {
        clearListeningStatusOnEndRef.current = true;
        onStatus("");
        return;
      }
      clearListeningStatusOnEndRef.current = false;
      if (code === "not-allowed" || code === "service-not-allowed") {
        onStatus(messages.denied);
        return;
      }
      onStatus(messages.genericError(code));
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (clearListeningStatusOnEndRef.current) {
        onStatus("");
      }
      clearListeningStatusOnEndRef.current = false;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      clearListeningStatusOnEndRef.current = true;
      onStatus(messages.listening);
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
      clearListeningStatusOnEndRef.current = false;
      onStatus(messages.startError);
    }
  }, [lang, messages, onChange, onStatus, value]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore stale recognition sessions */
      }
      recognitionRef.current = null;
    };
  }, []);

  return {
    isListening,
    isSupported:
      typeof window !== "undefined" && getSpeechRecognitionConstructor() !== null,
    startListening,
    stopListening,
    toggleListening,
  };
}
