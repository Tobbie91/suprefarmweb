// src/pages/Onboarding.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card, Steps, Form, Input, Select, Upload, Button, Alert, message, Spin, Switch, DatePicker,
} from "antd";
import type { UploadProps } from "antd";
import { ArrowRight, ShieldCheck, CheckCircle2, MapPin, Sun, Leaf } from "lucide-react";
import { supabase } from "../supabase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { InboxOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

const { Dragger } = Upload;

type KycStatus = "unsubmitted" | "pending" | "approved" | "rejected";

type Profile = {
  id: string;
  // signup basics you already have:
  full_name?: string;
  phone?: string;
  // onboarding basics:
  country?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  dob?: string | null; // ISO date (YYYY-MM-DD)

  // Identity (KYC)
  id_type?: "NIN" | "BVN" | "PASSPORT" | "DRIVERS_LICENSE";
  id_number?: string | null;
  id_expiry?: string | null; // ISO date
  kyc_status?: KycStatus;
  kyc_file_path?: string | null;

  // Bank
  bank_code?: string | null; // e.g. '058' for GTBank
  bank_name?: string | null;
  account_number?: string | null;
  account_name_match?: "match" | "mismatch" | "unknown";
  account_name_returned?: string | null;

  // Preferences (kept)
  pref_country?: string | null;
  pref_updates_email?: boolean;

  // Progress flags
  onboarding_step?: number;
  onboarding_completed?: boolean;
};

const BANKS = [
  { value: "058", label: "GTBank (058)" },
  { value: "044", label: "Access Bank (044)" },
  { value: "011", label: "First Bank (011)" },
  { value: "214", label: "FCMB (214)" },
  { value: "033", label: "UBA (033)" },
  // TODO: Replace with API-fed list
];

const panel = "rounded-2xl bg-white shadow-sm ring-1 ring-black/5";

function isAdult(d?: string | null) {
  if (!d) return false;
  const years = dayjs().diff(dayjs(d), "year");
  return years >= 18;
}

function deriveStep(p?: Profile | null): number {
  if (!p) return 0;
  // Basics needed
  if (!p.full_name || !p.phone || !p.country || !p.dob || !isAdult(p.dob) || !p.address_line1 || !p.city) return 0;
  // Identity needed
  if (!p.kyc_file_path || !p.id_type || !p.id_number) return 1;
  // Bank needed
  if (!p.bank_code || !p.account_number || !p.account_name_match) return 2;
  // Otherwise ready to review
  return 3;
}
type BankVerifyResult = { account_name_returned: string; match: boolean };
async function verifyBankAccount(
  bank_code: string,
  account_number: string,
  expectedName: string
): Promise<BankVerifyResult> {
  const returned = expectedName.trim().toUpperCase();
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const match = norm(returned) === norm(expectedName);
  await new Promise((r) => setTimeout(r, 300));
  return { account_name_returned: returned, match };
}

// async function verifyBankAccount(bank_code, account_number, expectedName) {
//   const returned = expectedName.trim().toUpperCase(); // simulate API return
//   const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
//   const match = norm(returned) === norm(expectedName);
//   await new Promise((r) => setTimeout(r, 300));
//   return { account_name_returned: returned, match };
// }


