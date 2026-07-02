import { useState, useEffect } from "react";
import {
  useGetAdversaryConfig, useGetPerturbationTypes, useUpdateAdversaryConfig,
  getGetAdversaryConfigQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Settings, Loader2, Save, Shield, Zap } from "lucide-react";

export default function AdminPage() {
  const qc = useQueryClient();
  const { data: config, isLoading: configLoading } = useGetAdversaryConfig();
  const { data: perturbationTypes } = useGetPerturbationTypes();
  const updateConfig = useUpdateAdversaryConfig();

  const [numVariants, setNumVariants] = useState(5);
  const [intensity, setIntensity] = useState<"low" | "medium" | "high">("medium");
  const [enabledPerturbations, setEnabledPerturbations] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (config) {
      setNumVariants(config.numVariants);
      setIntensity(config.intensity as "low" | "medium" | "high");
      setEnabledPerturbations((config.enabledPerturbations as string[]) ?? []);
    }
  }, [config]);

  function togglePerturbation(key: string) {
    setEnabledPerturbations(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    setIsDirty(true);
  }

  function handleSave() {
    updateConfig.mutate(
      { data: { numVariants, intensity, enabledPerturbations } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetAdversaryConfigQueryKey() });
          toast.success("Configuration saved");
          setIsDirty(false);
        },
        onError: () => toast.error("Failed to save configuration"),
      }
    );
  }

  const intensityColors = {
    low: "bg-emerald-400/10 text-emerald-400 border-emerald-400/30",
    medium: "bg-amber-400/10 text-amber-400 border-amber-400/30",
    high: "bg-red-400/10 text-red-400 border-red-400/30",
  };

  if (configLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure adversary engine and system settings</p>
        </div>
        {isDirty && (
          <button
            onClick={handleSave}
            disabled={updateConfig.isPending}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {updateConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Adversary Configuration */}
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Adversary Engine Configuration</h2>
          </div>
          <div className="p-5 space-y-6">
            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Number of Variants</label>
                  <p className="text-xs text-muted-foreground mt-0.5">Stress tests generated per candidate</p>
                </div>
                <span className="text-2xl font-bold text-primary font-mono">{numVariants}</span>
              </div>
              <input
                type="range" min={3} max={10} value={numVariants}
                onChange={e => { setNumVariants(parseInt(e.target.value)); setIsDirty(true); }}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>3 (Fast)</span>
                <span>10 (Thorough)</span>
              </div>
            </div>

            {/* Intensity */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Perturbation Intensity</label>
              <p className="text-xs text-muted-foreground mb-3">How aggressively to modify candidate profiles</p>
              <div className="flex gap-3">
                {(["low", "medium", "high"] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => { setIntensity(level); setIsDirty(true); }}
                    className={`flex-1 py-2.5 rounded-md text-sm font-semibold border transition-colors ${
                      intensity === level
                        ? intensityColors[level]
                        : "bg-muted/30 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Perturbation Types */}
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Perturbation Types</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {enabledPerturbations.length} / {perturbationTypes?.length ?? 0} active
            </span>
          </div>
          <div className="p-5">
            <div className="grid sm:grid-cols-2 gap-3">
              {(perturbationTypes ?? []).map((p) => {
                const enabled = enabledPerturbations.includes(p.key);
                return (
                  <button
                    key={p.key}
                    onClick={() => togglePerturbation(p.key)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      enabled
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-muted/20 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{p.label}</span>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${enabled ? "bg-primary border-primary" : "border-border"}`}>
                        {enabled && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">System Status</h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: "Adversary Engine", status: "Operational" },
              { label: "Keyword Defense Layer", status: "Operational" },
              { label: "Stability Analyzer", status: "Operational" },
              { label: "Explainability Engine", status: "Operational" },
              { label: "Prompt Injection Detector", status: "Operational" },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm text-foreground">{label}</span>
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isDirty && (
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={updateConfig.isPending}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {updateConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Configuration
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
