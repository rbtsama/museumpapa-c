import { useEffect, useState } from "react";

// The user's library cards + home location. P1 keeps this in localStorage
// (guest); email accounts come later. Default seeds the operator's real wallet
// (Wakefield / Reading / BPL / Wilmington / Somerville) + Malden so the
// multi-supply case (Harvard) is visible out of the box.
export interface Wallet {
  email: string;
  name: string; // optional "what to call you" — top-right account entry
  cards: string[]; // library ids the user holds
  barcodes: Record<string, string>; // libId → card number (optional, for faster booking)
  liked: string[]; // attraction slugs, in the order they were liked (pinned to top)
  zip: string;
  location: { lat: number; lon: number }; // ZIP centroid (Wakefield fallback)
}

const KEY = "mp_wallet_v3"; // v3: adds per-card barcodes
const DEFAULT: Wallet = {
  email: "",
  name: "",
  cards: [],
  barcodes: {},
  liked: [],
  zip: "",
  location: { lat: 42.5045951, lon: -71.071918 },
};

export function loadWallet(): Wallet {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT;
}

export function saveWallet(w: Wallet) {
  localStorage.setItem(KEY, JSON.stringify(w));
}

// Tiny shared store so Home + Profile stay in sync without a router/state lib.
let current = loadWallet();
const listeners = new Set<(w: Wallet) => void>();

export function useWallet(): [Wallet, (w: Wallet) => void] {
  const [w, setW] = useState(current);
  useEffect(() => {
    const fn = (next: Wallet) => setW(next);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  const update = (next: Wallet) => {
    current = next;
    saveWallet(next);
    listeners.forEach((fn) => fn(next));
  };
  return [w, update];
}
