// src/routes.ts
export const ROUTES = {
    farm: "/farm/:slug",
    farmsList: "/farms",        // fallback when no active farm yet
    // ...others
  } as const;
  