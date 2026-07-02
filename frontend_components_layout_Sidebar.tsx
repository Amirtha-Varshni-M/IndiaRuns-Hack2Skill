import { useLocation, Link } from "wouter";
import {
  LayoutDashboard, Users, FileText, BarChart3, Settings,
  LogOut, Shield, X, ChevronRight
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { clearToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Job Descriptions", icon: FileText },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const [location, navigate] = useLocation();
  const logout = useLogout();

  function handleLogout() {
    logout.mutate(undefined as unknown as void, {
      onSettled: () => {
        clearToken();
        navigate("/login");
      },
    });
  }

  return (
    <div className="flex flex-col h-full w-64 bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
        <div>
          <div className="text-xs font-bold tracking-widest text-primary mb-0.5">INDIA.RUNS</div>
          <div className="text-[10px] tracking-widest text-muted-foreground font-medium uppercase">
            Adversarial Ranking
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {onClose && (
            <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground p-1">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="text-[10px] font-semibold tracking-widest text-muted-foreground px-2 mb-3 uppercase">
          Navigation
        </div>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 group relative",
                active
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-sidebar-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {label}
              {active && (
                <ChevronRight className="h-3 w-3 ml-auto text-primary/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* System status */}
      <div className="mx-3 mb-3 p-3 rounded-md bg-card border border-border">
        <div className="flex items-center gap-2 mb-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">System Status</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Adversary Engine</span>
          <span className="text-emerald-400 font-medium">Active</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-muted-foreground">Defense Layer</span>
          <span className="text-emerald-400 font-medium">Active</span>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
