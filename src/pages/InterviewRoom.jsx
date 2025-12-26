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

  // Start interview logic
  useEffect(() => {
    if (!isMediaPipeLoading && isInterviewing) {
      const startInterview = async () => {
        setIsThinking(true);
        try {
          const question = await geminiService.getInterviewQuestion("General behavioral interview for a software engineer role.");
          setCurrentQuestion(question);
          setIsThinking(false);
          setIsAISpeaking(true);
          await ttsService.speak(question);
          setIsAISpeaking(false);
          startListening();
        } catch (err) {
          console.error("Failed to start interview:", err);
          setIsThinking(false);
        }
      };
      startInterview();
    }
  }, [isMediaPipeLoading]);

  // Handle follow-up questions
  const handleNextQuestion = useCallback(async () => {
    stopListening();
    setIsThinking(true);
    
    const expression = getExpression();
    const userMessage = transcript.trim() || "[User skipped or provided no verbal answer]";
    const context = `User response: "${userMessage}". Their expression was ${expression}. Ask a relevant follow-up question or continue the interview.`;
    
    try {
      const nextQuestion = await geminiService.getInterviewQuestion(context);
      setCurrentQuestion(nextQuestion);
      setIsThinking(false);
      setTranscript("");
      
      setIsAISpeaking(true);
      await ttsService.speak(nextQuestion);
      setIsAISpeaking(false);
      
      // Small delay to ensure STT doesn't pick up the end of the AI's voice
      setTimeout(() => {
        startListening();
      }, 500);
    } catch (err) {
      console.error("Failed to get follow-up:", err);
      setIsThinking(false);
      // Fallback to keep the interview moving
      setCurrentQuestion("Tell me more about your experience with that.");
      startListening();
    }
  }, [transcript, stopListening, startListening, setTranscript]);

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
    const smile = blendshapes.find(b => b.categoryName === "mouthSmileLeft")?.score || 0;
    const frown = blendshapes.find(b => b.categoryName === "browDownLeft")?.score || 0;
    
    if (smile > 0.5) return "Smiling";
    if (frown > 0.3) return "Serious/Frowning";
    return "Neutral";
  };

  const handleEndCall = async () => {
    stopListening();
    setIsInterviewing(false);
    setIsSaving(true);
    
    try {
      await interviewService.updateInterview(id, {
        score: 82,
        confidenceScore: 75,
        clarityScore: 88,
        answerScore: 84,
        transcript: "AI: " + currentQuestion + "\nYou: " + transcript,
        feedback: [
          { time: "0:10", type: "positive", text: "Great eye contact during the start." },
          { time: "0:30", type: "info", text: "Try to vary your pitch more." }
        ]
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
        <div className="absolute bottom-10 right-10 w-72 bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Sparkles className={cn("h-5 w-5 text-primary", (isThinking || isAISpeaking) && "animate-pulse")} />
                  {isAISpeaking && (
                    <div className="absolute -top-1 -right-1">
                      <div className="h-2 w-2 bg-primary rounded-full animate-ping" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">AI Interviewer</span>
              </div>
              {isAISpeaking && <Volume2 className="h-4 w-4 text-primary animate-bounce" />}
            </div>
            
            <div className="text-sm text-zinc-200 leading-relaxed min-h-[60px]">
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
