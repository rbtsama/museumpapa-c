// One-tap "tell a friend" — the growth loop BRD leans on (moms recommending
// to other moms). Uses the native share sheet on mobile (WeChat / WhatsApp /
// Messages / copy link), falling back to clipboard on desktop.
//
// The shared LINK is always the homepage, never an attraction deep-link: a new
// visitor has to sign up / log in before any deal shows, so dropping them on a
// place they can't open would just confuse them. The TEXT still names the place
// so the share feels personal and marketing-warm.
const SITE_URL = "https://www.museumpapa.com";

// Marketing-flavoured, names the attraction, link inline (matches how a shared
// message actually reads in WeChat / WhatsApp).
export function shareText(attractionName?: string): string {
  const lead = attractionName
    ? `I found a great pass deal for ${attractionName} on MuseumPapa`
    : `I'm finding free & half-price museum passes on MuseumPapa`;
  return `${lead} — come check it out too! 🎟️ ${SITE_URL}`;
}

export type ShareOutcome = "shared" | "copied" | "dismissed" | "unavailable";

export async function shareApp(attractionName?: string): Promise<ShareOutcome> {
  const text = shareText(attractionName);
  // Put the link inside `text` and omit a separate `url` so the recipient sees
  // exactly one "message + link" blob (no platforms duplicating the URL).
  const data: ShareData = { title: "MuseumPapa", text };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return "shared";
    } catch (e) {
      // backing out of the native sheet throws AbortError — not a real failure
      if (e instanceof DOMException && e.name === "AbortError") return "dismissed";
      // anything else → fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "unavailable";
  }
}
