import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabaseClient.js";
import LandingPage from "./routes/LandingPage.jsx";
import Dashboard from "./routes/Dashboard.jsx";
import ResetPassword from "./routes/ResetPassword.jsx";

function ProtectedRoute({ session, isLoading, children }) {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-400">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialStateReceived = false;

    // Set up auth state listener FIRST, before checking session
    // This ensures OAuth callbacks are properly handled
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', { event, hasSession: !!session, email: session?.user?.email });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Mark that we've received the initial state
      if (!initialStateReceived) {
        initialStateReceived = true;
        console.log('Initial auth state received, loading complete');
        // Add a small delay to ensure state is fully updated
        setTimeout(() => {
          if (mounted) {
            setIsLoading(false);
          }
        }, 100);
      }
    });

    // Also try to get existing session (for page refreshes with stored tokens)
    async function initializeAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.warn('Error loading session:', error.message);
        }
        
        console.log('getSession returned:', { hasSession: !!data?.session, email: data?.session?.user?.email });
        
        // Only update if we haven't received a state change yet
        if (!initialStateReceived) {
          setSession(data?.session ?? null);
          setUser(data?.session?.user ?? null);
        }
      } catch (error) {
        console.warn('Error initializing auth:', error);
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage session={session} isLoading={isLoading} />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute session={session} isLoading={isLoading}>
              <Dashboard user={user} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
