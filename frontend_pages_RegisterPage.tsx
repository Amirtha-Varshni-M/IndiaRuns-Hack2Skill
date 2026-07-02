import { useState } from "react";
import { useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { setToken, setStoredUser } from "@/lib/auth";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ email: "", password: "", fullName: "", company: "" });
  const register = useRegister();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    register.mutate(
      { data: form },
      {
        onSuccess: (data) => {
          setToken(data.token);
          setStoredUser(data.user as unknown as Record<string, unknown>);
          toast.success("Workspace created");
          navigate("/");
        },
        onError: () => toast.error("Registration failed. Email may already be in use."),
      }
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div className="text-xs font-bold tracking-widest text-primary mb-1">INDIA.RUNS</div>
          <h1 className="text-xl font-bold text-foreground">Create Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up your hiring intelligence platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-card border border-card-border rounded-lg p-6 space-y-4">
            {[
              { key: "fullName", label: "Full Name", type: "text", placeholder: "Riya Sharma" },
              { key: "company", label: "Company", type: "text", placeholder: "Acme Corp" },
              { key: "email", label: "Email Address", type: "email", placeholder: "riya@company.com" },
              { key: "password", label: "Password", type: "password", placeholder: "••••••••" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  required
                  placeholder={placeholder}
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={register.isPending}
              className="w-full bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {register.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Workspace
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline font-medium">Sign in</a>
        </p>
      </div>
    </div>
  );
}
