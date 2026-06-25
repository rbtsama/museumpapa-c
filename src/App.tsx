import { useState } from "react";
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

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[440px] flex-col">
      {view === "profile" ? (
        <Profile initialView={profileTab} onBack={() => setView("home")} />
      ) : view === "detail" && detailSlug ? (
        <AttractionDetail
          slug={detailSlug}
          date={date}
          onBack={() => setView("home")}
          onAddCard={() => { setProfileTab("cards"); setView("profile"); }}
        />
      ) : (
        <Home
          date={date}
          onDateChange={setDate}
          onOpenDetail={(slug) => { setDetailSlug(slug); setView("detail"); }}
          onProfile={() => { setProfileTab("menu"); setView("profile"); }}
          onAddCard={() => { setProfileTab("cards"); setView("profile"); }}
        />
      )}
    </div>
  );
}
