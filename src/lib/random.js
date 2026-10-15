// Deterministic PRNG (mulberry32-style) so seeded mock data is identical on every load.
export function seededRandom(seed) {
  return () => {
    seed = (seed + 1831565813) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
