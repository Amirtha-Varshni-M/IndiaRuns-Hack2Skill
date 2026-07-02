import { useState } from "react";
import {
  useListCandidates, useCreateCandidate, useDeleteCandidate,
  getListCandidatesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, User, X, Loader2, BookOpen } from "lucide-react";

function SkillBadge({ skill }: { skill: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-muted text-muted-foreground border border-border">
      {skill}
    </span>
  );
}

export default function CandidatesPage() {
  const qc = useQueryClient();
  const { data: candidates, isLoading } = useListCandidates();
  const createCandidate = useCreateCandidate();
  const deleteCandidate = useDeleteCandidate();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", rawText: "", experienceYears: "", education: "", skills: "" });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    createCandidate.mutate(
      {
        data: {
          name: form.name,
          email: form.email || undefined,
          rawText: form.rawText,
          experienceYears: form.experienceYears ? parseInt(form.experienceYears) : undefined,
          education: form.education || undefined,
          skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListCandidatesQueryKey() });
          toast.success("Candidate added");
          setShowAdd(false);
          setForm({ name: "", email: "", rawText: "", experienceYears: "", education: "", skills: "" });
        },
        onError: () => toast.error("Failed to add candidate"),
      }
    );
  }

  function handleDelete(id: number, name: string) {
    deleteCandidate.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListCandidatesQueryKey() });
          toast.success(`Removed ${name}`);
        },
        onError: () => toast.error("Failed to delete"),
      }
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {candidates?.length ?? 0} profiles in database
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Candidate
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="mb-6 bg-card border border-card-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Add New Candidate</h3>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Experience (years)</label>
                <input type="number" value={form.experienceYears} onChange={e => setForm(f => ({ ...f, experienceYears: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="5" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Education</label>
                <input value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="B.Tech Computer Science" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Skills (comma-separated)</label>
              <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Python, Django, AWS, Docker" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Resume Text *</label>
              <textarea required value={form.rawText} onChange={e => setForm(f => ({ ...f, rawText: e.target.value }))} rows={5}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                placeholder="Paste full resume text here..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createCandidate.isPending}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {createCandidate.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Add Candidate
              </button>
              <button type="button" onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-lg h-16 animate-pulse" />
          ))}
        </div>
      ) : !candidates?.length ? (
        <div className="bg-card border border-card-border rounded-lg py-16 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No candidates yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add candidates to run adversarial rankings</p>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Candidate</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skills</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Experience</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Education</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {candidates.map((c) => (
                <tr key={c.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{c.name}</div>
                        {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(c.skills as string[]).slice(0, 3).map(s => <SkillBadge key={s} skill={s} />)}
                      {(c.skills as string[]).length > 3 && (
                        <span className="text-xs text-muted-foreground">+{(c.skills as string[]).length - 3}</span>
                      )}
                      {(c.skills as string[]).length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-foreground">
                    {c.experienceYears != null ? `${c.experienceYears} yrs` : "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground truncate max-w-[180px]">
                    {c.education ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
