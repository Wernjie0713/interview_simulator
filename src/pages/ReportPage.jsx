import { useState, useEffect } from "react";
import { interviewService } from "@/services/interviewService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Share2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await interviewService.getInterviewReport(id);
        setReport(data);
      } catch (error) {
        console.error("Failed to fetch report", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return <div className="container py-20 text-center text-muted-foreground">Loading report...</div>;
  }

  if (!report) {
    return <div className="container py-20 text-center text-muted-foreground">Report not found.</div>;
  }

  const FEEDBACK_ITEMS = report.feedback || [
    { time: "0:15", type: "positive", text: "Strong opening and clear introduction of your background." },
    { time: "0:45", type: "warning", text: "You looked down and touched your face—this signals low confidence." },
    { time: "1:20", type: "info", text: "Speaking pace was 180 words/minute (a bit fast). Try to slow down." },
    { time: "2:10", type: "positive", text: "Excellent eye contact while explaining the technical challenge." },
    { time: "3:05", type: "warning", text: "Avoid using filler words like 'um' and 'like' during complex explanations." },
  ];

  return (
    <div className="container py-10 space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Interview Summary</CardTitle>
                <CardDescription className="capitalize">{report.type} Interview • {report.date || "N/A"}</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{report.score || 0}%</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Overall Score</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confidence & Body Language</span>
                <span className="font-medium">{report.confidenceScore || 0}%</span>
              </div>
              <Progress value={report.confidenceScore || 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Speech Clarity & Pace</span>
                <span className="font-medium">{report.clarityScore || 0}%</span>
              </div>
              <Progress value={report.clarityScore || 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Answer Quality (Gemini)</span>
                <span className="font-medium">{report.answerScore || 0}%</span>
              </div>
              <Progress value={report.answerScore || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm">Great smile during the introduction.</p>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <p className="text-sm">Fidgeting detected at 0:45.</p>
            </div>
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <p className="text-sm">Maintain more consistent eye contact.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="timeline">Feedback Timeline</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="mt-6">
          <Card>
            <ScrollArea className="h-[400px] p-6">
              <div className="space-y-8">
                {FEEDBACK_ITEMS.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                        {item.time}
                      </div>
                      {index !== FEEDBACK_ITEMS.length - 1 && (
                        <Separator orientation="vertical" className="flex-1 my-2" />
                      )}
                    </div>
                    <div className="space-y-1 pb-4">
                      <div className="flex items-center gap-2">
                        {item.type === "positive" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {item.type === "warning" && <AlertCircle className="h-4 w-4 text-amber-500" />}
                        {item.type === "info" && <Info className="h-4 w-4 text-blue-500" />}
                        <span className="text-sm font-semibold capitalize">{item.type} Feedback</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
        <TabsContent value="transcript" className="mt-6">
          <Card>
            <ScrollArea className="h-[400px] p-6">
              <div className="space-y-4 text-sm leading-relaxed">
                {report.transcript ? (
                  <p className="whitespace-pre-wrap">{report.transcript}</p>
                ) : (
                  <p className="text-muted-foreground italic">No transcript available for this session.</p>
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
