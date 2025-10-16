// src/state/FarmContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { useMyLands } from "../hooks/useFarmLink";


type Ctx = {
  currentFarmSlug: string | null;
  setCurrentFarmSlug: (slug: string | null) => void;
  myPlots: ReturnType<typeof useMyLands>["plots"];
  loading: boolean;
};

const FarmCtx = createContext<Ctx | null>(null);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, plots } = useMyLands();
  const [currentFarmSlug, setCurrentFarmSlug] = useState<string | null>(null);

  // default to first owned farm once loaded
  React.useEffect(() => {
    if (!loading && plots.length && !currentFarmSlug) {
      setCurrentFarmSlug(plots[0].farm_slug);
    }
  }, [loading, plots, currentFarmSlug]);

  const value = useMemo(() => ({
    currentFarmSlug, setCurrentFarmSlug, myPlots: plots, loading,
  }), [currentFarmSlug, plots, loading]);

  return <FarmCtx.Provider value={value}>{children}</FarmCtx.Provider>;
};

export const useFarmState = () => {
  const ctx = useContext(FarmCtx);
  if (!ctx) throw new Error("useFarmState must be used in <FarmProvider>");
  return ctx;
};
