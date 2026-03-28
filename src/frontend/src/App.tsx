import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";

const queryClient = new QueryClient();

function AppInner() {
  const { isLoggedIn, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-blue flex items-center justify-center">
            <span className="text-white font-bold text-xl">I</span>
          </div>
          <p className="text-muted-foreground text-sm">Loading Infinexy...</p>
        </div>
      </div>
    );
  }

  return isLoggedIn ? <DashboardPage /> : <AuthPage />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppInner />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
