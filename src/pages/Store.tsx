import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  ArrowUpRight,
  Truck,
  RotateCcw,
  Lock,
  Flame,
  Star,
  BadgeCheck,
  Mail,
  Search,
} from "lucide-react";
import { Nav } from "../components/Nav";
import {
  fetchProducts,
  fetchReviews,
  fetchSettings,
  seedDB,
  fmt,
  discountPct,
  LOW_STOCK_THRESHOLD,
  type Product,
  type Review,
  type StoreSettings,
} from "../lib/store";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const pad = (n: number) => String(n).padStart(2, "0");

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Ticks toward the persisted sale end — a real date that survives refreshes. */
function useSaleCountdown(endISO: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(endISO).getTime() - now);
  const days = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const label = days > 0 ? `${days}d : ${pad(h)}h : ${pad(m)}m` : `${pad(h)} : ${pad(m)} : ${pad(s)}`;
  return { label, expired: diff === 0, h, m, s };
}

function Stars({ n = 5, className = "h-3.5 w-3.5" }: { n?: number; className?: string }) {
  return (
    <span className="flex items-center gap-[2px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${className} ${i < n ? "fill-[#ff9f0a] text-[#ff9f0a]" : "fill-black/[0.08] text-black/[0.08]"}`} strokeWidth={1} />
      ))}
    </span>
  );
}

/* ------------------------------- Product card ------------------------------ */

