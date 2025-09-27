import React, { useEffect, useMemo, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Radio,
  Checkbox,
  Divider,
  Alert,
  message,
  Tag,
  Tooltip,
} from "antd";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Sprout,
  ShieldCheck,
  Lock,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Info,
} from "lucide-react";
import { supabase } from "../supabase";
import { devOverride } from "../lib/dev";

type Intent = {
  type: "co-ownership";
  landId: number | string;
  landName: string;
  units: number;
  pricePerUnit: number;
  currency: "NGN" | "USD";
  amount: number;
  context?: { lat?: string; lon?: string; start?: string; end?: string };
};

const CURRENCY_SYMBOL: Record<string, string> = { NGN: "₦", USD: "$" };
async function getFarmIdBySlug(slug: string): Promise<string | null> {
  if (!slug) return null;
  const { data, error } = await supabase.from("farms").select("id").eq("slug", slug).limit(1);
  if (error || !data?.[0]?.id) return null;
  return data[0].id as string;
}

function payWithPaystack(opts: {
  email: string;
  amountMinor: number;              // NGN in kobo
  currency: "NGN" | "USD";
  reference: string;
  metadata?: any;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const key = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
    if (!key || !window.PaystackPop) {
      reject(new Error("Paystack not initialized. Check script tag & ENV key."));
      return;
    }
    const handler = window.PaystackPop.setup({
      key,
      email: opts.email,
      amount: Math.round(opts.amountMinor),
      currency: opts.currency,
      ref: opts.reference,
      metadata: opts.metadata,
      callback: (res: any) => { opts.onSuccess(res.reference); resolve(); },
      onClose: () => { opts.onClose(); resolve(); },
    });
    handler.openIframe();
  });
}


