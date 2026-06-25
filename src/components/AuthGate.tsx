import { useEffect, useState } from "react";
import { CardPicker } from "./CardPicker";

export interface AuthResult {
  email: string;
  name?: string;
  zip?: string;
  cards?: string[];
  barcodes?: Record<string, string>;
  liked?: string[];
}
interface Lib {
  id: string;
  town: string;
  network: string;
}

// ── Demo ("fuzzy") accounts ─────────────────────────────────────────────────
// Profiles are baked into source so they survive every Vercel redeploy and git
// update (localStorage is only a per-device runtime cache, not durable). Each
// demo seeds home ZIP + held library cards so deals unlock on login.
//
// Card numbers and favorites are LEFT EMPTY on purpose — the operator adds their
// own per device (Account → cards, ♥ on attractions). Real library barcodes must
// NEVER be hard-coded here: a public client bundle is world-readable, and the
// project rule forbids card numbers reaching any remote.
interface DemoProfile {
  pw: string;
  name: string;
  zip: string;
  cards: string[];
}

const DEMO: Record<string, DemoProfile> = {
  "admin@gmail.com": {
    pw: "admin",
    name: "Admin",
    zip: "01880",
    cards: ["wakefield", "reading", "bpl", "malden", "wilmington", "somerville"],
  },
  "alex@gmail.com": {
    pw: "alex",
    name: "Alex",
    zip: "01880",
    cards: ["wakefield", "bpl", "somerville"],
  },
  "jiayuan@gmail.com": {
    pw: "jiayuan",
    name: "Jiayuan",
    zip: "01880",
    cards: ["reading", "malden", "wilmington"],
  },
};
// rbt simulates an account whose verification email hasn't been clicked yet.
const UNVERIFIED: Record<string, string> = { "rbt@gmail.com": "rbt" };

type Mode = "login" | "signup" | "cards" | "verify";
type LoginStatus = "idle" | "error" | "unverified";

