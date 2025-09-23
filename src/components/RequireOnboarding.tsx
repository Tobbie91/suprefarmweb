// src/components/RequireOnboarding.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";

const RequireOnboarding: React.FC<React.PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (!data?.onboarding_completed) {
        navigate("/onboarding", { replace: true });
        return;
      }
      setOk(true);
    })();
  }, [navigate]);

  if (ok === null) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Spin size="large" />
      </div>
    );
  }
  return <>{children}</>;
};

export default RequireOnboarding;