function formatMoney(amount: number, currency: string) {
  const locale = currency === "NGN" ? "en-NG" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function useGoToFarm() {
  const navigate = useNavigate();
  return (slug: string, ref?: string) => {
    navigate(`/farm/${slug}?paid=1${ref ? `&ref=${encodeURIComponent(ref)}` : ""}`, {
      replace: true,
      state: { flash: "Payment successful! Your plots have been assigned." },
    });
  };
}
const panel = "rounded-2xl bg-white shadow-sm ring-1 ring-black/5";

/**
 * Checkout page
 * - Shows order summary from query params or localStorage("checkout:intent")
 * - Buyer form + payment method selection
 * - Stubs out payment; builds payload and navigates (or call your gateway)
 */
const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Pull intent from URL or localStorage
  const stored = (() => {
    try {
      return JSON.parse(localStorage.getItem("checkout:intent") || "null") as Intent | null;
    } catch {
      return null;
    }
  })();

  const urlIntent: Partial<Intent> = {
    landId: params.get("landId") || undefined,
    landName: params.get("name") || undefined,
    units: params.get("units") ? Number(params.get("units")) : undefined,
    amount: params.get("amount") ? Number(params.get("amount")) : undefined,
    currency: (params.get("currency") as "NGN" | "USD") || undefined,
  };

  const intent: Intent | null = useMemo(() => {
    // Prefer stored, fall back to URL, derive pricePerUnit if possible
    if (stored) return stored;
    if (!urlIntent.units || !urlIntent.amount || !urlIntent.currency || !urlIntent.landId) {
      return null;
    }
    const derivedUnitPrice =
      urlIntent.units! > 0 ? Math.round(urlIntent.amount! / urlIntent.units!) : urlIntent.amount!;
    return {
      type: "co-ownership",
      landId: urlIntent.landId!,
      landName: urlIntent.landName || "Selected Land",
      units: urlIntent.units!,
      pricePerUnit: derivedUnitPrice,
      currency: urlIntent.currency!,
      amount: urlIntent.amount!,
    };
  }, [
    stored,
    urlIntent.amount,
    urlIntent.currency,
    urlIntent.landId,
    urlIntent.landName,
    urlIntent.units,
  ]);

  // Local editable copies (allow changing units at checkout)
  const [units, setUnits] = useState<number>(Math.max(1, intent?.units || 1));
  const [form] = Form.useForm();

  // Prefill when we have intent (safe: hook is always called)
  useEffect(() => {
    if (!intent) return;
    try {
      const raw = localStorage.getItem("checkout:buyer");
      if (raw) {
        const saved = JSON.parse(raw);
        form.setFieldsValue(saved);
      }
    } catch {}
  }, [form, intent]);

  // Pre-fill buyer form from memory (always runs; doesn't depend on intent)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("checkout:buyer") || "null");
      if (saved) form.setFieldsValue(saved);
    } catch {}
  }, [form]);

  const pricePerUnit = intent?.pricePerUnit || 0;
  const currency = intent?.currency || "NGN";
  const subtotal = pricePerUnit * Math.max(1, units || 1);

  // Example fees (adjust to match your business rules)
  const platformRate = 0.015; // 1.5%
  const platformFee = Math.round(subtotal * platformRate);
  const processingFee = currency === "NGN" ? 100 : 1; // flat example
  const total = subtotal + platformFee + processingFee;

  // Buyer form state
  const [agree, setAgree] = useState(false);
  const [method, setMethod] = useState<"paystack" | "flutterwave" | "card">("paystack");
  const [submitting, setSubmitting] = useState(false);
  const goToFarm = useGoToFarm();


  if (!intent) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] px-5 md:px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <Alert
            type="warning"
            showIcon
            message="No checkout intent"
            description={
              <span>
                We couldn’t find an order to pay for. Please start from{" "}
                <Link className="underline" to="/land-purchase">
                  Land Purchase
                </Link>{" "}
                and select a plot.
              </span>
            }
          />
        </div>
      </div>
    );
  }

  async function onPay(values: any) {
    if (!agree) { message.warning("Please accept the Terms."); return; }
    if (!intent) return;

 

  // 💡 DEV path: open Paystack only; skip auth, farm lookup & claim_plots
 const DEV = devOverride();
if (DEV) {
  const reference = `DEV-${Date.now()}`;
  const amountMinor = total * 100; // kobo for NGN
  await payWithPaystack({
    email: values.email,
    amountMinor,
    currency,
    reference,
    metadata: { intent, dev: true },
    onSuccess: (ref) => {
      const slug = (intent as any).landSlug || String(intent.landId);
      goToFarm(slug, ref);
    },
    onClose: () => message.info("Payment window closed."),
  });
  return;
}

    // user must be signed in (so we can record ownerships)
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) { message.error("Please sign in to continue."); return; }
  
    // find farm for this land
    const landSlug = (intent as any).landSlug || "";
    const farm_id = await getFarmIdBySlug(landSlug);
    if (!farm_id) { message.error("Farm not found for this land."); return; }
  
    // Paystack expects minor units (kobo for NGN)
    const amountMinor = total * 100;
    const reference = `ORD-${Date.now()}`;
  
    try {
      setSubmitting(true);
      await payWithPaystack({
        email: values.email,
        amountMinor,
        currency,
        reference,
        metadata: {
          landId: intent.landId,
          landSlug,
          landName: intent.landName,
          units: Math.max(1, units || 1),
          buyer: { name: values.fullName, phone: values.phone, country: values.country },
        },
          onSuccess: async (refFromGateway: string) => {
          try {
            // ⚠️ Demo path: allocate immediately on client callback
            const { data: auth } = await supabase.auth.getUser();
            const uid = auth?.user?.id;
            if (!uid) throw new Error("No user in session.");
        
            const landSlug = (intent as any).landSlug || "";
            const farm_id = await getFarmIdBySlug(landSlug);
            if (!farm_id) throw new Error("Farm not found for this land.");
            const { error } = await supabase.rpc("claim_plots", {
              f_farm_id: farm_id,
              f_user: uid,
              n: Math.max(1, units || 1),
            });
            if (error) throw error;
            message.success("Payment successful! Plots assigned.");
            goToFarm(landSlug, refFromGateway);
            // navigate(`/land/${landSlug}`);
          } catch (e: any) {
            console.error(e);
            message.error("Payment ok, but failed to assign plots. Contact support.");
          }
        },
        onClose: () => message.info("Payment window closed."),
      });
    } catch (e: any) {
      console.error(e);
      message.error(e?.message || "Failed to initialize payment.");
    } finally {
      setSubmitting(false);
    }
  }
  
  
  return (
    <div className="min-h-screen bg-[#F6F8FB] px-5 md:px-8 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600/10 flex items-center justify-center">
              <Sprout className="text-emerald-700" size={20} />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-semibold text-gray-800">Checkout</div>
              <div className="text-gray-600">
                Complete your purchase securely. <ShieldCheck className="inline mx-1" size={16} /> Encrypted payment.
              </div>
            </div>
          </div>

          <Link
            to="/land-purchase"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
          >
            <ArrowLeft size={16} /> Back to Lands
          </Link>
        </div>

        {/* Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr,420px]">
          {/* Left: Buyer + Payment */}
          <div className={panel}>
            <div className="p-5 md:p-6">
              <div className="text-lg font-semibold text-gray-800">Buyer Details</div>
              <div className="text-gray-500 text-sm mb-4">
                We’ll send your receipt and updates to this email.
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onPay}
                requiredMark="optional"
                initialValues={{ country: "Nigeria" }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Form.Item
                    label="Full Name"
                    name="fullName"
                    rules={[{ required: true, message: "Please enter your name" }]}
                  >
                    <Input placeholder="Jane Doe" />
                  </Form.Item>

                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Please enter a valid email" },
                      { type: "email" },
                    ]}
                  >
                    <Input placeholder="jane@example.com" />
                  </Form.Item>

                  <Form.Item
                    label="Phone"
                    name="phone"
                    rules={[{ required: true, message: "Please enter your phone" }]}
                  >
                    <Input placeholder="+234 800 000 0000" />
                  </Form.Item>

                  <Form.Item label="Country" name="country">
                    <Input placeholder="Nigeria" />
                  </Form.Item>
                </div>

                <Divider />

                <div className="text-lg font-semibold text-gray-800">Payment Method</div>
                <div className="text-gray-500 text-sm mb-3">
                  Choose a provider to process your payment.
                </div>

                <Radio.Group
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  <Radio.Button value="paystack" className="!h-auto !py-3 text-center">
                    <div className="flex flex-col items-center">
                      <CreditCard size={18} className="mb-1" />
                      Paystack
                    </div>
                  </Radio.Button>
                  <Radio.Button value="flutterwave" className="!h-auto !py-3 text-center">
                    <div className="flex flex-col items-center">
                      <CreditCard size={18} className="mb-1" />
                      Flutterwave
                    </div>
                  </Radio.Button>
                  <Radio.Button value="card" className="!h-auto !py-3 text-center">
                    <div className="flex flex-col items-center">
                      <Lock size={18} className="mb-1" />
                      Card
                    </div>
                  </Radio.Button>
                </Radio.Group>
                
                <div className="mt-4 flex items-start gap-2">
  <Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} />
  <div className="text-sm text-gray-600">
    I agree to the{" "}
    <Link to="/terms" className="underline">
      Terms of Purchase
    </Link>{" "}
    and{" "}
    <Link to="/privacy" className="underline">
      Privacy Policy
    </Link>.
  </div>