export function AuthGate({ onAuth, libraries }: { onAuth: (r: AuthResult) => void; libraries: Lib[] }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [zip, setZip] = useState("");
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [resent, setResent] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [barcodes, setBarcodes] = useState<Record<string, string>>({});

  const emailOk = /\S+@\S+\.\S+/.test(email);
  const canLogin = emailOk && pw.length >= 1;
  // must also pick at least one library card — that's what unlocks deals
  const canCreate = emailOk && /^\d{5}$/.test(zip) && name.trim().length > 0 && picked.length >= 1;

  // simulate the user clicking the email's verification link: after the verify
  // screen shows, confirm and log them in (→ home). No button to press here.
  useEffect(() => {
    if (mode !== "verify") return;
    const t = setTimeout(() => onAuth({ email, name: name.trim(), zip, cards: picked, barcodes }), 2600);
    return () => clearTimeout(t);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  function login() {
    const u = email.trim().toLowerCase();
    const p = DEMO[u];
    if (p && p.pw === pw)
      return onAuth({ email: u, name: p.name, zip: p.zip, cards: p.cards });
    if (UNVERIFIED[u] === pw) return setStatus("unverified");
    setStatus("error");
  }

  // ── shared card-picker page ─────────────────────────────────────────────
  if (mode === "cards") {
    return (
      <CardPicker
        libraries={libraries}
        initialCards={picked}
        initialBarcodes={barcodes}
        title="Choose your library cards"
        onConfirm={(c, b) => { setPicked(c); setBarcodes(b); setMode("signup"); }}
        onCancel={() => setMode("signup")}
      />
    );
  }

  // ── login / signup / verify — vertically centred, nudged up a little ─────
  return (
    <div className="page-bg flex min-h-[100dvh] w-full flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-[400px]" style={{ transform: "translateY(-5vh)" }}>
        <div className="mb-6 text-center">
          <div className="font-display text-[28px] font-semibold tracking-tight">
            Museum<span className="text-brand">Papa</span>
          </div>
          <p className="mt-1.5 text-[14px] text-ink-soft">Free & half-price museums with your library card.</p>
        </div>

        <div className="glass rounded-[16px] border border-white/50 p-5 shadow-card">
          {mode === "verify" ? (
            <div className="text-center">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-[28px]">✉️</div>
              <p className="mx-auto max-w-[300px] text-[14px] leading-relaxed text-ink">
                We sent a verification link to <b>{email}</b>. Open it to activate your account — we'll sign you in automatically.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-ink-faint">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-soft border-t-brand" />
                Waiting for you to confirm…
              </div>
              <div className="mt-4 text-[12px] text-ink-faint">
                Didn't get it? <button onClick={() => setResent(true)} className="font-semibold text-brand">{resent ? "Sent ✓" : "Resend"}</button>
                {"  ·  "}
                <button onClick={() => setMode("signup")} className="font-semibold text-brand">Wrong email?</button>
              </div>
            </div>
          ) : mode === "login" ? (
            <>
              <div className="space-y-3">
                <input type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }} placeholder="Email" className={inputCls} />
                <input type="password" autoComplete="current-password" value={pw} onChange={(e) => { setPw(e.target.value); setStatus("idle"); }} onKeyDown={(e) => e.key === "Enter" && canLogin && login()} placeholder="Password" className={inputCls} />
              </div>

              {status === "error" && (
                <p className="mt-2.5 text-[12px] font-medium text-[#b3261e]">That email and password don't match. Check them and try again.</p>
              )}
              {status === "unverified" && (
                <div className="mt-3 rounded-[10px] border border-[#f0d9b0] bg-[#fdf3e3] p-3">
                  <p className="text-[12px] leading-relaxed text-[#8a5a12]">
                    Check your inbox — we sent a verification link to <b>{email}</b>. Click it to finish signing in.
                  </p>
                  <button onClick={() => setResent(true)} className="mt-2 text-[12px] font-bold text-brand">
                    {resent ? "Email sent ✓" : "Resend email"}
                  </button>
                </div>
              )}

              <button onClick={login} disabled={!canLogin} className={btnCls}>Log in</button>
              <p className="mt-3 text-center text-[12px] text-ink-faint">
                New here? <button onClick={() => { setMode("signup"); setStatus("idle"); }} className="font-semibold text-brand">Sign up</button>
              </p>
            </>
          ) : (
            <>
              {/* account info */}
              <div className="space-y-3">
                <input autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} placeholder="First name" className={inputCls} />
                <input type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputCls} />
              </div>

              {/* separated: what we need to find passes you can use */}
              <div className="mt-4 border-t border-edge pt-4">
                <p className="text-[12px] leading-relaxed text-ink-soft">
                  To find passes you can actually use, we need your home ZIP and the library cards you hold.
                </p>
                <div className="mt-3 space-y-3">
                  <input autoComplete="off" value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" placeholder="Resident ZIP code" className={inputCls} />
                  <button onClick={() => setMode("cards")} className="flex w-full items-center justify-between rounded-[10px] border border-edge bg-white px-3.5 py-2.5 text-[14px] text-ink">
                    <span>Your library cards{picked.length ? ` · ${picked.length}` : ""}</span>
                    <span className="font-bold text-brand">Choose →</span>
                  </button>
                </div>
              </div>

              <button onClick={() => { setResent(false); setMode("verify"); }} disabled={!canCreate} className={btnCls}>
                Create account
              </button>
              <p className="mt-3 text-center text-[12px] text-ink-faint">
                Have an account? <button onClick={() => setMode("login")} className="font-semibold text-brand">Log in</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-[10px] border border-edge bg-white px-3.5 py-2.5 text-[16px] text-ink placeholder:text-ink-faint outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";
const btnCls = "mt-4 w-full rounded-[10px] bg-brand py-3 text-[16px] font-bold text-white transition disabled:opacity-40";
