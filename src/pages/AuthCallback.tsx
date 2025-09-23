// src/pages/AuthCallback.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import { Alert, Spin } from "antd";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // 1) Try hash tokens (email link / magic link)
        if (window.location.hash && window.location.hash.length > 1) {
          const params = new URLSearchParams(window.location.hash.slice(1));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          const error_description = params.get("error_description") || params.get("error");

          if (error_description) {
            setErr(error_description);
            return;
          }

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;

            // Clean the URL (remove hash) then go to your app
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate("/onboarding", { replace: true });
            return;
          }
        }

        // 2) Fallback for OAuth code flow (?code=...)
        const { error: codeErr } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (!codeErr) {
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate("/environment-trace", { replace: true });
          return;
        }

        // 3) Last resort: if already signed in, go on; else show error
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate("/onboarding", { replace: true });
        } else {
          setErr("Invalid or expired link. Please sign in again.");
        }
      } catch (e: any) {
        setErr(e?.message || "Authentication failed.");
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center p-8">
      {err ? (
        <Alert type="error" showIcon message="Sign-in link error" description={err} />
      ) : (
        <Spin size="large" tip="Finishing sign-in..." />
      )}
    </div>
  );
};

export default AuthCallback;
