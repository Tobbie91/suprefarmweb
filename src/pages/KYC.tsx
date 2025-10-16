import { useEffect, useState } from "react";
import { Card, Alert, Button, Spin } from "antd";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

type KycStatus = "unsubmitted" | "pending" | "approved" | "rejected";

export default function KycReview() {
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Load current user + status
  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const { data: u } = await supabase.auth.getUser();
        if (!u?.user) {
          navigate("/login", { replace: true });
          return;
        }
        setUserId(u.user.id);

        const { data: prof, error } = await supabase
          .from("profiles")
          .select("kyc_status")
          .eq("id", u.user.id)
          .single();

        if (error) throw error;
        setStatus((prof?.kyc_status as KycStatus) || "unsubmitted");
      } catch (e: any) {
        setErr(e?.message || "Could not load KYC status.");
        setStatus("unsubmitted");
      }
    })();
  }, [navigate]);

  // Auto-redirect when approved
  useEffect(() => {
    if (status === "approved") navigate("/envirotrace", { replace: true });
  }, [status, navigate]);

  async function refreshStatus() {
    if (!userId) return;
    setRefreshing(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("kyc_status")
        .eq("id", userId)
        .single();
      setStatus((data?.kyc_status as KycStatus) || "unsubmitted");
    } finally {
      setRefreshing(false);
    }
  }

  if (status === null) {
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-[#F6F8FB]">
        <Spin tip="Checking your KYC status..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB]">
      <div className="flex-1 grid place-items-center p-6">
        <Card className="w-full max-w-xl">
          {err && <Alert type="error" showIcon message="Error" description={err} className="mb-3" />}

          {status === "approved" && (
            <Alert
              type="success"
              showIcon
              message="KYC Approved"
              description="You're all set. You can continue to your dashboard."
            />
          )}

          {status === "pending" && (
            <Alert
              type="info"
              showIcon
              message="KYC Pending"
              description="Your ID is under review. You’ll be redirected automatically once approved."
            />
          )}

          {status === "rejected" && (
            <Alert
              type="error"
              showIcon
              message="KYC Rejected"
              description="Please re-upload a clear, valid ID from Onboarding."
            />
          )}

          {status === "unsubmitted" && (
            <Alert
              type="warning"
              showIcon
              message="KYC Not Submitted"
              description="Please upload a valid ID from Onboarding."
            />
          )}
        </Card>
      </div>

      {/* Sticky footer actions */}
      <div className="w-full border-t bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
        <div className="mx-auto max-w-xl p-3 flex items-center justify-between">
          <Button onClick={refreshStatus} loading={refreshing}>
            Refresh status
          </Button>
          <div className="space-x-2">
            {status !== "approved" && (
              <Button onClick={() => navigate("/onboarding?next=/envirotrace")}>
                Back to Onboarding
              </Button>
            )}
            <Button
              type="primary"
              onClick={() => navigate("/envirotrace")}
              className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

