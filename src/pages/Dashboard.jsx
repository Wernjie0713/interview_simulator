import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { interviewService } from "@/services/interviewService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, History, TrendingUp, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  
  const getOrdinalSuffix = (n) => {
    const j = n % 10,
        k = n % 100;
    if (j === 1 && k !== 11) {
        return "st";
    }
    if (j === 2 && k !== 12) {
        return "nd";
    }
    if (j === 3 && k !== 13) {
        return "rd";
    }
    return "th";
  };

  return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchInterviews = async () => {
        try {
          const data = await interviewService.getUserInterviews(user.uid);
          setInterviews(data);
        } catch (error) {
          console.error("Failed to fetch interviews", error);
        } finally {
          setLoading(false);
        }
      };
      fetchInterviews();
    }
  }, [user]);

  const stats = {
    total: interviews.length,
    avgScore: interviews.length > 0 
      ? Math.round(interviews.reduce((acc, curr) => acc + (curr.score || 0), 0) / interviews.length) 
      : 0,
    bestScore: interviews.length > 0 
      ? Math.max(...interviews.map(i => i.score || 0)) 
      : 0
  };

  return (
    <div className="container py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your interview sessions and track your progress.</p>
        </div>
        <Button onClick={() => navigate("/interview/new")} className="gap-2">
          <Plus className="h-4 w-4" /> New Interview
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Lifetime sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore}%</div>
            <p className="text-xs text-muted-foreground">Based on all sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bestScore}%</div>
            <p className="text-xs text-muted-foreground">Your personal record</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Loading interviews...</div>
          ) : interviews.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">No interviews found. Start your first one!</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interviews.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell className="font-medium capitalize">{interview.type}</TableCell>
                    <TableCell>{formatDate(interview.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{interview.score || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={interview.status === "Completed" ? "secondary" : "outline"}>
                        {interview.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/report/${interview.id}`)}>
                        View Report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
