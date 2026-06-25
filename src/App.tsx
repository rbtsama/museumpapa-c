import { useEffect, useState } from "react";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import AttractionDetail from "./pages/AttractionDetail";
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

  // Keep the browser back gesture/button inside the app. Opening a sub-page
  // (detail / profile) pushes one history entry; the edge-swipe, Android back,
  // and our own back chevron all pop just that entry and land on Home — instead
  // of leaving the site entirely (which is what "back" did before, since the
  // SPA never wrote any history and the gesture popped the whole page out).
  function openSub(v: Exclude<View, "home">, prep: () => void) {
    prep();
    setView(v);
    window.history.pushState({ mp: v }, "");
  }
  function back() {
    if (window.history.state?.mp) window.history.back(); // → popstate → Home
    else {
      setView("home");
      setProfileTab("menu");
    }
  }
  useEffect(() => {
    const onPop = () => {
      setView("home");
      setProfileTab("menu");
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
    </div>
  );
}
