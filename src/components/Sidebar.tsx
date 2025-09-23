// src/components/Sidebar.tsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom"; 
import {
  Home,
  Sun,
  Leaf,
  DollarSign,
  Settings,
  BarChart,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

type SidebarProps = {
  /** If you know the signed-in user's farm id, pass it so the link goes to it */
  currentFarmId?: string | null;
  /** Optional: app name in the header */
  brand?: string;
};

const Sidebar: React.FC<SidebarProps> = ({ currentFarmId, brand = "SupreFarm" }) => {
  // compact (icon-only) mode with localStorage persistence
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem("ui:sidebarCollapsed") || "false");
    } catch {
      return false;
    }
  });
  useEffect(() => {
    localStorage.setItem("ui:sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const farmLink = useMemo(
    () => (currentFarmId ? `/dashboard/farm/${currentFarmId}` : "/land-purchase"),
    [currentFarmId]
  );
  const { pathname } = useLocation(); 
  // adjust these to match your real routes
  const items = [
    { to: "/envirotrace", label: "Environment Trace", icon: Home },
    { to: "/land-purchase", label: "Land Purchase", icon: DollarSign },
    { to: farmLink, label: "Farm Dashboard", icon: Sun },
    // { to: "/dashboard/farm/:farmId", label: "Farm Dashboard", icon: Sun },
    { to: "/reports", label: "Reports", icon: BarChart, badge: "new" as const },
    { to: "/admin", label: "Admin Panel", icon: Settings },
  ];

  const width = collapsed ? "w-[84px]" : "w-64";

  return (
    <aside
      className={`
        ${width} h-screen sticky top-0 z-40
        bg-gradient-to-b from-emerald-700 via-emerald-700 to-emerald-900
        text-emerald-50 shadow-xl ring-1 ring-black/10
        flex flex-col
      `}
    >
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
          {items.map(({ to, label, icon: Icon, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `
                  group relative mx-2 flex items-center gap-3 rounded-xl
                  ${isActive ? "bg-white/10 text-white" : "text-emerald-100 hover:bg-white/5 hover:text-white"}
                  px-3 py-2 transition
                `
                }
                title={collapsed ? label : undefined}
              >
                {/* Active indicator bar */}
                <span
                  className={`
                    absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-full
                    ${pathname.startsWith(to) ? "bg-emerald-300" : "bg-transparent"}
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
          ))}
        </ul>
      </nav>

      {/* Profile + Collapse */}
      <div className="p-3 border-t border-white/10">
        {/* Mini profile */}
        <div
          className={`
            ${collapsed ? "justify-center" : "justify-between"}
            flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5
          `}
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/20 grid place-items-center text-sm font-medium">
              U
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <div className="text-sm">User Name</div>
                <div className="text-xs text-emerald-200">user@email.com</div>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="text-[10px] text-emerald-200/80 px-2 py-0.5 rounded bg-white/5">
              Owner
            </div>
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`
            mt-3 w-full inline-flex items-center justify-center gap-2
            rounded-lg bg-white/10 hover:bg-white/20 text-white
            px-3 py-2 transition
          `}
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




