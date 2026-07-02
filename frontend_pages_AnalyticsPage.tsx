import {
  useGetDashboardStats, useGetRankingTrends, useGetManipulationStats
} from "@workspace/api-client-react";
import { Loader2, BarChart3, TrendingUp, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const COLORS = ["hsl(34 100% 50%)", "hsl(142 71% 45%)", "hsl(221 83% 53%)", "hsl(0 72% 51%)"];

export default function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: trends, isLoading: trendsLoading } = useGetRankingTrends();
  const { data: manipulation, isLoading: manipLoading } = useGetManipulationStats();

  const manipPieData = manipulation
    ? [
        { name: "Keyword Stuffing", value: manipulation.keywordStuffing },
        { name: "Experience Inflation", value: manipulation.experienceInflation },
        { name: "Prompt Injection", value: manipulation.promptInjection },
        { name: "Irrelevant Skills", value: manipulation.irrelevantSkills },
      ].filter(d => d.value > 0)
    : [];

  const recoData = stats
    ? [
        { name: "Strong Hire", value: Math.round((stats.highlyRobust / Math.max(stats.totalCandidates, 1)) * 100) },
        { name: "Consider/Hire", value: Math.round(((stats.totalCandidates - stats.highlyRobust - stats.flaggedProfiles) / Math.max(stats.totalCandidates, 1)) * 100) },
        { name: "Flagged", value: Math.round((stats.flaggedProfiles / Math.max(stats.totalCandidates, 1)) * 100) },
      ]
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Intelligence overview across all rankings</p>
      </div>

      {/* Summary KPIs */}
      {statsLoading ? (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-lg h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total Rankings</div>
            <div className="text-2xl font-bold text-foreground">{stats?.totalRankings ?? 0}</div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total Candidates</div>
            <div className="text-2xl font-bold text-foreground">{stats?.totalCandidates ?? 0}</div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Flagged Rate</div>
            <div className="text-2xl font-bold text-red-400">
              {stats?.totalCandidates ? Math.round((stats.flaggedProfiles / stats.totalCandidates) * 100) : 0}%
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Avg Score</div>
            <div className="text-2xl font-bold text-primary">{stats?.averageScore?.toFixed(1) ?? "—"}</div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Trends Chart */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Ranking Trends</h2>
          </div>
          {trendsLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trends ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 14% 18%)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(215 13% 55%)", fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fill: "hsl(215 13% 55%)", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(215 22% 11%)", border: "1px solid hsl(215 14% 20%)", borderRadius: 6, color: "hsl(213 27% 90%)" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="totalRankings" stroke="hsl(34 100% 50%)" strokeWidth={2} dot={false} name="Rankings" />
                <Line type="monotone" dataKey="flaggedCount" stroke="hsl(0 72% 51%)" strokeWidth={2} dot={false} name="Flagged" />
                <Line type="monotone" dataKey="robustCount" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} name="Robust" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Manipulation Detection */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Manipulation Detection</h2>
          </div>
          {manipLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : manipPieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No manipulation detected yet</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={manipPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {manipPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(215 22% 11%)", border: "1px solid hsl(215 14% 20%)", borderRadius: 6, color: "hsl(213 27% 90%)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Average Score Trend */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Average Score Over Time</h2>
          </div>
          {trendsLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trends ?? []} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 14% 18%)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(215 13% 55%)", fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(215 13% 55%)", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(215 22% 11%)", border: "1px solid hsl(215 14% 20%)", borderRadius: 6, color: "hsl(213 27% 90%)" }} />
                <Bar dataKey="averageScore" fill="hsl(34 100% 50%)" radius={[3, 3, 0, 0]} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recommendation Distribution */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Recommendation Distribution</h2>
          </div>
          {statsLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={recoData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 14% 18%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(215 13% 55%)", fontSize: 11 }} />
                <YAxis unit="%" tick={{ fill: "hsl(215 13% 55%)", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(215 22% 11%)", border: "1px solid hsl(215 14% 20%)", borderRadius: 6, color: "hsl(213 27% 90%)" }} />
                <Bar dataKey="value" fill="hsl(34 100% 50%)" radius={[3, 3, 0, 0]} name="%" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
