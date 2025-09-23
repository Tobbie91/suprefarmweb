import React from "react";
import {
  Leaf,
  ShieldCheck,
  CloudSun,
  MapPin,
  CreditCard,
  BarChart3,
} from "lucide-react";

type Props = {
  children: React.ReactNode; // the form goes here
  title?: string;
  subtitle?: string;
};

const AuthLayout: React.FC<Props> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-emerald-50">
      {/* Left: Marketing */}
      <div className="relative hidden lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-900" />
        {/* subtle pattern */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,.25) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative z-10 w-full px-10 py-10 flex flex-col text-emerald-50">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 grid place-items-center">
              <Leaf size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight">SupreFarm</div>
              <div className="text-xs text-emerald-200/90">Own farms. Grow wealth.</div>
            </div>
          </div>

          {/* Hero copy */}
          <div className="mt-16 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
              <ShieldCheck size={14} /> Secure & transparent
            </div>
            <h1 className="mt-4 text-4xl leading-tight font-semibold">
              Co-own farmland with{" "}
              <span className="text-emerald-200">live weather</span> and{" "}
              <span className="text-emerald-200">aerial monitoring</span>.
            </h1>
            <p className="mt-3 text-emerald-100/90">
              Invest in professionally managed farms, track operations from anywhere,
              and receive verified updates—right from your dashboard.
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-10 grid grid-cols-2 gap-4 max-w-xl">
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-2 text-sm text-emerald-100">
                <MapPin size={16} className="text-emerald-200" /> Aerial boundary view
              </div>
              <p className="mt-1 text-xs text-emerald-200/90">
                Satellite basemap with your exact plot outline.
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-2 text-sm text-emerald-100">
                <CloudSun size={16} className="text-emerald-200" /> Live weather & alerts
              </div>
              <p className="mt-1 text-xs text-emerald-200/90">
                Open-Meteo insights for your farm coordinates.
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-2 text-sm text-emerald-100">
                <CreditCard size={16} className="text-emerald-200" /> Secure payments
              </div>
              <p className="mt-1 text-xs text-emerald-200/90">
                Local gateways and bank-grade encryption.
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-2 text-sm text-emerald-100">
                <BarChart3 size={16} className="text-emerald-200" /> Transparent reports
              </div>
              <p className="mt-1 text-xs text-emerald-200/90">
                Field videos, photos, and operations logs.
              </p>
            </div>
          </div>

          {/* Stats / social proof */}
          <div className="mt-auto pt-10">
            <div className="text-xs uppercase tracking-wide text-emerald-200/80">Why SupreFarm</div>
            <div className="mt-2 grid grid-cols-3 gap-6 max-w-xl">
              <div>
                <div className="text-2xl font-semibold">10k+</div>
                <div className="text-xs text-emerald-200/90">Hectares monitored</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">99.9%</div>
                <div className="text-xs text-emerald-200/90">Uptime & reliability</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">24/7</div>
                <div className="text-xs text-emerald-200/90">Operations tracking</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Auth card */}
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl ring-1 ring-black/5 p-6 md:p-7">
            {title && (
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
                {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
