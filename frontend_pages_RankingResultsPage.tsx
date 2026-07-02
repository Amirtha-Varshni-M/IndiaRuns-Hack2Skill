import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetRankingStatus, useGetRankingResults,
  getGetRankingStatusQueryKey, getGetRankingResultsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Trophy, AlertTriangle, Shield, ChevronDown, ChevronUp,
  Download, Loader2, CheckCircle2, XCircle, Minus
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from "recharts";

interface RankedCandidate {
  candidateId: number;
  name: string;
  finalScore: number;
  fitScore: number;
  robustnessScore: number;
  stabilityScore: number;
  ranking: number;
  isRobust: boolean;
  manipulationRisk: "low" | "medium" | "high";
  redFlags: Array<{ type: string; severity: string; details: string }>;
  skillsMatch: { matched: string[]; missing: string[]; extra: string[] };
  explanation: string;
  recommendation: "strong_hire" | "hire" | "consider" | "reject";
  strengths: string[];
  gaps: string[];
  adversarialTests: Array<{ perturbationType: string; originalRank: number; perturbedRank: number; positionChange: number }>;
}

function ScoreCell({ value }: { value: number }) {
  const cls = value >= 80 ? "text-emerald-400" : value >= 60 ? "text-amber-400" : "text-red-400";
  return <span className={`font-bold font-mono ${cls}`}>{value.toFixed(1)}</span>;
}

function RiskBadge({ risk }: { risk: "low" | "medium" | "high" }) {
  const map = {
    low: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    medium: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    high: "bg-red-400/10 text-red-400 border-red-400/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[risk]}`}>
      {risk === "low" ? "Low" : risk === "medium" ? "Medium" : "High"}
    </span>
  );
}

