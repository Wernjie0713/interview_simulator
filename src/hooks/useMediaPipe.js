import { useState, useEffect, useRef } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export function useMediaPipe() {
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [results, setResults] = useState(null);
  const videoRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    async function initMediaPipe() {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });
      setFaceLandmarker(landmarker);
    }
    initMediaPipe();
  }, []);

  const predict = () => {
    if (
      faceLandmarker && 
      videoRef.current && 
      videoRef.current.readyState >= 2 && // HAVE_CURRENT_DATA
      !videoRef.current.paused &&
      !videoRef.current.ended
    ) {
      try {
        const startTimeMs = performance.now();
        const result = faceLandmarker.detectForVideo(videoRef.current, startTimeMs);
        setResults(result);
      } catch (err) {
        console.error("MediaPipe detection error:", err);
      }
    }
    requestRef.current = requestAnimationFrame(predict);
  };

  useEffect(() => {
    if (faceLandmarker) {
      requestRef.current = requestAnimationFrame(predict);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [faceLandmarker]);

  return { videoRef, results, isLoading: !faceLandmarker };
}
