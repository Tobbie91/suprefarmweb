// import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// import * as toGeoJSON from "npm:@tmcw/togeojson";
// import JSZip from "npm:jszip";
// import * as turf from "npm:@turf/turf";
// import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

// serve(async (req: Request) => {
//     try {
//       const url = new URL(req.url);
//       const path = url.searchParams.get("path");
//       const slug = url.searchParams.get("slug") || "ilora-a";
//       const name = url.searchParams.get("name") || "Supre Farm — Ilora Block A";
//       if (!path) return new Response("Missing ?path=", { status: 400 });

//     const supa = Deno.env.get("SUPABASE_URL")!;
//     const key = Deno.env.get("SUPABASE_ANON_KEY")!; // or SERVICE_ROLE
//     const headers = { apikey: key, Authorization: `Bearer ${key}` };

//     // 1) download file from storage
//     const fileRes = await fetch(`${supa}/storage/v1/object/public/${path}`, { headers });
//     if (!fileRes.ok) throw new Error(`Storage fetch failed: ${fileRes.status}`);
//     const buf = new Uint8Array(await fileRes.arrayBuffer());

//     // 2) parse KML (supports KML/KMZ)
//     let kmlText: string;
//     if (path.toLowerCase().endsWith(".kmz")) {
//       const zip = await JSZip.loadAsync(buf);
//       const kmlFile = Object.keys(zip.files).find((p) => p.toLowerCase().endsWith(".kml"));
//       if (!kmlFile) throw new Error("No KML inside KMZ");
//       kmlText = await zip.files[kmlFile].async("text");
//     } else {
//       kmlText = new TextDecoder().decode(buf);
//     }
//     const dom = new DOMParser().parseFromString(kmlText, "text/xml");
//     const fc = toGeoJSON.kml(dom) as GeoJSON.FeatureCollection;

//     // 3) Split features: assume 1 boundary + many plot polygons
//     const polygons = fc.features.filter((f: { geometry: { type: string; }; }) =>
//       f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
//     );

//     // Use the largest polygon as farm boundary
//     let boundary: GeoJSON.Feature | null = null;
//     let maxArea = -1;
//     for (const f of polygons) {
//       const a = turf.area(f as any);
//       if (a > maxArea) { maxArea = a; boundary = f; }
//     }
//     if (!boundary) throw new Error("No boundary polygon found");

//     const boundaryHa = turf.area(boundary as any) / 10_000;
//     const c = turf.centroid(boundary as any).geometry as GeoJSON.Point;

//     // 4) Upsert farm
//     const upFarm = await fetch(`${supa}/rest/v1/farms`, {
//       method: "POST",
//       headers: { ...headers, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
//       body: JSON.stringify([{
//         slug, name,
//         centroid_lat: c.coordinates[1],
//         centroid_lon: c.coordinates[0],
//         boundary_geojson: boundary,
//         area_ha: boundaryHa
//       }])
//     });
//     if (!upFarm.ok) throw new Error(`Farm upsert failed: ${upFarm.status}`);
//     const [farm] = await upFarm.json();
//     const farm_id = farm.id;

//     // 5) Insert plots (every polygon except the boundary)
//     const plotRows = polygons
//       .filter((f) => f !== boundary)
//       .map((f, i) => {
//         const areaHa = turf.area(f as any) / 10_000;
//         const code = (f.properties?.name || f.properties?.Name || `P-${i + 1}`) as string;
//         return {
//           farm_id,
//           plot_code: code,
//           geom_geojson: f,
//           area_ha: Math.round(areaHa * 100) / 100,
//           metadata: f.properties || {},
//         };
//       });

//     if (plotRows.length) {
//       const ins = await fetch(`${supa}/rest/v1/plots`, {
//         method: "POST",
//         headers: { ...headers, "Content-Type": "application/json" },
//         body: JSON.stringify(plotRows)
//       });
//       if (!ins.ok) throw new Error(`Plots insert failed: ${ins.status}`);
//     }

