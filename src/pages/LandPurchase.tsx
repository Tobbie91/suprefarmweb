// src/pages/LandPurchase.tsx
import React, { useMemo, useState } from "react";
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
} from "antd";
import {
  MapPin,
  Sprout,
  Ruler,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

type Land = {
  id: number;
  name: string;
  location: string;   // City/State, Country
  country: string;    // "Nigeria", "Ghana", etc.
  hectares: number;
  price: number;      // price per unit (co-ownership unit)
  currency: "NGN" | "USD";
  thumbnail: string;
  features?: string[];
};

const landPlots: Land[] = [
  {
    id: 1,
    name: "Ilora Block A",
    location: "Ilora, Oyo, Nigeria",
    country: "Nigeria",
    hectares: 15,
    price: 50000, // ₦ per unit (example)
    currency: "NGN",
    thumbnail:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    features: ["Road Access", "Irrigation Ready"],
  },
  {
    id: 2,
    name: "Eastern Ridge",
    location: "ilaje, Oyo",
    country: "Ghana",
    hectares: 13,
    price: 50000, // ₵/NGN equivalent per unit (example)
    currency: "NGN",
    thumbnail:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop",
    features: ["Fertile Soil", "Survey Verified"],
  },
  {
    id: 3,
    name: "Savannah Lot",
    location: "Oyo, Nigeria",
    country: "Nigeria",
    hectares: 10,
    price: 5000,
    currency: "NGN",
    thumbnail:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
    features: ["Water Nearby"],
  },
];

const currencySymbol = (c: Land["currency"]) => (c === "NGN" ? "₦" : "$");
const formatMoney = (amt: number, currency: Land["currency"]) =>
  new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amt);

const LandPurchase: React.FC = () => {
  const navigate = useNavigate();
  const [inParams] = useSearchParams(); // if you navigated here with ?lat=&lon=&start=&end=
  const lat = inParams.get("lat") || "";
  const lon = inParams.get("lon") || "";
  const start = inParams.get("start") || "";
  const end = inParams.get("end") || "";

  // Filters
  const [q, setQ] = useState("");
  const [country, setCountry] = useState<string | "All">("All");
  const [sort, setSort] = useState<"price-asc" | "price-desc" | "size-desc" | "size-asc">(
    "price-asc"
  );

  const prices = landPlots.map((l) => l.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const [budget, setBudget] = useState<[number, number]>([minP, maxP]);

  // Modal
  const [selected, setSelected] = useState<Land | null>(null);
  const [units, setUnits] = useState<number>(1);

  const countries = useMemo(
    () => ["All", ...Array.from(new Set(landPlots.map((l) => l.country)))],
    []
  );

  const filtered = useMemo(() => {
    let rows = landPlots.filter((l) => {
      const matchQ =
        !q.trim() ||
        l.name.toLowerCase().includes(q.toLowerCase()) ||
        l.location.toLowerCase().includes(q.toLowerCase());
      const matchCountry = country === "All" || l.country === country;
      const matchBudget = l.price >= budget[0] && l.price <= budget[1];
      return matchQ && matchCountry && matchBudget;
    });

    rows = rows.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "size-asc") return a.hectares - b.hectares;
      if (sort === "size-desc") return b.hectares - a.hectares;
      return 0;
    });

    return rows;
  }, [q, country, budget, sort]);

  const openBuy = (land: Land) => {
    setSelected(land);
    setUnits(1);
  };

  const proceedToCheckout = () => {
    if (!selected) return;
    const payload = {
      type: "co-ownership",
      landId: selected.id,
      landName: selected.name,
      units: Math.max(1, units || 1),
      pricePerUnit: selected.price,
      currency: selected.currency,
      amount: selected.price * Math.max(1, units || 1),
      context: { lat, lon, start, end }, // carry context if you came from results
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
                Browse verified plots, see size and indicative unit pricing, and secure your stake.
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
                  {formatMoney(budget[0], "NGN")} – {formatMoney(budget[1], "NGN")}
                </div>
              </div>
              <Slider
                range
                min={minP}
                max={maxP}
                step={1000}
                value={budget}
                onChange={(v) => setBudget(v as [number, number])}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-5 md:px-8 pb-12">
        <div className="mx-auto max-w-7xl">
          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
              <Empty description="No land matches your filters." />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((land) => (
                <Card
                  key={land.id}
                  className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5"
                  bodyStyle={{ padding: 0 }}
                  hoverable
                >
                  <div className="relative h-40 w-full overflow-hidden">
                    <img
                      src={land.thumbnail}
                      alt={land.name}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <Tag color="green" className="rounded-full px-3 py-1 text-[11px]">
                        {land.hectares} ha
                      </Tag>
                    </div>
                    <div className="absolute bottom-3 left-3 rounded-md bg-white/90 backdrop-blur px-2 py-1 text-sm font-medium">
                      From {currencySymbol(land.currency)}
                      {land.price.toLocaleString()} / unit
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-gray-800">
                          {land.name}
                        </div>
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
                      {land.features?.slice(0, 2).map((f) => (
                        <Tag
                          key={f}
                          className="border-gray-200 text-gray-700 bg-gray-50 rounded-md"
                        >
                          {f}
                        </Tag>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-4 flex items-center justify-between">
                      <Tooltip title="View agronomy insights and location details">
                        <Button
                          className="border-emerald-200 text-emerald-700 hover:!bg-emerald-50"
                          onClick={() => {
                            // if you have a details page, navigate here
                            // navigate(`/land/${land.id}`);
                          }}
                        >
                          Details
                        </Button>
                      </Tooltip>
                      <Button
                        type="primary"
                        className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700"
                        onClick={() => openBuy(land)}
                      >
                        Buy / Co-own <ArrowRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
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
                {selected.price.toLocaleString()}{" "}
                ({selected.currency})
              </strong>
            </div>
            <div>
              <div className="text-sm text-gray-700 mb-1">Units</div>
              <InputNumber
                min={1}
                value={units}
                onChange={(v) => setUnits(Number(v))}
              />
            </div>
            <div className="text-base">
              Total:{" "}
              <strong>
                {formatMoney(selected.price * Math.max(1, units || 1), selected.currency)}
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