function RecommendationBadge({ rec }: { rec: string }) {
  const map: Record<string, string> = {
    strong_hire: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
    hire: "bg-green-400/15 text-green-400 border-green-400/30",
    consider: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    reject: "bg-red-400/15 text-red-400 border-red-400/30",
  };
  const labels: Record<string, string> = {
    strong_hire: "Strong Hire",
    hire: "Hire",
    consider: "Consider",
    reject: "Reject",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${map[rec] ?? map["consider"]}`}>
      {labels[rec] ?? rec}
    </span>
  );
}

function CandidateModal({ candidate, onClose }: { candidate: RankedCandidate; onClose: () => void }) {
  const [tab, setTab] = useState("profile");
  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "match", label: "Semantic Match" },
    { id: "adversarial", label: "Adversarial Tests" },
    { id: "flags", label: `Red Flags (${candidate.redFlags.length})` },
    { id: "verdict", label: "Verdict" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative w-full max-w-2xl bg-card border border-card-border rounded-xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
              #{candidate.ranking}
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">{candidate.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <RecommendationBadge rec={candidate.recommendation} />
                <RiskBadge risk={candidate.manipulationRisk} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Score Bar */}
        <div className="px-6 py-3 border-b border-border bg-muted/20 flex gap-6 flex-shrink-0">
          {[
            { label: "Final", value: candidate.finalScore },
            { label: "Fit", value: candidate.fitScore },
            { label: "Robustness", value: candidate.robustnessScore },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
              <ScoreCell value={value} />
            </div>
          ))}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-0.5">Robust</div>
            <span className={candidate.isRobust ? "text-emerald-400 font-bold text-sm" : "text-muted-foreground text-sm"}>
              {candidate.isRobust ? "Yes" : "No"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-2 flex-shrink-0 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "profile" && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Explanation</div>
                <p className="text-sm text-foreground">{candidate.explanation}</p>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Strengths</div>
                <ul className="space-y-1">
                  {candidate.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                  {candidate.strengths.length === 0 && <li className="text-sm text-muted-foreground">None identified</li>}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Gaps</div>
                <ul className="space-y-1">
                  {candidate.gaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <Minus className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      {g}
                    </li>
                  ))}
                  {candidate.gaps.length === 0 && <li className="text-sm text-muted-foreground">No significant gaps</li>}
                </ul>
              </div>
            </div>
          )}

          {tab === "match" && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                  Matched Skills ({candidate.skillsMatch.matched.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skillsMatch.matched.map(s => (
                    <span key={s} className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-xs font-mono">
                      <CheckCircle2 className="h-3 w-3" />{s}
                    </span>
                  ))}
                  {candidate.skillsMatch.matched.length === 0 && <span className="text-sm text-muted-foreground">None</span>}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
                  Missing Skills ({candidate.skillsMatch.missing.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skillsMatch.missing.map(s => (
                    <span key={s} className="flex items-center gap-1 px-2 py-1 rounded bg-red-400/10 text-red-400 border border-red-400/20 text-xs font-mono">
                      <XCircle className="h-3 w-3" />{s}
                    </span>
                  ))}
                  {candidate.skillsMatch.missing.length === 0 && <span className="text-sm text-muted-foreground">No missing skills</span>}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Extra Skills ({candidate.skillsMatch.extra.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skillsMatch.extra.map(s => (
                    <span key={s} className="px-2 py-1 rounded bg-muted text-muted-foreground border border-border text-xs font-mono">{s}</span>
                  ))}
                  {candidate.skillsMatch.extra.length === 0 && <span className="text-sm text-muted-foreground">None</span>}
                </div>
              </div>
            </div>
          )}

          {tab === "adversarial" && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Stress Test Results ({candidate.adversarialTests.length} variants)
              </div>
              {candidate.adversarialTests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stress tests applied</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-xs text-muted-foreground">Perturbation</th>
                      <th className="text-center py-2 text-xs text-muted-foreground">Original Rank</th>
                      <th className="text-center py-2 text-xs text-muted-foreground">After Test</th>
                      <th className="text-center py-2 text-xs text-muted-foreground">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {candidate.adversarialTests.map((t, i) => (
                      <tr key={i} className="hover:bg-accent/30">
                        <td className="py-2 text-foreground text-xs">
                          {t.perturbationType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </td>
                        <td className="py-2 text-center text-muted-foreground">#{t.originalRank}</td>
                        <td className="py-2 text-center text-muted-foreground">#{t.perturbedRank}</td>
                        <td className="py-2 text-center">
                          <span className={`font-mono font-bold text-xs ${t.positionChange > 2 ? "text-red-400" : t.positionChange > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                            {t.positionChange > 0 ? `+${t.positionChange}` : t.positionChange}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "flags" && (
            <div>
              {candidate.redFlags.length === 0 ? (
                <div className="text-center py-6">
                  <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">No red flags detected</p>
                  <p className="text-xs text-muted-foreground mt-1">This candidate passed all defense checks</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {candidate.redFlags.map((f, i) => {
                    const sev = f.severity as "low" | "medium" | "high";
                    const cls = { low: "border-blue-400/30 bg-blue-400/5", medium: "border-amber-400/30 bg-amber-400/5", high: "border-red-400/30 bg-red-400/5" }[sev];
                    const textCls = { low: "text-blue-400", medium: "text-amber-400", high: "text-red-400" }[sev];
                    return (
                      <div key={i} className={`border rounded-md p-3 ${cls}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground">{f.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                          <span className={`text-xs font-bold uppercase ${textCls}`}>{f.severity}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{f.details}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "verdict" && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                candidate.recommendation === "strong_hire" ? "bg-emerald-400/10 border-emerald-400/30" :
                candidate.recommendation === "hire" ? "bg-green-400/10 border-green-400/30" :
                candidate.recommendation === "consider" ? "bg-amber-400/10 border-amber-400/30" :
                "bg-red-400/10 border-red-400/30"
              }`}>
                <div className="text-lg font-bold text-foreground mb-1">
                  {candidate.recommendation === "strong_hire" ? "Strong Hire" :
                   candidate.recommendation === "hire" ? "Hire" :
                   candidate.recommendation === "consider" ? "Consider" : "Reject"}
                </div>
                <p className="text-sm text-muted-foreground">{candidate.explanation}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/30 rounded-md p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Final Score</div>
                  <ScoreCell value={candidate.finalScore} />
                </div>
                <div className="bg-muted/30 rounded-md p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Stability</div>
                  <span className="font-bold font-mono text-foreground">{(candidate.stabilityScore * 100).toFixed(0)}%</span>
                </div>
                <div className="bg-muted/30 rounded-md p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Risk Level</div>
                  <RiskBadge risk={candidate.manipulationRisk} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RankingResultsPage() {
  const { jobId: jobIdStr } = useParams<{ jobId: string }>();
  const jobId = parseInt(jobIdStr ?? "0");
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [selectedCandidate, setSelectedCandidate] = useState<RankedCandidate | null>(null);
  const [sortBy, setSortBy] = useState<"finalScore" | "fitScore" | "robustnessScore">("finalScore");
  const [filterRisk, setFilterRisk] = useState<"all" | "low" | "medium" | "high">("all");

  const { data: status } = useGetRankingStatus(jobId, {
    query: { enabled: !!jobId, queryKey: getGetRankingStatusQueryKey(jobId), refetchInterval: (q) => q.state.data?.status === "running" ? 2000 : false },
  });

  const { data: results, isLoading: resultsLoading } = useGetRankingResults(jobId, {
    query: { enabled: status?.status === "completed", queryKey: getGetRankingResultsQueryKey(jobId) },
  });

  const candidates = (results?.rankedCandidates ?? []) as RankedCandidate[];
  const filtered = candidates
    .filter(c => filterRisk === "all" || c.manipulationRisk === filterRisk)
    .sort((a, b) => b[sortBy] - a[sortBy]);

  function exportCSV() {
    const header = "Rank,Name,Final Score,Fit Score,Robustness,Manipulation Risk,Recommendation\n";
    const rows = candidates.map(c =>
      `${c.ranking},"${c.name}",${c.finalScore},${c.fitScore},${c.robustnessScore},${c.manipulationRisk},${c.recommendation}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ranking-${jobId}.csv`;
    a.click();
  }

  const scoreDistData = [
    { range: "0-20", count: candidates.filter(c => c.finalScore < 20).length },
    { range: "20-40", count: candidates.filter(c => c.finalScore >= 20 && c.finalScore < 40).length },
    { range: "40-60", count: candidates.filter(c => c.finalScore >= 40 && c.finalScore < 60).length },
    { range: "60-80", count: candidates.filter(c => c.finalScore >= 60 && c.finalScore < 80).length },
    { range: "80-100", count: candidates.filter(c => c.finalScore >= 80).length },
  ];

  const scatterData = candidates.map(c => ({ x: c.fitScore, y: c.robustnessScore, z: 60, name: c.name }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground text-sm">
          Dashboard
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm text-foreground font-medium">
          {status?.jobTitle ?? `Ranking #${jobId}`}
        </span>
      </div>

      {/* Status Banner */}
      {status?.status === "running" && (
        <div className="mb-6 bg-card border border-amber-400/20 rounded-lg p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">Adversarial analysis in progress...</div>
            <div className="w-full bg-muted rounded-full h-1 mt-2">
              <div className="bg-amber-400 h-1 rounded-full transition-all" style={{ width: `${status.progress}%` }} />
            </div>
          </div>
          <span className="text-sm font-mono text-amber-400">{status.progress}%</span>
        </div>
      )}

      {status?.status === "completed" && results && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total</div>
              <div className="text-2xl font-bold text-foreground">{results.summary.totalCandidates}</div>
            </div>
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Flagged</div>
              <div className="text-2xl font-bold text-red-400">{results.summary.flaggedForManipulation}</div>
            </div>
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Highly Robust</div>
              <div className="text-2xl font-bold text-emerald-400">{results.summary.highlyRobust}</div>
            </div>
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Avg Robustness</div>
              <div className="text-2xl font-bold text-primary">{results.summary.averageRobustness.toFixed(1)}</div>
            </div>
          </div>

          {/* Charts */}
          {candidates.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-4 mb-6">
              <div className="bg-card border border-card-border rounded-lg p-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Score Distribution</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={scoreDistData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 14% 18%)" />
                    <XAxis dataKey="range" tick={{ fill: "hsl(215 13% 55%)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(215 13% 55%)", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(215 22% 11%)", border: "1px solid hsl(215 14% 20%)", borderRadius: 6, color: "hsl(213 27% 90%)" }} />
                    <Bar dataKey="count" fill="hsl(34 100% 50%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card border border-card-border rounded-lg p-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Fit vs Robustness</div>
                <ResponsiveContainer width="100%" height={160}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 14% 18%)" />
                    <XAxis dataKey="x" name="Fit Score" tick={{ fill: "hsl(215 13% 55%)", fontSize: 11 }} label={{ value: "Fit", position: "insideBottom", offset: -2, fill: "hsl(215 13% 55%)", fontSize: 10 }} />
                    <YAxis dataKey="y" name="Robustness" tick={{ fill: "hsl(215 13% 55%)", fontSize: 11 }} />
                    <ZAxis range={[40, 40]} />
                    <Tooltip contentStyle={{ background: "hsl(215 22% 11%)", border: "1px solid hsl(215 14% 20%)", borderRadius: 6, color: "hsl(213 27% 90%)" }} />
                    <Scatter data={scatterData} fill="hsl(34 100% 50%)" fillOpacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Risk:</span>
                {(["all", "low", "medium", "high"] as const).map(r => (
                  <button key={r} onClick={() => setFilterRisk(r)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${filterRisk === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                    {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Sort:</span>
                {[
                  { key: "finalScore", label: "Final" },
                  { key: "fitScore", label: "Fit" },
                  { key: "robustnessScore", label: "Robust" },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => setSortBy(key as any)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${sortBy === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-md hover:bg-accent transition-colors">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>

          {/* Leaderboard */}
          <div className="bg-card border border-card-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Candidate</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Final</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fit</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Robust</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verdict</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.candidateId} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${c.ranking === 1 ? "text-primary" : "text-muted-foreground"}`}>
                        {c.ranking === 1 ? <Trophy className="h-4 w-4 text-primary inline" /> : `#${c.ranking}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-foreground">{c.name}</div>
                      {c.isRobust && (
                        <span className="text-xs text-emerald-400 font-medium">Robust</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center"><ScoreCell value={c.finalScore} /></td>
                    <td className="px-4 py-3 text-center"><ScoreCell value={c.fitScore} /></td>
                    <td className="px-4 py-3 text-center"><ScoreCell value={c.robustnessScore} /></td>
                    <td className="px-4 py-3 text-center"><RiskBadge risk={c.manipulationRisk} /></td>
                    <td className="px-4 py-3 text-center"><RecommendationBadge rec={c.recommendation} /></td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedCandidate(c)}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No candidates match the current filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {status?.status === "pending" && (
        <div className="text-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Initializing adversarial engine...</p>
        </div>
      )}

      {status?.status === "failed" && (
        <div className="text-center py-16">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <p className="text-sm font-medium text-foreground">Ranking failed</p>
          <p className="text-xs text-muted-foreground mt-1">An error occurred during analysis</p>
        </div>
      )}

      {selectedCandidate && (
        <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
      )}
    </div>
  );
}
