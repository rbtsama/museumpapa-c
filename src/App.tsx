import { useEffect, useRef, useState } from "react";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import AttractionDetail from "./pages/AttractionDetail";
import { LeaveGuardModal } from "./components/LeaveGuardModal";
import { popOverlay } from "./lib/useOverlay";
import { todayISO } from "./lib/dates";

// Lightweight app: Home list, an attraction Detail page, and the Account
// surface. Nav lives in the header (tap the name for Account; back chevrons
// return). The selected date is global so it carries between Home and Detail.
export type View = "home" | "profile" | "detail";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [profileTab, setProfileTab] = useState<"menu" | "cards">("menu");
  const [date, setDate] = useState<string>(() => todayISO());
  const [detailSlug, setDetailSlug] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const viewRef = useRef(view);
  viewRef.current = view;
  const bypassRef = useRef(false); // a confirmed Leave is in flight
  const seeded = useRef(false);

  // The browser Back gesture is kept inside the app by one guard history entry
  // that we re-arm after every pop. A Back press peels exactly one layer, in
  // order: an open sheet/modal → a sub-page (→ Home) → on Home, a friendly
  // bookmark nudge — never dropping straight off the site by accident.
  function openSub(v: Exclude<View, "home">, prep: () => void) {
    prep();
    setView(v);
  }
  function back() {
    window.history.back(); // run the same flow as a hardware / edge Back
  }
  function confirmLeave() {
    bypassRef.current = true;
    setLeaveOpen(false);
    window.history.go(-2); // past our guard + landing → the page before the app
  }
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      window.history.pushState({ guard: true }, ""); // seed the guard entry
    }
    const onPop = () => {
      if (bypassRef.current) {
        bypassRef.current = false;
        return; // a confirmed Leave — let it through
      }
      window.history.pushState({ guard: true }, ""); // re-arm for the next Back
      if (popOverlay()) return; // 1. close the topmost open sheet/modal
      if (viewRef.current !== "home") {
        setView("home"); // 2. a sub-page → Home
        setProfileTab("menu");
        return;
      }
      setLeaveOpen(true); // 3. on Home → nudge a bookmark before leaving
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[440px] flex-col">
      {view === "profile" ? (
        <Profile initialView={profileTab} onBack={back} />
      ) : view === "detail" && detailSlug ? (
        <AttractionDetail
          slug={detailSlug}
          date={date}
          onBack={back}
          onAddCard={() => openSub("profile", () => setProfileTab("cards"))}
        />
      ) : (
        <Home
          date={date}
          onDateChange={setDate}
          onOpenDetail={(slug) => openSub("detail", () => setDetailSlug(slug))}
          onProfile={() => openSub("profile", () => setProfileTab("menu"))}
          onAddCard={() => openSub("profile", () => setProfileTab("cards"))}
        />
      )}

      <LeaveGuardModal open={leaveOpen} onStay={() => setLeaveOpen(false)} onLeave={confirmLeave} />
    </div>
  );
}
