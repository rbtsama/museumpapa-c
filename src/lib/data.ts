import type { Attraction, DataBundle, Library, Pass } from "../data/types";

// Load the structured JSON snapshot served from /public/data and build indices.
// (P1 = static snapshot; live availability via /api comes in P2.)
let cache: Promise<DataBundle> | null = null;

export function loadData(): Promise<DataBundle> {
  if (cache) return cache;
  cache = (async () => {
    const [libs, attrs, passes] = await Promise.all([
      fetchList<Library>("/data/libraries.json", "libraries"),
      fetchList<Attraction>("/data/attractions.json", "attractions"),
      fetchList<Pass>("/data/passes.json", "passes"),
    ]);
    return {
      libraries: libs,
      attractions: attrs,
      passes,
      libById: new Map(libs.map((l) => [l.id, l])),
      attrBySlug: new Map(attrs.map((a) => [a.slug, a])),
    };
  })();
  return cache;
}

async function fetchList<T>(url: string, key: string): Promise<T[]> {
  const r = await fetch(url);
  const j = await r.json();
  return (Array.isArray(j) ? j : j[key]) as T[];
}
