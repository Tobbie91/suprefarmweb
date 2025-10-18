
// import { useEffect, useState } from "react";

// export function useGoogleMaps(apiKey?: string) {
//   const [ready, setReady] = useState<boolean>(!!(window as any).google);

//   useEffect(() => {
//     // no key → not ready, but don't crash
//     if (!apiKey) { setReady(false); return; }

//     // already present
//     if ((window as any).google) { setReady(true); return; }

//     const scriptId = "gmaps-js";
//     const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

//     const markReadyWhenAvailable = () => {
//       // poll up to ~15s but DO NOT throw
//       let tries = 0;
//       const tid = setInterval(() => {
//         if ((window as any).google) {
//           clearInterval(tid);
//           setReady(true);
//         } else if (++tries > 150) {
//           clearInterval(tid);
//           console.warn("[useGoogleMaps] window.google not found after 15s");
//           setReady(false);
//         }
//       }, 100);
//     };

//     if (existing) {
//       markReadyWhenAvailable();
//       return;
//     }

//     const s = document.createElement("script");
//     s.id = scriptId;
//     s.async = true;
//     s.defer = true;
//     s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
//     s.onload = () => setReady(!!(window as any).google);
//     s.onerror = () => {
//       console.warn("[useGoogleMaps] Failed to load Google Maps JS");
//       setReady(false);
//     };
//     document.head.appendChild(s);

//     // start polling
//     markReadyWhenAvailable();
//   }, [apiKey]);

//   return ready;
// }

import { useEffect, useState } from "react";

export function useGoogleMaps(apiKey?: string) {
  const [ready, setReady] = useState<boolean>(!!(window as any).google);

  useEffect(() => {
    if (!apiKey) return;

    if ((window as any).google?.maps) {
      setReady(true);
      return;
    }

    // If there is already a script, reuse it
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps]');
    if (existing) {
      existing.addEventListener('load', () => setReady(true), { once: true });
      return;
    }

    const s = document.createElement("script");
    s.dataset.googleMaps = "1";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places`;
    s.async = true;           // ✅ async
    s.defer = true;           // ✅ defer
    s.addEventListener("load", () => setReady(true), { once: true });
    s.addEventListener("error", () => setReady(false), { once: true });
    document.head.appendChild(s);
  }, [apiKey]);

  return ready;
}
