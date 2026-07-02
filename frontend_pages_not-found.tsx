import { useLocation } from "wouter";
import { Home } from "lucide-react";

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl font-bold text-primary font-mono mb-4">404</div>
        <h1 className="text-xl font-bold text-foreground mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-6">This page doesn't exist in the system.</p>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 mx-auto bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
