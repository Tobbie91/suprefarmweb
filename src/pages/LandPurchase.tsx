// src/pages/LandPurchase.tsx
// src/pages/LandPurchase.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Input,
  Select,
  Slider,
  Button,
  Tag,
  Modal,
  InputNumber,
  Tooltip,
  Empty,
  Spin,
  message,
} from "antd";
import { MapPin, Sprout, Ruler, ShieldCheck, ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase";
import { devOverride } from "../lib/dev";

type Currency = "NGN" | "USD";

type Land = {
  id: string;                 // uuid from DB
  slug: string;
  name: string;
  location: string;
  country: string;
  hectares: number;
  price_per_unit: number;
  currency: Currency;
  thumbnail_url: string | null;
  features: string[] | null;
  // from lands_view
  free_plots?: number;
  total_plots?: number;
};

const currencySymbol = (c: Currency) => (c === "NGN" ? "₦" : "$");
const formatMoney = (amt: number, currency: Currency) =>
  new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amt);

const LandPurchase: React.FC = () => {
  const navigate = useNavigate();
  const [inParams] = useSearchParams();
  const lat = inParams.get("lat") || "";
  const lon = inParams.get("lon") || "";
  const start = inParams.get("start") || "";
  const end = inParams.get("end") || "";

  // Data
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [q, setQ] = useState("");
  const [country, setCountry] = useState<string | "All">("All");
  const [sort, setSort] = useState<"price-asc" | "price-desc" | "size-desc" | "size-asc">(
    "price-asc"
  );
  const [budget, setBudget] = useState<[number, number]>([0, 0]);

  // Modal
  const [selected, setSelected] = useState<Land | null>(null);
  const [units, setUnits] = useState<number>(1);

  // Load lands from Supabase (lands_view gives free_plots & total_plots)
  async function loadLands() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lands_view")
        .select(
          "id, slug, name, location, country, hectares, price_per_unit, currency, thumbnail_url, features, free_plots, total_plots"
        )
        .eq("is_published", true)
        .order("price_per_unit", { ascending: true });

      if (error) throw error;
      setLands((data || []) as Land[]);
    } catch (e: any) {
      console.error(e);
      message.error(e?.message || "Failed to load lands.");
      setLands([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLands();
    // Optional: live refresh when ownerships change (if you added the trigger)
    // const channel = supabase
    //   .channel("farm-availability")
    //   .on("postgres_changes", { event: "*", schema: "public", table: "ownerships" }, () => {
    //     loadLands();
    //   })
    //   .subscribe();
    // return () => { supabase.removeChannel(channel); };
  }, []);

  // Derived values
  const countries = useMemo(
    () => ["All", ...Array.from(new Set(lands.map((l) => l.country)))],
    [lands]
  );

  const prices = useMemo(() => lands.map((l) => l.price_per_unit), [lands]);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 0;
  // const canBuy = devOverride() || (land.free_plots ?? 0) > 0;
  // Initialize budget when lands change
  useEffect(() => {
    if (prices.length) setBudget([minP, maxP]);
  }, [minP, maxP, prices.length]);

  // Client-side filter/sort
  const filtered = useMemo(() => {
    let rows = lands.filter((l) => {
      const matchQ =
        !q.trim() ||
        l.name.toLowerCase().includes(q.toLowerCase()) ||
        l.location.toLowerCase().includes(q.toLowerCase());
      const matchCountry = country === "All" || l.country === country;
      const matchBudget = l.price_per_unit >= (budget[0] || 0) && l.price_per_unit <= (budget[1] || 0 || l.price_per_unit);
      return matchQ && matchCountry && (prices.length ? matchBudget : true);
    });

    rows = rows.sort((a, b) => {
      if (sort === "price-asc") return a.price_per_unit - b.price_per_unit;
      if (sort === "price-desc") return b.price_per_unit - a.price_per_unit;
      if (sort === "size-asc") return a.hectares - b.hectares;
      if (sort === "size-desc") return b.hectares - a.hectares;
      return 0;
    });

    return rows;
  }, [lands, q, country, budget, sort, prices.length]);

  const openBuy = (land: Land) => {
    setSelected(land);
    // start from 1 but don’t exceed free_plots
    const startUnits = Math.min(land.free_plots ?? 1, 1);
    setUnits(Math.max(1, startUnits));
  };

  const proceedToCheckout = () => {
    if (!selected) return;
  
    // ✅ in dev mode, bypass availability
    const dev = devOverride();
    const allowed = dev ? Number.MAX_SAFE_INTEGER : Math.max(0, selected.free_plots ?? 0);
  
    if (!dev && allowed <= 0) {
      message.warning("This farm is sold out.");
      return;
    }
  
    const unitsToBuy = Math.min(Math.max(1, units || 1), allowed);
  
    const payload = {
      type: "co-ownership" as const,
      landId: selected.id,
      landSlug: selected.slug,
      landName: selected.name,
      units: unitsToBuy,
      pricePerUnit: selected.price_per_unit,
      currency: selected.currency,
      amount: selected.price_per_unit * unitsToBuy,
      context: { lat, lon, start, end },
    };
    localStorage.setItem("checkout:intent", JSON.stringify(payload));
  
    const qs = new URLSearchParams({
      landId: String(selected.id),
      name: selected.name,
      units: String(payload.units),
      amount: String(payload.amount),
      currency: selected.currency,
    }).toString();
  
    navigate(`/checkout?${qs}`);
  };
  

  // const proceedToCheckout = () => {
  //   if (!selected) return;

  //   const allowed = Math.max(0, selected.free_plots ?? 0);
  //   if (allowed <= 0) {
  //     message.warning("This farm is sold out.");
  //     return;
  //   }
  //   const unitsToBuy = Math.min(Math.max(1, units || 1), allowed);

  //   const payload = {
  //     type: "co-ownership" as const,
  //     landId: selected.id,
  //     landSlug: selected.slug,
  //     landName: selected.name,
  //     units: unitsToBuy,
  //     pricePerUnit: selected.price_per_unit,
  //     currency: selected.currency,
  //     amount: selected.price_per_unit * unitsToBuy,
  //     context: { lat, lon, start, end }, // carry context if you came from results
  //   };
  //   localStorage.setItem("checkout:intent", JSON.stringify(payload));

  //   const qs = new URLSearchParams({
  //     landId: String(selected.id),
  //     name: selected.name,
  //     units: String(payload.units),
  //     amount: String(payload.amount),
  //     currency: selected.currency,
  //   }).toString();

  //   navigate(`/checkout?${qs}`);
  // };

  const maxUnits = Math.max(1, selected?.free_plots ?? 1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Hero */}
      <div className="px-5 md:px-8 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600/10 flex items-center justify-center">
              <Sprout className="text-emerald-700" size={20} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-800">
                Available Land for Co-Ownership & Purchase
              </h1>
              <p className="text-gray-600 mt-1">
                Browse verified plots, see live availability, and secure your stake.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 rounded-2xl bg-white p-4 md:p-5 shadow-sm ring-1 ring-black/5">
            <div className="grid gap-4 md:grid-cols-4 items-end">
              <div className="md:col-span-2">
                <div className="text-sm text-gray-700 mb-1">Search</div>
                <Input
                  placeholder="Search by name or location"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  allowClear
                />
              </div>

              <div>
                <div className="text-sm text-gray-700 mb-1">Country</div>
                <Select
                  value={country}
                  onChange={(v) => setCountry(v)}
                  className="w-full"
                  options={countries.map((c) => ({ value: c, label: c }))}
                />
              </div>

              <div>
                <div className="text-sm text-gray-700 mb-1">Sort</div>
                <Select
                  value={sort}
                  onChange={(v) => setSort(v)}
                  className="w-full"
                  options={[
                    { value: "price-asc", label: "Price: Low → High" },
                    { value: "price-desc", label: "Price: High → Low" },
                    { value: "size-asc", label: "Size: Small → Large" },
                    { value: "size-desc", label: "Size: Large → Small" },
                  ]}
                />
              </div>
            </div>

            {/* Budget slider */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">Budget per Unit</div>
                <div className="text-xs text-gray-500">
                  {formatMoney(budget[0] || minP, "NGN")} – {formatMoney(budget[1] || maxP, "NGN")}
                </div>
              </div>
              <Slider
                range
                min={minP}
                max={maxP}
                step={1000}
                disabled={!prices.length}
                value={prices.length ? budget : [minP, maxP]}
                onChange={(v) => setBudget(v as [number, number])}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-5 md:px-8 pb-12">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="rounded-2xl bg-white p-16 shadow-sm ring-1 ring-black/5 text-center">
              <Spin />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
              <Empty description="No land matches your filters." />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((land) => {
                const left = land.free_plots ?? 0;
                const soldOut = left <= 0;
                const canBuy = devOverride() || !soldOut;
                return (
                  <Card
                    key={land.id}
                    className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5"
                    bodyStyle={{ padding: 0 }}
                    hoverable
                  >
                    <div className="relative h-40 w-full overflow-hidden">
                      <img
                        src={land.thumbnail_url || "/lands/1-ilora.jpg"}
                        alt={land.name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Tag color="green" className="rounded-full px-3 py-1 text-[11px]">
                          {land.hectares} ha
                        </Tag>
                        <Tag
                          color={soldOut ? "red" : "blue"}
                          className="rounded-full px-3 py-1 text-[11px]"
                        >
                          {left} {left === 1 ? "plot" : "plots"} left
                        </Tag>
                      </div>
                      {soldOut && (
                        <div className="absolute top-3 right-3 rounded-md bg-red-600 text-white px-2 py-1 text-xs font-semibold">
                          Sold out
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 rounded-md bg-white/90 backdrop-blur px-2 py-1 text-sm font-medium">
                        From {currencySymbol(land.currency)}
                        {land.price_per_unit.toLocaleString()} / unit
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-gray-800">{land.name}</div>
                          <div className="mt-1 text-sm text-gray-600 flex items-center gap-1.5">
                            <MapPin size={14} className="text-emerald-700" />
                            {land.location}
                          </div>
                        </div>
                      </div>

                      {/* Feature chips */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Tag className="border-emerald-200 text-emerald-800 bg-emerald-50 rounded-md">
                          <Ruler size={14} className="mr-1" /> {land.hectares} hectares
                        </Tag>
                        <Tag className="border-emerald-200 text-emerald-800 bg-emerald-50 rounded-md">
                          <ShieldCheck size={14} className="mr-1" /> Verified
                        </Tag>
                        {(land.features || []).slice(0, 2).map((f) => (
                          <Tag key={f} className="border-gray-200 text-gray-700 bg-gray-50 rounded-md">
                            {f}
                          </Tag>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="mt-4 flex items-center justify-between">
                        <Tooltip title="View agronomy insights and location details">
                          <Button
                            className="border-emerald-200 text-emerald-700 hover:!bg-emerald-50"
                            onClick={() => navigate(`/land/${land.slug}`)}
                          >
                            Details
                          </Button>
                        </Tooltip>
                        {/* <Button
                          type="primary"
                          disabled={soldOut}
                          className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700 disabled:!bg-gray-300"
                          onClick={() => openBuy(land)}
                        >
                          {soldOut ? "Sold out" : <>Buy / Co-own <ArrowRight size={16} className="ml-1" /></>}
                        </Button> */}
                        <Button
  type="primary"
  disabled={!canBuy}
  className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700 disabled:!bg-gray-300"
  onClick={() => openBuy(land)}
>
  {canBuy ? "Buy / Co-own" : "Sold out"}
</Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        title={
          <div className="flex items-center gap-2">
            <Sprout size={18} className="text-emerald-700" />
            <span>Become a Co-Owner — {selected?.name}</span>
          </div>
        }
        okText="Proceed to Payment"
        onOk={proceedToCheckout}
        okButtonProps={{
          className: "!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700",
          // disabled: (selected?.free_plots ?? 0) <= 0,
        }}
      >
        {selected && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              Location: <strong>{selected.location}</strong>
            </div>
            <div className="text-sm text-gray-600">
              Size: <strong>{selected.hectares} hectares</strong>
            </div>
            <div className="text-sm text-gray-600">
              Price per unit:{" "}
              <strong>
                {currencySymbol(selected.currency)}
                {selected.price_per_unit.toLocaleString()} ({selected.currency})
              </strong>
            </div>

            <div>
              <div className="text-sm text-gray-700 mb-1">
                Units (max {Math.max(1, selected.free_plots ?? 1)})
              </div>
              <InputNumber
                min={1}
                max={maxUnits}
                value={units}
                onChange={(v) => setUnits(Math.min(maxUnits, Math.max(1, Number(v || 1))))}
              />
              <div className="text-xs text-gray-500 mt-1">
                {Math.max(1, selected.free_plots ?? 1)} plots available on this farm
              </div>
            </div>

            <div className="text-base">
              Total:{" "}
              <strong>
                {formatMoney(
                  selected.price_per_unit * Math.min(maxUnits, Math.max(1, units || 1)),
                  selected.currency
                )}
              </strong>
            </div>
            <div className="text-xs text-gray-500">
              You’ll be redirected to checkout to complete payment securely.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LandPurchase;
