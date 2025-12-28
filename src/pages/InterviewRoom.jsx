import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, User, Sparkles, Loader2, Volume2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { geminiService } from "@/services/geminiService";
import { ttsService } from "@/services/ttsService";
import { interviewService } from "@/services/interviewService";
import { cn } from "@/lib/utils";

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isInterviewing, setIsInterviewing] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState("Initializing interview...");
  const [isThinking, setIsThinking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [interviewData, setInterviewData] = useState(null);
  
  const { videoRef, results, isLoading: isMediaPipeLoading } = useMediaPipe();
  const { 
    isListening, 
    transcript, 
    interimTranscript, 
    startListening, 
    stopListening,
    setTranscript 
  } = useSpeechToText();

  const streamRef = useRef(null);
  const isMutedRef = useRef(isMuted);
  const prevIsMuted = useRef(isMuted);
  const audioRef = useRef(new Audio());

  const speakResponse = useCallback(async (text) => {
    setIsAISpeaking(true);
    try {
      const audioUrl = await ttsService.getAudioUrl(text);
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
        
        audioRef.current.onended = () => {
          setIsAISpeaking(false);
          if (!isMutedRef.current) startListening();
        };
      } else {
        setIsAISpeaking(false);
      }
    } catch (err) {
      console.error("TTS Error", err);
      setIsAISpeaking(false);
    }
  }, [startListening]);

  // Handle mute toggle
  useEffect(() => {
    if (prevIsMuted.current !== isMuted) {
      if (isMuted) {
        stopListening();
      } else {
        if (!isAISpeaking && !isThinking && isInterviewing) {
          startListening();
        }
      }
      prevIsMuted.current = isMuted;
    }
    isMutedRef.current = isMuted;
  }, [isMuted, isAISpeaking, isThinking, isInterviewing, stopListening, startListening]);

  // Fetch interview data
  useEffect(() => {
    async function fetchInterviewData() {
      try {
        const data = await interviewService.getInterviewReport(id);
        if (data) {
          setInterviewData(data);
        }
      } catch (error) {
        console.error("Error fetching interview data:", error);
      }
    }
    if (id) {
      fetchInterviewData();
    }
  }, [id]);

  // Start interview logic
  useEffect(() => {
    if (!isMediaPipeLoading && isInterviewing && interviewData) {
      const startInterview = async () => {
        setIsThinking(true);
        try {
          let context = `Interview Type: ${interviewData.type}. Difficulty: ${interviewData.difficulty}.`;
          if (interviewData.cvSummary) {
            context += ` Candidate CV Summary: ${interviewData.cvSummary}.`;
          } else {
            context += ` General behavioral interview for a software engineer role.`;
          }

          const question = await geminiService.getInterviewQuestion(context);
          setCurrentQuestion(question);
          setIsThinking(false);
          await speakResponse(question);
        } catch (err) {
          console.error("Failed to start interview:", err);
          setIsThinking(false);
        }
      };
      startInterview();
    }
  }, [isMediaPipeLoading, interviewData, speakResponse]);

  // Handle follow-up questions
  const handleNextQuestion = useCallback(async () => {
    stopListening();
    setIsThinking(true);
    
    const expression = getExpression();
    const userMessage = transcript.trim() || "[User skipped or provided no verbal answer]";
    
    // Save current Q&A to history
    setInterviewHistory(prev => [...prev, { question: currentQuestion, answer: userMessage }]);

    let context = `User response: "${userMessage}". Their expression was ${expression}.`;
    
    if (interviewData?.cvSummary) {
      context += ` Context: Candidate CV Summary: ${interviewData.cvSummary}.`;
    }
    
    context += ` Ask a relevant follow-up question or continue the interview.`;
    
    try {
      const nextQuestion = await geminiService.getInterviewQuestion(context);
      setCurrentQuestion(nextQuestion);
      setIsThinking(false);
      setTranscript("");
      
      await speakResponse(nextQuestion);
    } catch (err) {
      console.error("Failed to get follow-up:", err);
      setIsThinking(false);
      setTranscript("");
      // Fallback to keep the interview moving
      setCurrentQuestion("Tell me more about your experience with that.");
      if (!isMutedRef.current) startListening();
    }
  }, [transcript, currentQuestion, stopListening, startListening, setTranscript, interviewData, speakResponse]);

  // Webcam setup
  useEffect(() => {
    async function setupWebcam() {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        if (!isVideoOff) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 1280, height: 720 }, 
            audio: true 
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Force play to ensure it's not stuck
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play().catch(e => console.error("Video play failed:", e));
            };
          }
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    }

    setupWebcam();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoOff, videoRef]);

  // Simple expression detection logic
  const getExpression = () => {
    if (!results?.faceBlendshapes?.[0]) return "Neutral";
    
    const blendshapes = results.faceBlendshapes[0].categories;

    // Helper: Get score for a specific shape name
    const getScore = (name) => blendshapes.find((b) => b.categoryName === name)?.score || 0;

    // 1. CALCULATE COMPOSITE SCORES
    // Combine Left and Right for symmetry, and average them.
    
    // Smile: Corners of mouth going up
    const smileScore = (getScore("mouthSmileLeft") + getScore("mouthSmileRight")) / 2;

    // Frown/Focused: Brows going down (furrowing)
    const focusScore = (getScore("browDownLeft") + getScore("browDownRight")) / 2;

    // Speaking/Surprised: Jaw is open
    const jawOpenScore = getScore("jawOpen");

    // Thinking: Often involves a pucker, mouth roll, or looking upwards/squinting
    // We combine a few "pensive" traits
    const puckerScore = getScore("mouthPucker");
    const mouthRollScore = getScore("mouthRollLower"); // Biting lip
    const chinRaiseScore = getScore("chinRaise"); // Often happens when thinking
    const thinkingScore = Math.max(puckerScore, mouthRollScore, (chinRaiseScore + puckerScore) / 2);

    // 2. DEFINE THRESHOLDS
    // These are "sensitivity" levels. Lower = more sensitive, Higher = strict.
    const THRESHOLDS = {
      smile: 0.45,
      focus: 0.4,
      thinking: 0.35,
      jawOpen: 0.18, // Jaw doesn't need to be fully unhinged to be "open"
    };

    // 3. DETERMINE DOMINANT EXPRESSION
    // Instead of an immediate 'return', we find which score is highest relative to its threshold.
    
    let currentExpression = "Neutral";
    let maxConfidence = 0;

    // Check Smile
    if (smileScore > THRESHOLDS.smile && smileScore > maxConfidence) {
      currentExpression = "Smiling";
      maxConfidence = smileScore;
    }

    // Check Focus (Prioritize focus only if it's strong)
    if (focusScore > THRESHOLDS.focus && focusScore > maxConfidence) {
      currentExpression = "Serious/Focused";
      maxConfidence = focusScore;
    }

    // Check Thinking
    if (thinkingScore > THRESHOLDS.thinking && thinkingScore > maxConfidence) {
      currentExpression = "Thinking";
      maxConfidence = thinkingScore;
    }

    // Check Speaking (Jaw Open)
    // Note: We often treat 'speaking' as a lower priority override, 
    // or checks if it is significantly higher than others.
    if (jawOpenScore > THRESHOLDS.jawOpen) {
      // Special logic: You can smile and speak, but usually, jaw open implies talking.
      // If the jaw is VERY open, it overrides a weak smile.
      if (jawOpenScore > maxConfidence) {
        currentExpression = "Speaking";
        maxConfidence = jawOpenScore;
      }
    }

    return currentExpression;
  };

  const analyzeInterviewPerformance = () => {
    if (!results?.faceBlendshapes?.[0]) return null;
    const blendshapes = results.faceBlendshapes[0].categories;

    // Helper
    const getScore = (name) => blendshapes.find(b => b.categoryName === name)?.score || 0;

    // --- 1. DETECT GAZE & CONFIDENCE (Looking Down/Away) ---
    const lookDown = (getScore("eyeLookDownLeft") + getScore("eyeLookDownRight")) / 2;
    const lookUp = (getScore("eyeLookUpLeft") + getScore("eyeLookUpRight")) / 2;

    // "Shifty Eyes" - looking left/right constantly
    const lookLeft = getScore("eyeLookOutLeft") + getScore("eyeLookInRight"); // Eyes moving left
    const lookRight = getScore("eyeLookInLeft") + getScore("eyeLookOutRight"); // Eyes moving right
    const sideGlance = Math.max(lookLeft, lookRight) / 2;

    // Confidence Score Calculation (0 to 1)
    // Penalize looking down heavily, penalize side glances slightly
    let confidenceScore = 1.0;
    if (lookDown > 0.4) confidenceScore -= 0.4; // Major penalty for looking down
    if (sideGlance > 0.5) confidenceScore -= 0.2; // Minor penalty for looking away

    // --- 2. DETECT NERVOUS HABITS (Micro-expressions) ---
    // Lip Press: Pressing lips together (Anxiety/Withholding)
    const lipPress = (getScore("mouthPressLeft") + getScore("mouthPressRight")) / 2;

    // Lip Bite: Rolling lips inward (Nervousness)
    const lipBite = getScore("mouthRollLower");

    // Brow Furrow: Confusion or intense stress
    const frown = (getScore("browDownLeft") + getScore("browDownRight")) / 2;

    let nervousScore = 0;
    if (lipPress > 0.3) nervousScore += 0.4;
    if (lipBite > 0.3) nervousScore += 0.5;
    if (frown > 0.4) nervousScore += 0.3;

    // --- 3. DETERMINE STATE LABEL ---
    let status = "Confident / Engaged"; // Default good state

    if (lookDown > 0.5) {
      status = "Looking Down (Low Confidence)";
    } else if (sideGlance > 0.6) {
      status = "Distracted / Looking Away";
    } else if (nervousScore > 0.5) {
      status = "Tense / Nervous";
    } else if (lookUp > 0.5) {
      status = "Thinking / Recalling"; // Looking up is usually recalling info, not bad
    }

    // --- 4. RETURN DATA FOR UI ---
    return {
      status: status,
      metrics: {
        confidence: Math.max(0, confidenceScore.toFixed(2)), // 0.0 - 1.0
        nervousness: Math.min(1, nervousScore.toFixed(2)), // 0.0 - 1.0
        eyeContact: (1 - lookDown - sideGlance).toFixed(2) // Estimate of direct gaze
      },
      // Useful for debugging specific movements
      raw: { lookDown, lipPress, lipBite }
    };
  };

  const handleEndCall = async () => {
    stopListening();
    setIsInterviewing(false);
    setIsSaving(true);
    
    try {
      // 1. Get Visual Metrics
      const visualAnalysis = analyzeInterviewPerformance();
      
      // Prepare full transcript
      const currentEntry = { 
        question: currentQuestion, 
        answer: transcript.trim() || "[User ended interview]" 
      };
      const fullHistory = [...interviewHistory, currentEntry];
      const formattedTranscript = fullHistory.map((h, i) => `Q${i+1}: ${h.question}\nA: ${h.answer}`).join("\n\n");

      // 2. Get AI Evaluation (Content + Clarity + Combined Confidence)
      const aiEvaluation = await geminiService.evaluateInterviewPerformance(
        formattedTranscript,
        visualAnalysis ? visualAnalysis.metrics : {}
      );

      await interviewService.updateInterview(id, {
        score: aiEvaluation.score,
        confidenceScore: aiEvaluation.confidenceScore,
        clarityScore: aiEvaluation.clarityScore,
        answerScore: aiEvaluation.answerScore,
        transcript: formattedTranscript,
        feedback: aiEvaluation.feedback,
        keyInsights: aiEvaluation.keyInsights
      });
      navigate(`/report/${id}`);
    } catch (error) {
      console.error("Failed to save interview results", error);
      navigate("/dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-black text-white overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        {/* User Video (Large) */}
        <div className="w-full max-w-4xl aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 relative shadow-2xl">
          {!isVideoOff ? (
            <div className="w-full h-full relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-sm">
                <User className="h-4 w-4" /> You
              </div>
              
              {/* MediaPipe Overlay */}
              <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                {isMediaPipeLoading ? (
                  <Badge variant="outline" className="bg-black/50 text-zinc-400 border-zinc-800">
                    <Loader2 className="h-3 w-3 animate-spin mr-2" /> Initializing AI...
                  </Badge>
                ) : (
                  <>
                    <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 animate-pulse">
                      LIVE ANALYSIS
                    </Badge>
                    <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded text-[10px] font-mono text-zinc-300 border border-zinc-800">
                      EXPRESSION: <span className="text-white">{getExpression()}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Transcript Overlay */}
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 min-h-[80px] flex flex-col justify-center text-center">
                  {isListening ? (
                    <p className="text-lg text-white/90 leading-tight">
                      {transcript}
                      <span className="text-white/40">{interimTranscript}</span>
                      <span className="inline-block w-1 h-5 bg-primary ml-1 animate-pulse" />
                    </p>
                  ) : (
                    <p className="text-zinc-500 italic">
                      {isAISpeaking ? "Listening after AI finishes..." : "Click 'Next Question' or speak to continue"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
              <User className="h-32 w-32 text-zinc-800" />
            </div>
          )}
        </div>

        {/* AI Interactor (Small Overlay) */}
        <div className="absolute bottom-10 right-10 w-80 bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl flex flex-col">
          {/* Status Indicator */}
          <div className="p-4 pb-0 flex justify-end">
             <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">AI Interviewer</span>
                {isAISpeaking && <Volume2 className="h-4 w-4 text-primary animate-bounce" />}
             </div>
          </div>

          {/* Text & Controls */}
          <div className="p-5 pt-4 flex flex-col gap-4">
            <div className="text-sm text-zinc-200 leading-relaxed min-h-[60px] max-h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pr-2">
              {isThinking ? (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing your response...</span>
                </div>
              ) : (
                currentQuestion
              )}
            </div>

            {!isThinking && !isAISpeaking && (
              <Button 
                onClick={handleNextQuestion}
                className="w-full rounded-xl bg-white hover:bg-white/80 text-primary border border-primary/30 gap-2"
              >
                {transcript.trim() ? "Next Question" : "Skip / Next"} <Sparkles className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="h-24 bg-zinc-950 border-t border-zinc-800 flex items-center justify-center px-6 gap-4">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button
          variant={isVideoOff ? "destructive" : "secondary"}
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={() => setIsVideoOff(!isVideoOff)}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full h-12 w-12"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        <div className="w-px h-8 bg-zinc-800 mx-2" />
        <Button
          variant="destructive"
          className="rounded-full px-8 h-12 gap-2"
          onClick={handleEndCall}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <PhoneOff className="h-5 w-5" />}
          {isSaving ? "Saving..." : "End Interview"}
        </Button>
      </div>
    </div>
  );
}
