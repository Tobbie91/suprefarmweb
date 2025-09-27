// // src/components/GoogleMutantLayer.tsx
// import { createLayerComponent } from "@react-leaflet/core";
// import L from "leaflet";
// import "leaflet.gridlayer.googlemutant";

// type Props = L.GridLayerOptions & {
//   type?: "roadmap" | "satellite" | "terrain" | "hybrid";
// };

// function createMutant(props: Props, ctx: any) {
//   const instance = (L.gridLayer as any).googleMutant({
//     type: props.type ?? "roadmap",
//     maxZoom: 22,
//   });
//   return { instance, context: { ...ctx, layerContainer: instance } };
// }

// export const GoogleMutantLayer = createLayerComponent<any, Props>(createMutant);


import { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import "leaflet.gridlayer.googlemutant"; // IMPORTANT: registers L.gridLayer.googleMutant

type Props = { type?: "roadmap" | "satellite" | "hybrid" | "terrain" };

export function GoogleMutantLayer({ type = "satellite" }: Props) {
  const map = useMap();

  useEffect(() => {
    const hasGoogle = !!(window as any).google;
    const hasMutant = (L as any).gridLayer?.googleMutant;
    if (!hasGoogle || !hasMutant) return;

    const layer = (L as any).gridLayer.googleMutant({ type });
    layer.addTo(map);
    return () => {
      try { map.removeLayer(layer); } catch {}
    };
  }, [map, type]);

  return null;
}
