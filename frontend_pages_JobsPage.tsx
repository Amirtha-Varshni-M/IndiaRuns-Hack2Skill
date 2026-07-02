import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListJobs, useListCandidates, useCreateJob, useDeleteJob, useStartRanking,
  getListJobsQueryKey, getGetRankingHistoryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, FileText, X, Loader2, Play, ChevronRight } from "lucide-react";

export default function JobsPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { data: jobs, isLoading } = useListJobs();
  const { data: candidates } = useListCandidates();
  const createJob = useCreateJob();
  const deleteJob = useDeleteJob();
  const startRanking = useStartRanking();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", department: "", experienceRequired: "", skills: "", rawText: "" });
  const [starting, setStarting] = useState<number | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    createJob.mutate(
      {
        data: {
          title: form.title,
          department: form.department || undefined,
          experienceRequired: form.experienceRequired ? parseInt(form.experienceRequired) : undefined,
          skillsRequired: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
          rawText: form.rawText,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListJobsQueryKey() });
          toast.success("Job description created");
          setShowAdd(false);
          setForm({ title: "", department: "", experienceRequired: "", skills: "", rawText: "" });
        },
        onError: () => toast.error("Failed to create JD"),
      }
    );
  }

  async function handleStartRanking(jobId: number) {
    const allCandidateIds = (candidates ?? []).map(c => c.id);
    if (allCandidateIds.length === 0) {
      toast.error("No candidates in database. Add candidates first.");
      return;
    }
    setStarting(jobId);
    startRanking.mutate(
      { data: { jdId: jobId, candidateIds: allCandidateIds } },
      {
        onSuccess: (job) => {
          qc.invalidateQueries({ queryKey: getGetRankingHistoryQueryKey() });
          toast.success("Ranking started");
          navigate(`/ranking/${job.id}`);
        },
        onError: () => { toast.error("Failed to start ranking"); setStarting(null); },
      }
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job Descriptions</h1>
          <p className="text-sm text-muted-foreground mt-1">{jobs?.length ?? 0} positions defined</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Position
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 bg-card border border-card-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">New Job Description</h3>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Job Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Senior Python Developer" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Department</label>
                <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Engineering" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Min Experience (yrs)</label>
                <input type="number" value={form.experienceRequired} onChange={e => setForm(f => ({ ...f, experienceRequired: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="5" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Required Skills</label>
              <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Python, Django, AWS, PostgreSQL, Docker" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Full Job Description *</label>
              <textarea required value={form.rawText} onChange={e => setForm(f => ({ ...f, rawText: e.target.value }))} rows={5}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                placeholder="We are looking for a Senior Python Developer with 5+ years of experience..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createJob.isPending}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {createJob.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create JD
              </button>
              <button type="button" onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-lg h-24 animate-pulse" />
          ))}
        </div>
      ) : !jobs?.length ? (
        <div className="bg-card border border-card-border rounded-lg py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No job descriptions yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create a JD to start running adversarial rankings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-card border border-card-border rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-foreground">{job.title}</h3>
                    {job.department && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{job.department}</span>
                    )}
                    {job.experienceRequired != null && (
                      <span className="text-xs text-muted-foreground">{job.experienceRequired}+ yrs</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(job.skillsRequired as string[]).slice(0, 6).map(s => (
                      <span key={s} className="text-xs font-mono bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded">{s}</span>
                    ))}
                    {(job.skillsRequired as string[]).length > 6 && (
                      <span className="text-xs text-muted-foreground">+{(job.skillsRequired as string[]).length - 6} more</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{job.rawText}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleStartRanking(job.id)}
                    disabled={starting === job.id}
                    className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-primary/20 disabled:opacity-50 transition-colors"
                  >
                    {starting === job.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    Rank All
                  </button>
                  <button
                    onClick={() => { deleteJob.mutate({ id: job.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListJobsQueryKey() }); toast.success("Deleted"); } }); }}
                    className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
