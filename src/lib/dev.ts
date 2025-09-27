// src/lib/dev.ts
export function devOverride(): boolean {
    try {
      const qs = new URLSearchParams(window.location.search);
      if (qs.get("dev") === "1") return true;
    } catch {}
    return (
      process.env.NODE_ENV === "development" ||
      localStorage.getItem("dev") === "1"
    );
  }
  