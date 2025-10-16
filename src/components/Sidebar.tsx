import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, generatePath } from "react-router-dom";
import { Home, Sun, Leaf, DollarSign, Settings, BarChart, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { supabase } from "../supabase"; // ← make sure this is your configured client

type SidebarProps = {
  currentFarmSlug?: string | null;
  brand?: string;
};

const Sidebar: React.FC<SidebarProps> = ({ currentFarmSlug, brand = "SupreFarm" }) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("ui:sidebarCollapsed") || "false"); }
    catch { return false; }
  });
  useEffect(() => {
    localStorage.setItem("ui:sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  // 🔐 user display info
  const [displayName, setDisplayName] = useState<string>("User");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      // 1) Auth user (email, metadata)
      const { data: authRes } = await supabase.auth.getUser();
      const user = authRes?.user || null;

      if (!user) {
        if (!cancelled) { setDisplayName("Guest"); setEmail(""); }
        return;
      }

      const metaName =
        (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
        "";

      // 2) Try profiles.full_name if you keep it there
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      const name = prof?.full_name || metaName || user.email || "User";

      if (!cancelled) {
        setDisplayName(name);
        setEmail(user.email || "");
      }
    }

    loadUser();

    // 3) Stay in sync with auth changes (login/logout/profile updates)
    const { data: sub } = supabase.auth.onAuthStateChange(() => loadUser());

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const initial = (displayName || email || "U").trim().charAt(0).toUpperCase();

  const farmDashboardLink = useMemo(
    () => (currentFarmSlug ? generatePath("/farm/:slug", { slug: currentFarmSlug }) : "/farm"),
    [currentFarmSlug]
  );

  const { pathname } = useLocation();
  const items = [
    { to: "/envirotrace", label: "Environment Trace", icon: Home },
    { to: "/land-purchase", label: "Land Purchase", icon: DollarSign },
    { to: farmDashboardLink, label: "My Farm", icon: Sun },
    { to: "/reports", label: "Reports", icon: BarChart as any, badge: "new" as const },
    // { to: "/admin", label: "Admin Panel", icon: Settings },
  ];

  const width = collapsed ? "w-[84px]" : "w-64";

  return (
    <aside className={`${width} h-screen sticky top-0 z-40 bg-gradient-to-b from-emerald-700 via-emerald-700 to-emerald-900 text-emerald-50 shadow-xl ring-1 ring-black/10 flex flex-col`}>
      {/* Brand */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
          <Leaf size={20} />
        </div>
        {!collapsed && (
          <div className="flex-1">
            <div className="text-xl font-semibold tracking-tight">{brand}</div>
            <div className="text-[11px] text-emerald-200/80 flex items-center gap-1">
              <ShieldCheck size={12} /> secure ownership
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="px-2 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon, badge }) => {
            const isActive = pathname === to || (to.startsWith("/farm") && pathname.startsWith("/farm"));
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  className={`
                    group relative mx-2 flex items-center gap-3 rounded-xl
                    ${isActive ? "bg-white/10 text-white" : "text-emerald-100 hover:bg-white/5 hover:text-white"}
                    px-3 py-2 transition
                  `}
                  title={collapsed ? label : undefined}
                >
                  <span
                    className={`
                      absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-full
                      ${isActive ? "bg-emerald-300" : "bg-transparent"}
                    `}
                  />
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate">{label}</span>
                      {badge && (
                        <span className="ml-auto text-[10px] rounded-full bg-emerald-300 text-emerald-900 px-2 py-0.5">
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profile + Collapse */}
      <div className="p-3 border-t border-white/10">
        <div className={`${collapsed ? "justify-center" : "justify-between"} flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5`}>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/20 grid place-items-center text-sm font-medium">
              {initial}
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <div className="text-sm">{displayName}</div>
                {email ? <div className="text-xs text-emerald-200 truncate max-w-[11rem]">{email}</div> : null}
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="text-[10px] text-emerald-200/80 px-2 py-0.5 rounded bg-white/5">
              Owner
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg白/20 text-white px-3 py-2 transition"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
