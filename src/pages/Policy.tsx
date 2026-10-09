import { motion } from "framer-motion";
import { Flame, ArrowLeft, Mail, Truck, RotateCcw, PackageSearch } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type PolicyContent = {
  icon: typeof Truck;
  title: string;
  updated: string;
  sections: { h: string; p: string }[];
};

const PAGES: Record<string, PolicyContent> = {
  shipping: {
    icon: Truck,
    title: "Shipping Policy",
    updated: "Last updated: January 2026",
    sections: [
      {
        h: "Processing time",
        p: "Orders are handed to our fulfillment partner WED2C within 1–2 business days of purchase. You'll receive an email confirmation the moment your order is processed.",
      },
      {
        h: "Delivery estimates",
        p: "Standard tracked shipping to the United States takes 5–12 business days depending on destination and carrier volume. Delivery is free on every order — the price you see is the price you pay.",
      },
      {
        h: "Tracking",
        p: "Every parcel ships with a tracking number. It is emailed to you automatically when your order dispatches; you can follow it via the carrier link in that email or on our Track My Order page.",
      },
      {
        h: "Delays & lost parcels",
        p: "Carrier delays (weather, peak season) are outside our control, but never outside our responsibility. If your order hasn't arrived within 30 days of dispatch, contact us and we'll re-ship or refund in full — your choice.",
      },
    ],
  },
  refunds: {
    icon: RotateCcw,
    title: "Refund Policy",
    updated: "Last updated: January 2026",
    sections: [
      {
        h: "30-day home trial",
        p: "Live with your purchase for 30 days. If it doesn't earn its place in your home, email warmth@emberhome.co with your order number and we'll start a return — no interrogation, no restocking fees.",
      },
      {
        h: "Condition",
        p: "Items should be returned in their original packaging where possible. We understand products need to be opened and used to be judged — normal use is absolutely fine.",
      },
      {
        h: "Refund timing",
        p: "Refunds are issued to your original payment method within 5–10 business days of the return being received or, for damaged/incorrect items, immediately upon photo confirmation.",
      },
      {
        h: "Damaged or wrong items",
        p: "If something arrives broken or isn't what you ordered, send us a photo within 14 days of delivery. We replace or refund immediately — you won't be asked to ship broken glass back across the country.",
      },
    ],
  },
  track: {
    icon: PackageSearch,
    title: "Track My Order",
    updated: "Support answers within 24 hours, 7 days a week",
    sections: [
      {
        h: "Where is my tracking number?",
        p: "Your tracking number is emailed automatically as soon as your order dispatches (usually 1–2 business days after purchase). Check your spam/promotions folder for a message from our fulfillment partner WED2C.",
      },
      {
        h: "Tracking hasn't updated",
        p: "International parcels commonly go quiet for 3–5 days between carrier scans — this is normal while the package is in transit between hubs. If there's been no movement for 10+ days, contact us and we'll chase it down.",
      },
      {
        h: "Ask a human",
        p: "Email warmth@emberhome.co with your order number and the email address you used at checkout. We'll reply with a live status check and an honest delivery estimate.",
      },
    ],
  },
};

export default function Policy({ page }: { page: string }) {
  const content = PAGES[page] ?? PAGES.shipping;
  const Icon = content.icon;

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="border-b border-black/[0.08] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-[1024px] items-center justify-between px-5">
          <a href="#/" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-ink">
              <Flame className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
            </span>
            <span className="text-[13px] font-semibold text-ink">Ember Home</span>
          </a>
          <a href="#/" className="flex items-center gap-1 text-[12px] text-sub transition-colors hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to store
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fog">
            <Icon className="h-6 w-6 text-ink/70" strokeWidth={1.7} />
          </span>
          <h1 className="mt-5 text-[34px] font-semibold tracking-[-0.02em] text-ink sm:text-[44px]">{content.title}</h1>
          <p className="mt-2 text-[13px] text-sub">{content.updated}</p>

          <div className="mt-10 space-y-9">
            {content.sections.map((s) => (
              <section key={s.h} className="border-b border-black/[0.06] pb-9 last:border-0">
                <h2 className="text-[17px] font-semibold text-ink">{s.h}</h2>
                <p className="mt-2.5 text-[15px] leading-relaxed text-sub">{s.p}</p>
              </section>
            ))}
          </div>

          <div className="mt-4 flex flex-col items-start justify-between gap-4 rounded-[24px] bg-fog p-6 sm:flex-row sm:items-center">
            <p className="text-[14px] text-sub">Still stuck? Real humans reply within 24 hours.</p>
            <a
              href="mailto:warmth@emberhome.co"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
            >
              <Mail className="h-4 w-4" /> warmth@emberhome.co
            </a>
          </div>

          <div className="mt-10 flex gap-6 text-[12px] text-sub">
            <a href="#/shipping" className={page === "shipping" ? "font-semibold text-ink" : "hover:text-ink"}>Shipping Policy</a>
            <a href="#/refunds" className={page === "refunds" ? "font-semibold text-ink" : "hover:text-ink"}>Refund Policy</a>
            <a href="#/track" className={page === "track" ? "font-semibold text-ink" : "hover:text-ink"}>Track My Order</a>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-black/[0.06] bg-fog">
        <p className="mx-auto max-w-[1024px] px-5 py-6 text-[12px] text-sub">© 2026 Ember Home. All rights reserved.</p>
      </footer>
    </div>
  );
}
