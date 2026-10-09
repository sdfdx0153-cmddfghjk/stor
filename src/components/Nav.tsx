import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Search, ShoppingBag, Menu, X, Clock } from "lucide-react";
import { cn } from "../utils/cn";
import type { StoreSettings } from "../lib/store";

const LINKS = [
  { label: "Shop", href: "#collection" },
  { label: "Reviews", href: "#reviews" },
  { label: "Why Ember", href: "#story" },
];

export type Countdown = { label: string; expired: boolean };

export function Nav({ settings, countdown }: { settings: StoreSettings; countdown: Countdown }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showBanner = settings.saleEnabled && !countdown.expired;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Flash-sale banner — tied to a real end date, hidden once expired */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-500",
          showBanner && !scrolled ? "max-h-11 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex items-center justify-center gap-2.5 bg-[#d70015] px-4 py-2 text-white sm:gap-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] sm:text-xs">Flash Sale — up to 30% off</span>
          <span className="hidden h-3.5 w-px bg-white/40 sm:block" />
          <span className="flex items-center gap-1.5 text-[11px] font-semibold tabular-nums sm:text-xs">
            <Clock className="h-3.5 w-3.5" strokeWidth={2.4} />
            Ends in {countdown.label}
          </span>
          <a href="#collection" className="hidden text-[11px] font-bold uppercase tracking-[0.16em] underline underline-offset-2 hover:opacity-80 sm:block">
            Shop now
          </a>
        </div>
      </div>

      {/* Nav bar */}
      <div
        className={cn(
          "border-b bg-white/70 backdrop-blur-xl transition-all duration-300",
          scrolled || !showBanner ? "border-black/[0.08]" : "border-transparent"
        )}
      >
        <nav className="mx-auto flex h-12 max-w-[1024px] items-center justify-between px-5">
          <a href="#/" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-ink">
              <Flame className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
            </span>
            <span className="text-[13px] font-semibold tracking-[-0.01em] text-ink">Ember Home</span>
          </a>

          <div className="hidden items-center gap-9 md:flex">
            {LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-[12px] text-ink/80 transition-colors duration-200 hover:text-ink">
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <button aria-label="Search" className="text-ink/80 transition-colors hover:text-ink">
              <Search className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <button aria-label="Shopping bag" className="text-ink/80 transition-colors hover:text-ink">
              <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
            </button>
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="text-ink/80 transition-colors hover:text-ink md:hidden"
          >
            {open ? <X className="h-5 w-5" strokeWidth={1.8} /> : <Menu className="h-5 w-5" strokeWidth={1.8} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden bg-white/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-6 py-5">
              {[...LINKS, { label: "Track My Order", href: "#/track" }].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-black/[0.05] py-2.5 text-[15px] font-medium text-ink last:border-0"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </header>
  );
}
