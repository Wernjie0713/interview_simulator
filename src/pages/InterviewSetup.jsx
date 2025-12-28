import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { interviewService } from "@/services/interviewService";
import { geminiService } from "@/services/geminiService";
import { extractTextFromPDF } from "@/lib/pdfUtils";
import { CheckCircle2, FileText } from "lucide-react";

export default function InterviewSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analyzingCV, setAnalyzingCV] = useState(false);
  const [cvSummary, setCvSummary] = useState(null);
  const [cvFileName, setCvFileName] = useState("");
  const [type, setType] = useState("general");
  const [difficulty, setDifficulty] = useState("medium");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }

    setCvFileName(file.name);
    setAnalyzingCV(true);

    try {
      const text = await extractTextFromPDF(file);
      const summary = await geminiService.analyzeCV(text);
      setCvSummary(summary);
    } catch (error) {
      console.error("Error processing CV:", error);
      alert("Failed to process CV. Please try again.");
      setCvFileName("");
    } finally {
      setAnalyzingCV(false);
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const interviewId = await interviewService.createInterview(user.uid, {
        type,
        difficulty,
        cvSummary, // Pass the analyzed CV context
      });
      navigate(`/interview/${interviewId}`);
    } catch (error) {
      console.error("Failed to create interview", error);
      alert("Error starting interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Configure Your Interview</CardTitle>
          <CardDescription>
            Set your preferences and upload your CV to help the AI tailor the questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStart} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Interview Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Behavioral</SelectItem>
                  <SelectItem value="phone">Phone Screen</SelectItem>
                  <SelectItem value="coding">Technical/Coding</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy (Entry Level)</SelectItem>
                  <SelectItem value="medium">Medium (Mid Level)</SelectItem>
                  <SelectItem value="hard">Hard (Senior Level)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cv">Upload CV (Optional)</Label>
              <div className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition-colors ${
                cvSummary ? "bg-green-50 border-green-200" : "bg-muted/30 hover:bg-muted/50 cursor-pointer"
              }`}>
                {analyzingCV ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Analyzing your CV...</p>
                  </>
                ) : cvSummary ? (
                  <>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                    <p className="text-sm font-medium text-green-700">CV Analyzed Successfully</p>
                    <p className="text-xs text-muted-foreground">{cvFileName}</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-xs h-auto p-0 text-red-500"
                      onClick={(e) => {
                        e.preventDefault();
                        setCvSummary(null);
                        setCvFileName("");
                      }}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <label htmlFor="cv" className="flex flex-col items-center cursor-pointer w-full h-full">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Drag and drop or click to upload PDF</p>
                    <Input 
                      id="cv" 
                      type="file" 
                      accept=".pdf"
                      className="hidden" 
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Start Interview Room"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
