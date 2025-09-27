// src/lib/useGoogleMaps.ts
// import { useEffect } from "react";

// export function useGoogleMaps(apiKey?: string) {
//   useEffect(() => {
//     if (!apiKey || (window as any).google) return;
//     const s = document.createElement("script");
//     s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
//     s.async = true;
//     s.defer = true;
//     document.body.appendChild(s);
//     return () => { document.body.removeChild(s); };
//   }, [apiKey]);
// }
// src/lib/useGoogleMaps.ts
import { useEffect, useState } from "react";

export function useGoogleMaps(apiKey?: string) {
  const [ready, setReady] = useState<boolean>(!!(window as any).google);

  useEffect(() => {
    // no key → not ready, but don't crash
    if (!apiKey) { setReady(false); return; }

    // already present
    if ((window as any).google) { setReady(true); return; }

    const scriptId = "gmaps-js";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    const markReadyWhenAvailable = () => {
      // poll up to ~15s but DO NOT throw
      let tries = 0;
      const tid = setInterval(() => {
        if ((window as any).google) {
          clearInterval(tid);
          setReady(true);
        } else if (++tries > 150) {
          clearInterval(tid);
          console.warn("[useGoogleMaps] window.google not found after 15s");
          setReady(false);
        }
      }, 100);
    };

    if (existing) {
      markReadyWhenAvailable();
      return;
    }

    const s = document.createElement("script");
    s.id = scriptId;
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
    s.onload = () => setReady(!!(window as any).google);
    s.onerror = () => {
      console.warn("[useGoogleMaps] Failed to load Google Maps JS");
      setReady(false);
    };
    document.head.appendChild(s);

    // start polling
    markReadyWhenAvailable();
  }, [apiKey]);

  return ready;
}

