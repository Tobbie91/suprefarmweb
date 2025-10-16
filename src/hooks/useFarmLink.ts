// src/hooks/useMyLands.ts
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export type MyPlot = {
  plot_id: string;
  plot_code: string | null;
  farm_id: string;
  farm_slug: string;
  farm_name: string;
  units: number;
};

export function useMyLands() {
  const [loading, setLoading] = useState(true);
  const [plots, setPlots] = useState<MyPlot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u?.user) return setPlots([]);

        // Ownerships -> plots -> farms (select chained)
        const { data, error } = await supabase
          .from("ownerships")
          .select(`
            units,
            plot:plots(
              id, plot_code, farm_id,
              farm:farms(id, slug, name)
            )
          `);

        if (error) throw error;

        const mapped: MyPlot[] = (data ?? []).map((row: any) => ({
          plot_id: row.plot?.id,
          plot_code: row.plot?.plot_code ?? null,
          farm_id: row.plot?.farm?.id,
          farm_slug: row.plot?.farm?.slug,
          farm_name: row.plot?.farm?.name,
          units: row.units ?? 0,
        }));

        setPlots(mapped);
      } catch (e: any) {
        setError(e?.message || "Failed to load your lands");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { loading, plots, error };
}
