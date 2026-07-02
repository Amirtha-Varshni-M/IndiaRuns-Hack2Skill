import { useState } from "react";
import { useLocation } from "wouter";
import {
  useGetDashboardStats, useListJobs, useListCandidates,
  useCreateJob, useCreateCandidate, useStartRanking,
  getGetDashboardStatsQueryKey, getListJobsQueryKey, getListCandidatesQueryKey,
  getGetRankingHistoryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users, FileText, Trophy, AlertTriangle, ChevronRight,
  Upload, Play, Loader2, Clock, CheckCircle2, XCircle, Activity
} from "lucide-react";

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={`p-1.5 rounded-md ${color}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    completed: { label: "Completed", cls: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle2 },
    running: { label: "Running", cls: "text-amber-400 bg-amber-400/10", icon: Loader2 },
    pending: { label: "Pending", cls: "text-blue-400 bg-blue-400/10", icon: Clock },
    failed: { label: "Failed", cls: "text-red-400 bg-red-400/10", icon: XCircle },
  };
  const s = map[status] ?? map["pending"]!;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>
      <s.icon className={`h-3 w-3 ${status === "running" ? "animate-spin" : ""}`} />
      {s.label}
    </span>
  );
}

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: jobs } = useListJobs();
  const { data: candidates } = useListCandidates();

  const createJob = useCreateJob();
  const createCandidate = useCreateCandidate();
  const startRanking = useStartRanking();

  const [jdText, setJdText] = useState("");
  const [jdTitle, setJdTitle] = useState("");
  const [candidatesText, setCandidatesText] = useState("");
  const [step, setStep] = useState<"idle" | "jd" | "candidates" | "running">("idle");
  const [progress, setProgress] = useState(0);

  async function handleStartRanking() {
    if (!jdTitle.trim() || !jdText.trim()) {
      toast.error("Please enter a job title and description");
      return;
    }
    if (!candidatesText.trim()) {
      toast.error("Please enter at least one candidate resume");
      return;
    }

    setStep("running");
    setProgress(20);

    try {
      // Create JD
      const jd = await new Promise<{ id: number }>((resolve, reject) => {
        createJob.mutate(
          { data: { title: jdTitle, rawText: jdText, skillsRequired: [] } },
          { onSuccess: resolve, onError: reject }
        );
      });
      setProgress(40);

      // Parse candidates (split by "---" separator or create single)
      const blocks = candidatesText.split(/\n---\n/).map(b => b.trim()).filter(Boolean);
      const createdCandidates: { id: number }[] = [];

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]!;
        const nameMatch = block.match(/^(?:name:\s*)?([^\n]+)/i);
        const name = nameMatch?.[1]?.trim() ?? `Candidate ${i + 1}`;
        const c = await new Promise<{ id: number }>((resolve, reject) => {
          createCandidate.mutate(
            { data: { name, rawText: block, skills: [] } },
            { onSuccess: resolve, onError: reject }
          );
        });
        createdCandidates.push(c);
        setProgress(40 + Math.round((i / blocks.length) * 30));
      }

      setProgress(80);
      // Start ranking
      const ranking = await new Promise<{ id: number }>((resolve, reject) => {
        startRanking.mutate(
          { data: { jdId: jd.id, candidateIds: createdCandidates.map(c => c.id) } },
          { onSuccess: resolve, onError: reject }
        );
      });

      setProgress(100);
      await qc.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      await qc.invalidateQueries({ queryKey: getGetRankingHistoryQueryKey() });

      toast.success("Ranking started");
      navigate(`/ranking/${ranking.id}`);
    } catch {
      toast.error("Failed to start ranking");
      setStep("idle");
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Adversarial stress-testing for defensible hiring decisions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-lg p-4 animate-pulse h-20" />
          ))
        ) : (
          <>
            <StatCard label="Total Candidates" value={stats?.totalCandidates ?? 0} icon={Users} color="bg-blue-400/10 text-blue-400" />
            <StatCard label="Flagged Profiles" value={stats?.flaggedProfiles ?? 0} icon={AlertTriangle} color="bg-red-400/10 text-red-400" />
            <StatCard label="Highly Robust" value={stats?.highlyRobust ?? 0} icon={Trophy} color="bg-emerald-400/10 text-emerald-400" />
            <StatCard label="Avg Score" value={`${stats?.averageScore?.toFixed(1) ?? 0}`} icon={Activity} color="bg-primary/10 text-primary" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* New Ranking Panel */}
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">New Adversarial Ranking</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Stress-test candidates against a job description</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {step === "running" ? (
              <div className="py-8 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-sm font-medium text-foreground mb-2">Running adversarial analysis...</p>
                <div className="w-full bg-muted rounded-full h-1.5 mt-4">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{progress}% complete</p>
              </div>
            ) : (
              <>
                {/* Job Description Input */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={jdTitle}
                    onChange={e => setJdTitle(e.target.value)}
                    placeholder="e.g. Senior Python Developer"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Job Description
                    </label>
                    <span className="text-xs text-muted-foreground">Paste JD text</span>
                  </div>
                  <div className="border border-border rounded-md bg-background overflow-hidden">
                    <textarea
                      value={jdText}
                      onChange={e => setJdText(e.target.value)}
                      placeholder="Paste job description here: required skills, experience, responsibilities..."
                      rows={4}
                      className="w-full bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                    />
                    <div className="px-3 py-2 bg-muted/30 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                      <Upload className="h-3 w-3" />
                      Paste raw text or copy from your JD document
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Candidate Resumes
                    </label>
                    <span className="text-xs text-muted-foreground">Separate with ---</span>
                  </div>
                  <div className="border border-border rounded-md bg-background overflow-hidden">
                    <textarea
                      value={candidatesText}
                      onChange={e => setCandidatesText(e.target.value)}
                      placeholder={`Candidate 1 resume text here...\n\n---\n\nCandidate 2 resume text here...`}
                      rows={5}
                      className="w-full bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                    />
                    <div className="px-3 py-2 bg-muted/30 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Paste multiple resumes separated by --- on its own line
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleStartRanking}
                  className="w-full bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 glow-amber"
                >
                  <Play className="h-4 w-4" />
                  Start Adversarial Ranking
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recent Rankings */}
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Recent Rankings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Click to view results</p>
            </div>
            <button onClick={() => navigate("/analytics")} className="text-xs text-primary hover:underline">
              View all
            </button>
          </div>
          <div className="divide-y divide-border">
            {!stats?.recentRankings || stats.recentRankings.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Trophy className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No rankings yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Run your first adversarial ranking above</p>
              </div>
            ) : (
              stats.recentRankings.map((job) => (
                <button
                  key={job.id}
                  onClick={() => navigate(`/ranking/${job.id}`)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-accent transition-colors text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {job.jobTitle ?? `Ranking #${job.id}`}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={job.status} />
                      <span className="text-xs text-muted-foreground">
                        {job.totalCandidates} candidates
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
