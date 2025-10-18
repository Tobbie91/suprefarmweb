// src/components/PrivateRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../supabase";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [authed, setAuthed] = React.useState<boolean>(false);
  const location = useLocation();

  React.useEffect(() => {
    let mounted = true;

    async function boot() {
      // initial session check
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setAuthed(!!data.session);
      setReady(true);
    }
    boot();

    // keep in sync with login/logout
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setAuthed(!!session);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  if (!ready) return null; // or a spinner

  if (!authed) {
    // remember where they tried to go
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}