//     return new Response(JSON.stringify({ ok: true, farm_id, plots: plotRows.length }), {
//       headers: { "Content-Type": "application/json" },
//     });
// } catch (e: unknown) {
//     const msg = e instanceof Error ? e.message : String(e);
//     return new Response(msg, { status: 500 });
//   }
// })

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import * as toGeoJSON from "npm:@tmcw/togeojson";
import JSZip from "npm:jszip";
import * as turf from "npm:@turf/turf";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path");
    const slug = url.searchParams.get("slug") || "ilora-block-a";
    const name = url.searchParams.get("name") || "Ilora Block A";
    if (!path) return new Response("Missing ?path=", { status: 400 });

    // 🔁 use the non-reserved names you set in secrets
    const supa = Deno.env.get("PROJECT_URL")!;
    const key = Deno.env.get("SERVICE_ROLE_KEY")!; // service role (server-only)
    const headers = { apikey: key, Authorization: `Bearer ${key}` };

    // download KMZ/KML from a PUBLIC bucket path like: maps/farm-ilora.kmz
    const fileRes = await fetch(`${supa}/storage/v1/object/public/${path}`, { headers });
    if (!fileRes.ok) throw new Error(`Storage fetch failed: ${fileRes.status}`);
    const buf = new Uint8Array(await fileRes.arrayBuffer());

    // parse KML/KMZ …
    let kmlText: string;
    if (path.toLowerCase().endsWith(".kmz")) {
      const zip = await JSZip.loadAsync(buf);
      const kmlFile = Object.keys(zip.files).find((p) => p.toLowerCase().endsWith(".kml"));
      if (!kmlFile) throw new Error("No KML inside KMZ");
      kmlText = await zip.files[kmlFile].async("text");
    } else {
      kmlText = new TextDecoder().decode(buf);
    }
    const dom = new DOMParser().parseFromString(kmlText, "text/xml");
    const fc = toGeoJSON.kml(dom) as GeoJSON.FeatureCollection;

    const polygons = fc.features.filter(
      (f) => f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
    );

    // largest polygon = boundary
    let boundary: GeoJSON.Feature | null = null;
    let maxArea = -1;
    for (const f of polygons) {
      const a = turf.area(f as any);
      if (a > maxArea) { maxArea = a; boundary = f; }
    }
    if (!boundary) throw new Error("No boundary polygon found");

    const boundaryHa = turf.area(boundary as any) / 10_000;
    const c = turf.centroid(boundary as any).geometry as GeoJSON.Point;

    // upsert farm
    const upFarm = await fetch(`${supa}/rest/v1/farms`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify([{
        slug, name,
        centroid_lat: c.coordinates[1],
        centroid_lon: c.coordinates[0],
        boundary_geojson: boundary,
        area_ha: boundaryHa
      }]),
    });
    if (!upFarm.ok) throw new Error(`Farm upsert failed: ${upFarm.status}`);
    const [farm] = await upFarm.json();
    const farm_id = farm.id;

    // insert plots (everything except boundary)
    const plotRows = polygons
      .filter((f) => f !== boundary)
      .map((f, i) => {
        const areaHa = turf.area(f as any) / 10_000;
        const code = (f.properties?.name || f.properties?.Name || `P-${i + 1}`) as string;
        return {
          farm_id,
          plot_code: code,
          geom_geojson: f,
          area_ha: Math.round(areaHa * 100) / 100,
          metadata: f.properties || {},
        };
      });

    if (plotRows.length) {
      const ins = await fetch(`${supa}/rest/v1/plots`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(plotRows),
      });
      if (!ins.ok) throw new Error(`Plots insert failed: ${ins.status}`);
    }

    return new Response(JSON.stringify({ ok: true, farm_id, plots: plotRows.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(msg, { status: 500 });
  }
});
