import { useState, useEffect, useRef, useCallback } from "react";

export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef(null);
  const isStoppingRef = useRef(false);
  const isStartedRef = useRef(false);
  const restartAfterStopRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech Recognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("STT: Started");
      setIsListening(true);
      isStartedRef.current = true;
    };

    recognition.onend = () => {
      console.log("STT: Ended");
      setIsListening(false);
      isStartedRef.current = false;
      isStoppingRef.current = false;
      
      if (restartAfterStopRef.current) {
        console.log("STT: Restarting after stop...");
        restartAfterStopRef.current = false;
        // Small delay to ensure browser is ready
        setTimeout(() => {
          startListening();
        }, 100);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        // This is fine, just keep listening if continuous is true
        return;
      }
      setIsListening(false);
      isStartedRef.current = false;
      isStoppingRef.current = false;
      restartAfterStopRef.current = false;
    };

    recognition.onresult = (event) => {
      let currentInterim = "";
      let currentFinal = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          currentFinal += result[0].transcript;
        } else {
          currentInterim += result[0].transcript;
        }
      }

      if (currentFinal) {
        setTranscript((prev) => prev + " " + currentFinal);
      }
      setInterimTranscript(currentInterim);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = useCallback(() => {
    if (isStoppingRef.current) {
      console.log("STT: Stop in progress, scheduling restart");
      restartAfterStopRef.current = true;
      return;
    }

    if (recognitionRef.current && !isStartedRef.current) {
      try {
        // Don't clear transcript here, let the consumer handle it if needed
        // setTranscript(""); 
        setInterimTranscript("");
        recognitionRef.current.start();
      } catch (err) {
        console.error("STT: Failed to start", err);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isStartedRef.current && !isStoppingRef.current) {
      try {
        isStoppingRef.current = true;
        recognitionRef.current.stop();
      } catch (err) {
        console.error("STT: Failed to stop", err);
        isStoppingRef.current = false;
      }
    }
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    setTranscript
  };
}