function ProductCard({ product, index }: { product: Product; index: number }) {
  const pct = discountPct(product);
  const soldOut = product.stock <= 0;
  const low = !soldOut && product.stock <= LOW_STOCK_THRESHOLD;

  return (
    <Reveal delay={0.05 * (index % 3)} className="h-full">
      <article className="group flex h-full flex-col">
        <div className="relative aspect-square overflow-hidden rounded-[28px] bg-fog">
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045] ${soldOut ? "opacity-60 grayscale-[0.4]" : ""}`}
          />
          {pct !== null && !soldOut && (
            <span className="absolute left-5 top-5 rounded-full bg-[#d70015] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              −{pct}%
            </span>
          )}
          {soldOut && (
            <span className="absolute left-5 top-5 rounded-full bg-ink px-3 py-1 text-[11px] font-bold text-white">Sold out</span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-1.5 pt-5">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{product.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-sub">{product.description}</p>

          <p className="mt-3 flex items-baseline gap-2">
            <span className={`text-[16px] font-bold ${pct !== null ? "text-[#d70015]" : "text-ink"}`}>{fmt(product.price)}</span>
            {pct !== null && <span className="text-[13px] text-sub line-through">{fmt(product.compareAtPrice!)}</span>}
          </p>

          {soldOut ? (
            <span className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-black/[0.08] px-5 py-3 text-[14px] font-medium text-sub">
              Notify Me When Back
            </span>
          ) : (
            <a
              href={product.wed2cLink}
              rel="sponsored"
              className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-full bg-azure px-5 py-3 text-[15px] font-medium text-white transition-all duration-200 hover:bg-azure-hover active:scale-[0.98]"
            >
              Buy Now
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
            </a>
          )}

          {/* Stock line — driven by the real inventory number you set in /admin */}
          <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[12px] font-medium">
            {soldOut ? (
              <span className="text-sub">Restocking soon</span>
            ) : low ? (
              <span className="flex items-center gap-1.5 text-[#d70015]">
                <Flame className="h-3.5 w-3.5 animate-pulse" strokeWidth={2.4} />
                Low stock — only {product.stock} left at this price
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#248a3d]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#248a3d]" />
                In stock — ships within 24 hours
              </span>
            )}
          </div>

          {/* Honest trust row — factual policies, no unearned third-party seals */}
          <div className="mt-3 flex items-center justify-center gap-3 border-t border-black/[0.06] pt-3 text-[10px] font-medium text-sub">
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Secure checkout</span>
            <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Tracked shipping</span>
            <span className="flex items-center gap-1"><RotateCcw className="h-3 w-3" /> 30-day returns</span>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-sub/70">Visa · Mastercard · PayPal — via WED2C</p>
        </div>
      </article>
    </Reveal>
  );
}

/* ------------------------------ Reviews section ---------------------------- */

function ReviewsSection({ reviews, products }: { reviews: Review[]; products: Product[] }) {
  const productName = (id: string) => products.find((p) => p.id === id)?.name;

  return (
    <section id="reviews" className="border-t border-black/[0.06]">
      <div className="mx-auto max-w-[1024px] px-5 py-16 sm:py-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-ink sm:text-[36px]">
                What customers say.
              </h2>
              <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-sub">
                Every review here comes from a real post-purchase email. We publish the good and the bad — nothing is
                invented, ever.
              </p>
            </div>
            <a
              href="mailto:reviews@emberhome.co?subject=My%20Ember%20Home%20review"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink px-5 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-ink hover:text-white"
            >
              <Mail className="h-3.5 w-3.5" /> Share your experience
            </a>
          </div>
        </Reveal>

        {reviews.length === 0 ? (
          <Reveal delay={0.1}>
            <div className="mt-10 rounded-[28px] border border-dashed border-[#d2d2d7] py-20 text-center">
              <Stars n={5} className="h-5 w-5 mx-auto" />
              <p className="mt-4 text-[15px] font-semibold text-ink">Reviews are coming in with the first orders.</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-sub">
                Bought something? Your honest words help the next shopper more than any ad ever could — and they'll
                appear right here.
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <Reveal key={r.id} delay={0.05 * (i % 3)}>
                <figure className="flex h-full flex-col rounded-[24px] border border-black/[0.08] bg-white p-6">
                  <Stars n={r.rating} />
                  <blockquote className="mt-3 flex-1 text-[14px] leading-relaxed text-ink/90">"{r.text}"</blockquote>
                  <figcaption className="mt-5 border-t border-black/[0.06] pt-4">
                    <p className="text-[13px] font-semibold text-ink">
                      {r.name}
                      <span className="font-normal text-sub"> · {r.location}</span>
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-sub">
                      {r.verified && (
                        <span className="flex items-center gap-1 font-medium text-[#248a3d]">
                          <BadgeCheck className="h-3.5 w-3.5" /> Verified purchase
                        </span>
                      )}
                      {productName(r.productId) && <span>{productName(r.productId)}</span>}
                    </p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------- Store ---------------------------------- */

export default function Store() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({ saleEnabled: true, saleEnd: new Date().toISOString() });
  const [query, setQuery] = useState("");
  const [apiOk, setApiOk] = useState(true);
  const countdown = useSaleCountdown(settings.saleEnd);
  const [barVisible, setBarVisible] = useState(true);

  useEffect(() => {
    seedDB()
      .then(() => Promise.all([fetchProducts(), fetchReviews(), fetchSettings()]))
      .then(([p, r, s]) => { setProducts(p); setReviews(r); setSettings(s); setApiOk(true); })
      .catch(() => { setApiOk(false); });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const nearFooter = window.innerHeight + window.scrollY > document.body.scrollHeight - 380;
      setBarVisible(window.scrollY > 420 && !nearFooter);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filteredProducts = products.filter((p) => {
    const hay = `${p.name} ${p.description}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  return (
    <div className="min-h-screen bg-white text-ink">
      <Nav settings={settings} countdown={countdown} />

      {/* Hero */}
      <section className="px-4 pt-28 sm:pt-36">
        <div className="mx-auto max-w-[1024px] text-center">
          <Reveal>
            <p className="text-[13px] font-semibold tracking-wide text-[#d70015]">Flash Sale — ends Sunday night</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="mx-auto mt-3 max-w-3xl text-[42px] font-semibold leading-[1.04] tracking-[-0.028em] text-ink sm:text-[68px]">
              Calm, beautifully engineered.
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-sub sm:text-[19px]">
              Six considered objects that make quiet rooms feel warmer — tracked shipping and 30-day returns on
              everything.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <a href="#collection" className="mt-6 inline-flex items-center gap-0.5 text-[15px] text-azure transition-opacity hover:opacity-70">
              Shop the collection
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </a>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mx-auto mt-12 max-w-[1024px] sm:mt-16">
          <div className="relative overflow-hidden rounded-[30px] bg-fog">
            <img
              src="/images/offer.jpg"
              alt="The Flame Aroma Diffuser family in three finishes"
              className="h-[400px] w-full object-cover sm:h-[560px]"
              fetchPriority="high"
            />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto">
              <div className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-white/75 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-5 sm:p-4 sm:pl-5">
                <div>
                  <p className="text-[15px] font-semibold text-ink">The Flame Diffuser Family</p>
                  <p className="text-[13px] text-sub">
                    From <span className="font-semibold text-[#d70015]">{fmt(59)}</span>{" "}
                    <span className="line-through">{fmt(84)}</span> during the Flash Sale
                  </p>
                </div>
                <a
                  href="#collection"
                  className="inline-flex items-center justify-center rounded-full bg-azure px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-azure-hover"
                >
                  Buy
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Feature strip */}
      <section className="mt-16 border-y border-black/[0.06] bg-fog/60 sm:mt-24">
        <div className="mx-auto grid max-w-[1024px] grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-3 sm:py-10">
          {[
            { icon: Truck, title: "Free tracked shipping", text: "Every order gets a tracking link by email." },
            { icon: RotateCcw, title: "30-day returns", text: "Not in love? Full refund, no interrogation." },
            { icon: Lock, title: "Secure checkout", text: "Payment is processed by WED2C over SSL." },
          ].map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={0.05 * i}>
              <div className="flex items-start gap-3.5 sm:flex-col sm:gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ink/70 sm:mt-0" strokeWidth={1.6} />
                <div>
                  <p className="text-[14px] font-semibold text-ink">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-sub">{text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Collection */}
      <section id="collection" className="mx-auto max-w-[1024px] px-5 py-16 sm:py-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-ink sm:text-[36px]">The Collection.</h2>
              <p className="mt-1 pb-1 text-[13px] text-sub">
                {products.length} objects · prices crossed out are our former selling prices
              </p>
            </div>
            <label className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sub/70" strokeWidth={2} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-full border border-black/[0.08] bg-fog px-11 py-3 text-[14px] text-ink outline-none transition-all placeholder:text-sub/60 focus:border-azure focus:bg-white focus:ring-4 focus:ring-azure/10"
              />
            </label>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="rounded-[28px] border border-dashed border-line py-24 text-center">
            {!apiOk ? (
              <>
                <p className="text-[17px] font-semibold text-ink">⚠️ Server not connected</p>
                <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-sub">
                  This page needs the Express server running to load products from the database.
                  Open your terminal and run:
                </p>
                <code className="mt-3 inline-block rounded-xl bg-ink px-5 py-3 text-left text-[13px] text-white">
                  node server.js
                </code>
                <p className="mt-3 text-[13px] text-sub">
                  Then open <span className="font-medium text-ink">http://localhost:3000</span> — not the HTML file directly.
                </p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-medium text-ink">No products yet.</p>
                <p className="mt-1 text-[13px] text-sub">
                  Go to <a href="#/admin" className="text-azure hover:underline">#/admin</a> to add your first product.
                </p>
              </>
            )}
          </div>
        )}

        {products.length > 0 && filteredProducts.length === 0 && (
          <div className="rounded-[28px] border border-dashed border-line py-18 text-center">
            <p className="text-[15px] font-medium text-ink">No matches for “{query}”.</p>
            <p className="mt-1 text-[13px] text-sub">Try a broader keyword like diffuser, lamp, projector, or warmer.</p>
          </div>
        )}
      </section>

      <ReviewsSection reviews={reviews} products={products} />

      {/* Editorial */}
      <section id="story" className="mx-auto max-w-[1024px] px-4 py-16 sm:py-24">
        <Reveal>
          <div className="grid overflow-hidden rounded-[30px] bg-fog md:grid-cols-2">
            <div className="flex flex-col justify-center px-8 py-12 sm:px-12 sm:py-16">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-sub">Why Ember Home</p>
              <h3 className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[32px]">
                Fewer, better things.
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-sub">
                Every object survives a month of daily use in our own homes before it earns a place here — for how it
                works, how it ages, and how it makes a room feel at 11 pm.
              </p>
              <a href="#collection" className="mt-6 inline-flex items-center gap-0.5 text-[15px] text-azure transition-opacity hover:opacity-70">
                Browse what made the cut
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </a>
            </div>
            <div className="relative min-h-[280px] md:min-h-0">
              <img src="/images/story.jpg" alt="A cozy evening scene with a warm glowing diffuser" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="border-t border-black/[0.06] bg-fog/50">
        <div className="mx-auto max-w-[720px] px-5 py-16 sm:py-20">
          <Reveal>
            <div className="rounded-[28px] border border-black/[0.08] bg-white p-7 sm:p-9">
              <p className="text-[20px] font-semibold text-ink">Quick answers</p>
              <div className="mt-6 divide-y divide-black/[0.06]">
                {[
                  ["How long does shipping take?", "Most US orders arrive in 5–12 business days with tracking emailed automatically after dispatch."],
                  ["Can I return a product?", "Yes — every order is covered by a 30-day return window. If it doesn't fit your space, email us and we'll handle it."],
                  ["Are the low-stock numbers live?", `Yes. They come from the real stock value you set in our inventory management. Products at ${LOW_STOCK_THRESHOLD} or fewer show the low-stock warning.`],
                  ["Where do I track my order?", "Use the Track My Order page from the footer, or email warmth@emberhome.co with your order number for a live status check."],
                ].map(([q, a]) => (
                  <details key={q} className="group py-5">
                    <summary className="cursor-pointer list-none text-[15px] font-medium text-ink marker:hidden">
                      <span className="flex items-center justify-between gap-4">
                        {q}
                        <span className="text-sub transition-transform group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="pt-3 text-[14px] leading-relaxed text-sub">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] bg-fog">
        <div className="mx-auto max-w-[1024px] px-5 py-10">
          <div className="flex flex-col gap-8 border-b border-black/[0.06] pb-8 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-ink">
                <Flame className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
              </span>
              <span className="text-[13px] font-semibold text-ink">Ember Home</span>
            </div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-2 sm:grid-cols-3">
              {[
                { label: "Shop", href: "#collection" },
                { label: "Reviews", href: "#reviews" },
                { label: "Shipping Policy", href: "#/shipping" },
                { label: "Refund Policy", href: "#/refunds" },
                { label: "Track My Order", href: "#/track" },
              ].map((l) => (
                <a key={l.label} href={l.href} className="text-[12px] text-sub transition-colors hover:text-ink">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-6 text-[12px] text-sub sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Ember Home. All rights reserved.</p>
            <p>
              Checkout completed securely with <span className="font-medium text-ink">WED2C</span> · Order support:{" "}
              <a href="mailto:warmth@emberhome.co" className="text-azure hover:underline">warmth@emberhome.co</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Sticky mobile sale bar — honest countdown, disappears near footer */}
      <AnimatePresence>
        {settings.saleEnabled && !countdown.expired && barVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="fixed inset-x-3 bottom-3 z-50 md:hidden"
          >
            <div className="flex items-center justify-between gap-3 rounded-full bg-[#d70015] py-2.5 pl-5 pr-2.5 text-white shadow-[0_16px_40px_-12px_rgba(215,0,21,0.55)]">
              <div className="leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">Flash Sale ends in</p>
                <p className="text-[15px] font-bold tabular-nums">
                  {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
                </p>
              </div>
              <a href="#collection" className="rounded-full bg-white px-5 py-2.5 text-[13px] font-bold text-[#d70015]">
                Shop now
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