const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next") || "/envirotrace";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [step, setStep] = useState(0);

  // forms
  const [formBasics] = Form.useForm();
  const [formKyc] = Form.useForm();
  const [formBank] = Form.useForm();
  const [formPrefs] = Form.useForm();

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes?.user;
        if (!user) {
          navigate("/login", { replace: true });
          return;
        }
        setUserId(user.id);

        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        let prof = data as Profile | null;

        // bootstrap row if absent
        if (!prof) {
          const empty: Profile = {
            id: user.id,
            kyc_status: "unsubmitted",
            onboarding_step: 0,
            onboarding_completed: false,
          };
            // upsert
          await supabase.from("profiles").upsert(empty);
          prof = empty;
        }

        setProfile(prof);

        // Prefill forms
        formBasics.setFieldsValue({
          full_name: prof?.full_name || "",
          phone: prof?.phone || "",
          dob: prof?.dob ? dayjs(prof.dob) : null,
          country: prof?.country || "Nigeria",
          address_line1: prof?.address_line1 || "",
          city: prof?.city || "",
          state: prof?.state || "",
        });

        formKyc.setFieldsValue({
          id_type: prof?.id_type || "NIN",
          id_number: prof?.id_number || "",
          id_expiry: prof?.id_expiry ? dayjs(prof.id_expiry) : null,
        });

        formBank.setFieldsValue({
          bank_code: prof?.bank_code || undefined,
          account_number: prof?.account_number || "",
        });

        formPrefs.setFieldsValue({
          pref_country: prof?.pref_country || prof?.country || "Nigeria",
          pref_updates_email: prof?.pref_updates_email ?? true,
        });

        const computed = deriveStep(prof);
        setStep(computed);

        // If onboarding completed already, route based on KYC state
        if (prof?.onboarding_completed && prof.kyc_status === "approved") {
          navigate(nextPath, { replace: true });
          return;
        }
      } catch (e: any) {
        setErr(e?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [formBasics, formKyc, formBank, formPrefs, navigate, nextPath]);

  // ---------- SAVE HANDLERS ----------
  async function saveBasics(values: any) {
    if (!userId) return;
    setSaving(true);
    try {
      const dobIso = values.dob ? (values.dob as Dayjs).format("YYYY-MM-DD") : null;

      if (!dobIso || !isAdult(dobIso)) {
        message.error("You must be at least 18 years old.");
        setSaving(false);
        return;
      }

      const updates: Partial<Profile> = {
        id: userId,
        full_name: values.full_name,
        phone: values.phone,
        country: values.country,
        address_line1: values.address_line1,
        city: values.city,
        state: values.state,
        dob: dobIso,
        onboarding_step: Math.max(1, step),
      };
      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
      setProfile((p) => ({ ...(p as Profile), ...updates }));
      setStep(1);
      message.success("Saved.");
    } catch (e: any) {
      message.error(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  // Upload to supabase storage (bucket "kyc")
  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".jpg,.jpeg,.png,.pdf",
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        if (!userId) throw new Error("Not signed in");
        const f = file as File;
        const path = `${userId}/${Date.now()}_${f.name}`;
        const { error } = await supabase.storage.from("kyc").upload(path, f, { upsert: true });
        if (error) throw error;

        const updates: Partial<Profile> = {
          id: userId,
          kyc_file_path: path,
          kyc_status: "pending",
          onboarding_step: Math.max(2, step),
        };
        const { error: upErr } = await supabase.from("profiles").upsert(updates);
        if (upErr) throw upErr;

        setProfile((p) => ({ ...(p as Profile), ...updates }));
        onSuccess && onSuccess("ok");
        message.success("ID uploaded.");
      } catch (e: any) {
        onError && onError(e);
        message.error(e?.message || "Upload failed.");
      }
    },
  };

  async function saveKyc(values: any) {
    if (!userId) return;
    setSaving(true);
    try {
      const updates: Partial<Profile> = {
        id: userId,
        id_type: values.id_type,
        id_number: values.id_number,
        id_expiry: values.id_expiry ? (values.id_expiry as Dayjs).format("YYYY-MM-DD") : null,
        // keep kyc_status from upload (pending) or unsubmitted if not uploaded yet
        onboarding_step: Math.max(2, step),
      };
      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
      setProfile((p) => ({ ...(p as Profile), ...updates }));
      setStep(2);
      message.success("KYC details saved.");
    } catch (e: any) {
      message.error(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveBank(values: any) {
    if (!userId || !profile?.full_name) return;
    setSaving(true);
    try {
      const bank_code = values.bank_code;
      const account_number = values.account_number?.trim();

      if (!bank_code || !account_number) {
        message.error("Provide bank and account number.");
        setSaving(false);
        return;
      }

      // Verify account name via provider (stubbed)
      const { account_name_returned, match } = await verifyBankAccount(
        bank_code,
        account_number,
        profile.full_name
      );

      const bankMeta = BANKS.find((b) => b.value === bank_code)?.label?.split(" (")[0] || null;

      const updates: Partial<Profile> = {
        id: userId,
        bank_code,
        bank_name: bankMeta,
        account_number,
        account_name_returned,
        account_name_match: match ? "match" : "mismatch",
        onboarding_step: Math.max(3, step),
      };

      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;

      setProfile((p) => ({ ...(p as Profile), ...updates }));
      setStep(3);

      if (!match) {
        message.warning(
          `Name mismatch: bank returned "${account_name_returned}". We may need manual review.`
        );
      } else {
        message.success("Bank verified.");
      }
    } catch (e: any) {
      message.error(e?.message || "Bank verification failed.");
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    if (!userId) return;
    setSaving(true);
    try {
      const updates: Partial<Profile> = {
        id: userId,
        onboarding_completed: true,
        onboarding_step: 4,
      };
      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
      message.success("Onboarding complete. Welcome!");

      // Route by KYC state
      const status = (profile?.kyc_status ?? "unsubmitted") as KycStatus;
      if (status === "approved") {
        navigate(nextPath, { replace: true });
      } else {
        navigate("/kyc-review", { replace: true });
      }
    } catch (e: any) {
      message.error(e?.message || "Could not complete onboarding.");
    } finally {
      setSaving(false);
    }
  }

  const steps = useMemo(
    () => [
      { title: "Basics" },
      { title: "Identity" },
      { title: "Bank" },
      { title: "Review" },
    ],
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center p-8">
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] px-5 md:px-8 py-8">
      <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-[1fr,360px]">
        {/* Left: wizard */}
        <Card className={panel}>
          <div className="p-5 md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-600/10 grid place-items-center">
                <ShieldCheck className="text-emerald-700" size={20} />
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-800">Complete your onboarding</div>
                <div className="text-sm text-gray-500">Just a few steps to unlock your dashboard</div>
              </div>
            </div>

            {err && <Alert className="mb-4" type="error" message="Error" description={err} showIcon />}

            <Steps current={step} items={steps} />

            {/* Step content */}
            <div className="mt-6">
              {/* Step 0: Basics */}
              {step === 0 && (
                <Form form={formBasics} layout="vertical" onFinish={saveBasics}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Form.Item label="Full Name" name="full_name" rules={[{ required: true }]}>
                      <Input placeholder="Jane Doe" />
                    </Form.Item>
                    <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
                      <Input placeholder="+234 800 000 0000" />
                    </Form.Item>

                    <Form.Item label="Country of residence" name="country" rules={[{ required: true }]}>
                      <Select
                        options={[
                          { value: "Nigeria", label: "Nigeria" },
                          { value: "Ghana", label: "Ghana" },
                          { value: "Kenya", label: "Kenya" },
                          { value: "USA", label: "USA" },
                        ]}
                      />
                    </Form.Item>

                    <Form.Item label="Date of birth" name="dob" rules={[{ required: true, message: "Enter your date of birth" }]}>
                      <DatePicker className="w-full" format="YYYY-MM-DD" />
                    </Form.Item>

                    <Form.Item className="md:col-span-2" label="Address" name="address_line1" rules={[{ required: true }]}>
                      <Input placeholder="Street & house no." />
                    </Form.Item>
                    <Form.Item label="City" name="city" rules={[{ required: true }]}>
                      <Input placeholder="Ibadan" />
                    </Form.Item>
                    <Form.Item label="State / Region" name="state">
                      <Input placeholder="Oyo" />
                    </Form.Item>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Button type="primary" htmlType="submit" loading={saving}
                      className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700">
                      Continue <ArrowRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </Form>
              )}

              {/* Step 1: Identity (KYC) */}
              {step === 1 && (
                <Form form={formKyc} layout="vertical" onFinish={saveKyc}>
                  <Alert
                    type="info"
                    showIcon
                    message="Upload a valid ID"
                    description="Accepted: National ID, International passport, Driver’s license (JPG/PNG/PDF)."
                    className="mb-4"
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <Form.Item label="ID type" name="id_type" rules={[{ required: true }]}>
                      <Select
                        options={[
                          { value: "NIN", label: "National ID (NIN)" },
                          { value: "BVN", label: "BVN" },
                          { value: "PASSPORT", label: "Passport" },
                          { value: "DRIVERS_LICENSE", label: "Driver’s License" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="ID number" name="id_number" rules={[{ required: true }]}>
                      <Input placeholder="Enter ID number" />
                    </Form.Item>
                    <Form.Item label="ID expiry (if applicable)" name="id_expiry">
                      <DatePicker className="w-full" format="YYYY-MM-DD" />
                    </Form.Item>
                    <div className="md:col-span-2">
                      <Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Click or drag file to this area to upload</p>
                        <p className="ant-upload-hint">We keep your data encrypted and private.</p>
                      </Dragger>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm text-gray-500">
                      Status: <strong className="capitalize">{profile?.kyc_status || "unsubmitted"}</strong>
                    </div>
                    <div>
                      <Button onClick={() => setStep(0)} className="mr-2">Back</Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700"
                      >
                        Continue <ArrowRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                </Form>
              )}

              {/* Step 2: Bank */}
              {step === 2 && (
                <Form form={formBank} layout="vertical" onFinish={saveBank}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Form.Item label="Bank" name="bank_code" rules={[{ required: true }]}>
                      <Select options={BANKS} placeholder="Select your bank" />
                    </Form.Item>
                    <Form.Item label="Account number" name="account_number" rules={[{ required: true, len: 10, message: "Enter 10-digit account number" }]}>
                      <Input placeholder="0123456789" maxLength={10} />
                    </Form.Item>
                  </div>

                  {profile?.account_name_returned && (
                    <Alert
                      className="mb-3"
                      type={profile.account_name_match === "match" ? "success" : "warning"}
                      showIcon
                      message={
                        profile.account_name_match === "match"
                          ? "Bank name matched"
                          : "Name mismatch"
                      }
                      description={
                        <>
                          Bank returned: <strong>{profile.account_name_returned}</strong>
                          {profile.account_name_match === "mismatch" && " — we’ll review manually."}
                        </>
                      }
                    />
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <Button onClick={() => setStep(1)}>Back</Button>
                    <Button type="primary" htmlType="submit" loading={saving}
                      className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700">
                      Continue <ArrowRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </Form>
              )}

              {/* Step 3: Review & Finish */}
              {step === 3 && (
                <div className="space-y-4">
                  <Card className="border-emerald-100">
                    <div className="text-lg font-semibold text-gray-800 mb-2">Review</div>
                    <div className="grid gap-3 md:grid-cols-2 text-sm">
                      <div><span className="text-gray-500">Name:</span> {profile?.full_name || "—"}</div>
                      <div><span className="text-gray-500">Phone:</span> {profile?.phone || "—"}</div>
                      <div><span className="text-gray-500">DOB:</span> {profile?.dob || "—"}</div>
                      <div><span className="text-gray-500">Country:</span> {profile?.country || "—"}</div>
                      <div><span className="text-gray-500">Address:</span> {profile?.address_line1 || "—"}</div>
                      <div><span className="text-gray-500">City/State:</span> {profile?.city || "—"}/{profile?.state || "—"}</div>
                      <div><span className="text-gray-500">ID Type/Number:</span> {profile?.id_type || "—"} / {profile?.id_number || "—"}</div>
                      <div><span className="text-gray-500">KYC status:</span> {profile?.kyc_status || "—"}</div>
                      <div><span className="text-gray-500">Bank:</span> {profile?.bank_name || profile?.bank_code || "—"}</div>
                      <div><span className="text-gray-500">Acct No:</span> {profile?.account_number || "—"}</div>

                    </div>
                  </Card>

                  <div className="flex items-center justify-between">
                    <div className="text-emerald-700 text-sm flex items-center gap-2">
                      <CheckCircle2 size={18} /> Once you finish, your dashboard unlocks.
                    </div>
                    <div>
                      <Button onClick={() => setStep(2)} className="mr-2">Back</Button>
                      <Button
                        type="primary"
                        onClick={finish}
                        loading={saving}
                        disabled={!profile?.kyc_file_path} // must upload ID
                        className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700"
                      >
                        Finish & Continue
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Right: value props / brand */}
        <div className="space-y-4">
          <Card className={panel}>
            <div className="p-5">
              <div className="text-lg font-semibold text-gray-800 mb-2">Why SupreFarm?</div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><Leaf size={16} className="mt-0.5 text-emerald-700" /> Invest in verified farmlands with transparent ownership.</li>
                <li className="flex items-start gap-2"><Sun size={16} className="mt-0.5 text-emerald-700" /> Weather-aware insights to protect your yield.</li>
                <li className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 text-emerald-700" /> Aerial maps & timely video updates from the field.</li>
              </ul>
            </div>
          </Card>

          <Card className={panel}>
            <div className="p-5">
              <div className="text-lg font-semibold text-gray-800 mb-1">Security & privacy</div>
              <div className="text-sm text-gray-600">
                Your documents are stored securely. Only authorized reviewers can access them.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

