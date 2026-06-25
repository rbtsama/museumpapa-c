import { useEffect, useState } from "react";
import type { DataBundle } from "../data/types";
import { loadData } from "../lib/data";
import { useWallet } from "../store/wallet";
import { CardPicker } from "../components/CardPicker";
import { PageHeader } from "../components/PageHeader";

// Account settings: edit first name, edit ZIP, manage library cards (shared
// CardPicker sub-page, with Confirm/Cancel), and log out (at the bottom).
export default function Profile({ onBack, initialView = "menu" }: { onBack: () => void; initialView?: "menu" | "cards" }) {
  const [data, setData] = useState<DataBundle | null>(null);
  const [wallet, setWallet] = useWallet();
  const [view, setView] = useState<"menu" | "cards">(initialView);

  useEffect(() => {
    loadData().then(setData);
  }, []);

  if (view === "cards") {
    return (
      <CardPicker
        libraries={data?.libraries ?? []}
        initialCards={wallet.cards}
        initialBarcodes={wallet.barcodes}
        title="Your library cards"
        onConfirm={(c, b) => { setWallet({ ...wallet, cards: c, barcodes: b }); setView("menu"); }}
        onCancel={() => setView("menu")}
      />
    );
  }

  const held = wallet.cards.length;
  return (
    <div className="page-bg flex min-h-[100dvh] flex-col">
      <PageHeader title="Account" onBack={onBack} />

      <main className="flex flex-1 flex-col px-4 pb-10">
        <Field label="First name">
          <input value={wallet.name} onChange={(e) => setWallet({ ...wallet, name: e.target.value })} autoComplete="off" placeholder="Your name" className={inputCls} />
        </Field>

        <Field label="Resident ZIP code">
          <input value={wallet.zip} onChange={(e) => setWallet({ ...wallet, zip: e.target.value.replace(/\D/g, "").slice(0, 5) })} inputMode="numeric" autoComplete="off" className={inputCls} />
        </Field>

        <div className="mt-5">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Library cards</span>
          <button onClick={() => setView("cards")} className="mt-1.5 flex w-full items-center justify-between rounded-[12px] border border-edge bg-white px-3.5 py-3 text-left">
            <span>
              <span className="block text-[14px] font-semibold text-ink">Your library cards</span>
              <span className="block text-[12px] text-ink-faint">{held ? `${held} card${held > 1 ? "s" : ""} — tap to add or fill in numbers` : "Add the cards you have"}</span>
            </span>
            <span className="text-[14px] font-bold text-brand">Manage →</span>
          </button>
        </div>

        <button
          onClick={() => {
            setWallet({ ...wallet, email: "", name: "", cards: [], barcodes: {}, liked: [] });
            window.location.reload();
          }}
          className="mt-auto w-full rounded-[10px] border border-edge bg-white py-3 text-[14px] font-semibold text-ink-soft"
        >
          Log out
        </button>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-[10px] border border-edge bg-white px-3.5 py-2.5 text-[16px] outline-none focus:border-brand";