</div>


                <div className="mt-6 flex items-center justify-between">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Info size={14} /> You’ll be redirected to complete payment securely.
                  </div>
                  <Button
                    htmlType="submit"
                    type="primary"
                    disabled={!agree}
                    loading={submitting}
                    className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700"
                  >
                    Pay {formatMoney(total, currency)} <ArrowRight size={16} className="ml-1" />
                  </Button>
                </div>
              </Form>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className={panel}>
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-800">Order Summary</div>
                  <div className="text-sm text-gray-500">Co-Ownership — {intent.landName}</div>
                </div>
                <Tag color="green" className="rounded-full px-3 py-1 text-[11px]">Secured</Tag>
              </div>

              <Divider />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-gray-600">Price per Unit</div>
                  <div className="font-medium">
                    {CURRENCY_SYMBOL[currency]}
                    {intent.pricePerUnit.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-gray-600">Units</div>
                  <div className="flex items-center gap-2">
                    <InputNumber
                      min={1}
                      value={units}
                      onChange={(v) => setUnits(Math.max(1, Number(v ?? 1)))}
                      size="small"
                    />
                  </div>
                </div>

                <Divider className="my-2" />

                <div className="flex items-center justify-between">
                  <div className="text-gray-600">Subtotal</div>
                  <div className="font-medium">{formatMoney(subtotal, currency)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-600">
                    Platform Fee{" "}
                    <Tooltip title={`${(platformRate * 100).toFixed(1)}%`}>
                      <Info size={14} className="inline ml-1 text-gray-400" />
                    </Tooltip>
                  </div>
                  <div className="font-medium">{formatMoney(platformFee, currency)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-600">Processing</div>
                  <div className="font-medium">{formatMoney(processingFee, currency)}</div>
                </div>

                <Divider className="my-2" />

                <div className="flex items-center justify-between">
                  <div className="text-gray-700 font-semibold">Total</div>
                  <div className="text-lg font-semibold">
                    {formatMoney(total, currency)}
                  </div>
                </div>
              </div>

              {/* Optional context from results page */}
              {(intent.context?.lat || intent.context?.start) && (
                <>
                  <Divider />
                  <div className="text-xs text-gray-500">
                    Context: Lat {intent.context?.lat}, Lon {intent.context?.lon} |{" "}
                    {intent.context?.start} → {intent.context?.end}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <Lock size={12} className="inline mr-1" />
          Payments are processed over encrypted connections.
        </div>
      </div>
    </div>
  );
};

export default Checkout;
