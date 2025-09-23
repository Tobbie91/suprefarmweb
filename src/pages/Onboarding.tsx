// src/pages/Onboarding.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card, Steps, Form, Input, Select, Upload, Button, Alert, message, Spin, Switch,
} from "antd";
import type { UploadProps } from "antd";
import {  ArrowRight, ShieldCheck, CheckCircle2, MapPin, Sun, Leaf } from "lucide-react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import { InboxOutlined } from "@ant-design/icons";

const { Dragger } = Upload;

type Profile = {
  id: string;
  full_name?: string;
  phone?: string;
  country?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  kyc_status?: "unsubmitted" | "pending" | "approved" | "rejected";
  kyc_file_path?: string | null;
  pref_country?: string | null;
  pref_updates_email?: boolean;
  onboarding_step?: number;
  onboarding_completed?: boolean;
};

const panel = "rounded-2xl bg-white shadow-sm ring-1 ring-black/5";

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [step, setStep] = useState(0);

  // forms
  const [formBasics] = Form.useForm();
  // const [formId] = Form.useForm();
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
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        // Bootstrap if no row yet
        let prof = data as Profile | null;
        if (!prof) {
          const empty: Profile = { id: user.id, kyc_status: "unsubmitted", onboarding_step: 0, onboarding_completed: false };
          await supabase.from("profiles").upsert(empty);
          prof = empty;
        }
        setProfile(prof);

        // Prefill forms
        formBasics.setFieldsValue({
          full_name: prof?.full_name || "",
          phone: prof?.phone || "",
          country: prof?.country || "Nigeria",
          address_line1: prof?.address_line1 || "",
          city: prof?.city || "",
          state: prof?.state || "",
        });
        formPrefs.setFieldsValue({
          pref_country: prof?.pref_country || "Nigeria",
          pref_updates_email: prof?.pref_updates_email ?? true,
        });
        setStep(prof?.onboarding_step ?? 0);
      } catch (e: any) {
        setErr(e?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [formBasics, formPrefs, navigate]);

  async function saveBasics(values: any) {
    if (!userId) return;
    setSaving(true);
    try {
      const updates: Partial<Profile> = {
        id: userId,
        full_name: values.full_name,
        phone: values.phone,
        country: values.country,
        address_line1: values.address_line1,
        city: values.city,
        state: values.state,
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

  async function savePrefs(values: any) {
    if (!userId) return;
    setSaving(true);
    try {
      const updates: Partial<Profile> = {
        id: userId,
        pref_country: values.pref_country,
        pref_updates_email: !!values.pref_updates_email,
        onboarding_step: Math.max(3, step),
      };
      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
      setProfile((p) => ({ ...(p as Profile), ...updates }));
      setStep(3);
      message.success("Preferences saved.");
    } catch (e: any) {
      message.error(e?.message || "Save failed.");
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
      navigate("/envirotrace", { replace: true });
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
      { title: "Preferences" },
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
                    <Form.Item label="Country" name="country" rules={[{ required: true }]}>
                      <Select
                        options={[
                          { value: "Nigeria", label: "Nigeria" },
                          { value: "Ghana", label: "Ghana" },
                          { value: "Kenya", label: "Kenya" },
                          { value: "USA", label: "USA" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="State / Region" name="state">
                      <Input placeholder="Oyo" />
                    </Form.Item>
                    <Form.Item className="md:col-span-2" label="Address" name="address_line1">
                      <Input placeholder="Street & house no." />
                    </Form.Item>
                    <Form.Item label="City" name="city">
                      <Input placeholder="Ibadan" />
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

              {/* Step 1: ID upload */}
              {step === 1 && (
                <div className="space-y-4">
                  <Alert
                    type="info"
                    showIcon
                    message="Upload a valid ID"
                    description="Accepted: National ID, International passport, Driver’s license (JPG/PNG/PDF)."
                  />
                  <Dragger {...uploadProps}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint">We keep your data encrypted and private.</p>
                  </Dragger>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Status: <strong className="capitalize">{profile?.kyc_status || "unsubmitted"}</strong>
                    </div>
                    <Button
                      type="primary"
                      onClick={() => setStep(2)}
                      className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700"
                    >
                      Continue <ArrowRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Preferences */}
              {step === 2 && (
                <Form form={formPrefs} layout="vertical" onFinish={savePrefs}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Form.Item label="Preferred Farm Country" name="pref_country" rules={[{ required: true }]}>
                      <Select
                        options={[
                          { value: "Nigeria", label: "Nigeria" },
                          { value: "Ghana", label: "Ghana" },
                          { value: "Kenya", label: "Kenya" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      label="Email me farm updates"
                      name="pref_updates_email"
                      valuePropName="checked"
                    >
                      <Switch />
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

              {/* Step 3: Review & Finish */}
              {step === 3 && (
                <div className="space-y-4">
                  <Card className="border-emerald-100">
                    <div className="text-lg font-semibold text-gray-800 mb-2">Review</div>
                    <div className="grid gap-3 md:grid-cols-2 text-sm">
                      <div><span className="text-gray-500">Name:</span> {profile?.full_name || "—"}</div>
                      <div><span className="text-gray-500">Phone:</span> {profile?.phone || "—"}</div>
                      <div><span className="text-gray-500">Country:</span> {profile?.country || "—"}</div>
                      <div><span className="text-gray-500">City/State:</span> {profile?.city || "—"}/{profile?.state || "—"}</div>
                      <div><span className="text-gray-500">Updates by email:</span> {profile?.pref_updates_email ? "Yes" : "No"}</div>
                      <div><span className="text-gray-500">KYC status:</span> {profile?.kyc_status || "—"}</div>
                    </div>
                  </Card>

                  <div className="flex items-center justify-between">
                    <div className="text-emerald-700 text-sm flex items-center gap-2">
                      <CheckCircle2 size={18} /> Once you finish, your dashboard unlocks.
                    </div>
                    <Button type="primary" onClick={finish} loading={saving}
                      className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700">
                      Finish & Go to Dashboard
                    </Button>
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
