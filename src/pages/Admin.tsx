import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Flame,
  Plus,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  CheckCircle2,
  Package,
  Sigma,
  Eye,
  Star,
  MessageSquare,
  Settings,
  Info,
  BadgeCheck,
} from "lucide-react";
import { cn } from "../utils/cn";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct as deleteProductAPI,
  fetchReviews,
  createReview,
  deleteReviewAPI,
  fetchSettings,
  saveSettingsAPI,
  fmt,
  linkHost,
  discountPct,
  LOW_STOCK_THRESHOLD,
  type Product,
  type Review,
  type StoreSettings,
} from "../lib/store";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const PASSCODE = "351facebook";
const AUTH_KEY = "ember_admin_v1";

type Toast = { id: number; message: string };
type ProductForm = {
  name: string;
  price: string;
  compareAtPrice: string;
  imageUrl: string;
  wed2cLink: string;
  stock: string;
  description: string;
};
const EMPTY_PRODUCT: ProductForm = {
  name: "",
  price: "",
  compareAtPrice: "",
  imageUrl: "",
  wed2cLink: "",
  stock: "10",
  description: "",
};

type ReviewForm = { name: string; location: string; rating: string; productId: string; text: string; verified: boolean };
const EMPTY_REVIEW: ReviewForm = { name: "", location: "", rating: "5", productId: "", text: "", verified: true };

/* ------------------------------- Passcode gate ------------------------------ */

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (value === PASSCODE) {
      sessionStorage.setItem(AUTH_KEY, "1");
      onUnlock();
    } else {
      setError(true);
      setValue("");
      window.setTimeout(() => setError(false), 1400);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="w-full max-w-xs"
      >
        <form onSubmit={submit} className="space-y-3">
          <motion.input
            key={String(error)}
            initial={error ? { x: 0 } : false}
            animate={error ? { x: [0, -10, 10, -7, 7, 0] } : {}}
            transition={{ duration: 0.38 }}
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            autoComplete="off"
            className={cn(
              "w-full rounded-2xl border bg-fog px-5 py-4 text-[15px] text-ink outline-none transition-all",
              error
                ? "border-red-300 bg-red-50/60 ring-4 ring-red-400/10"
                : "border-black/[0.08] focus:border-azure focus:ring-4 focus:ring-azure/10"
            )}
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-white transition-opacity hover:opacity-80 active:scale-[0.98]"
          >
            Continue
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ------------------------------ Shared UI bits ----------------------------- */

const inputCls = (bad?: string) =>
  cn(
    "w-full rounded-xl border bg-white px-4 py-2.5 text-[14px] text-ink outline-none transition-all placeholder:text-sub/50",
    bad ? "border-red-400 ring-4 ring-red-500/10" : "border-line focus:border-azure focus:ring-4 focus:ring-azure/10"
  );
const labelCls = "mb-1.5 block text-[12px] font-semibold text-ink";

function ModalShell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/25 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] border border-black/[0.08] bg-white p-6 shadow-2xl sm:rounded-[24px] sm:p-7",
          wide ? "max-w-xl" : "max-w-lg"
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-fog text-sub transition-colors hover:bg-black/[0.07] hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function ConfirmModal({ title, message, confirmLabel, onCancel, onConfirm }: { title: string; message: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm" onClick={onCancel}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[24px] border border-black/[0.08] bg-white p-7 text-center shadow-2xl"
      >
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
          <Trash2 className="h-5 w-5 text-red-500" strokeWidth={2} />
        </span>
        <h3 className="mt-4 text-[17px] font-semibold text-ink">{title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-sub">{message}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="rounded-full border border-line py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-fog">Cancel</button>
          <button onClick={onConfirm} className="rounded-full bg-red-500 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-red-600">{confirmLabel}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-3">
      <span className={cn("relative h-7 w-12 rounded-full transition-colors duration-300", checked ? "bg-[#34c759]" : "bg-black/[0.15]")}>
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-300", checked ? "left-[22px]" : "left-0.5")} />
      </span>
      <span className="text-[14px] font-medium text-ink">{label}</span>
    </button>
  );
}

/* --------------------------------- Dashboard -------------------------------- */

type Tab = "products" | "reviews" | "settings";

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "1");
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({ saleEnabled: true, saleEnd: new Date().toISOString() });
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [editingReview, setEditingReview] = useState<Review | "new" | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [settingsDraft, setSettingsDraft] = useState<StoreSettings>({ saleEnabled: true, saleEnd: new Date().toISOString() });

  const reload = () => {
    Promise.all([fetchProducts(), fetchReviews(), fetchSettings()])
      .then(([p, r, s]) => { setProducts(p); setReviews(r); setSettings(s); setSettingsDraft(s); })
      .catch(() => {});
  };

  useEffect(() => { reload(); }, []);

  const toast = (message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };

  const stats = useMemo(() => {
    const sum = products.reduce((a, p) => a + p.price, 0);
    return { total: products.length, sum, low: products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length };
  }, [products]);

  if (!authed) return <Gate onUnlock={() => setAuthed(true)} />;

  /* --- product save/delete --- */
  const saveProduct = async (form: ProductForm) => {
    const base = {
      name: form.name.trim(),
      price: Number(Number(form.price).toFixed(2)),
      compareAtPrice: form.compareAtPrice.trim() ? Number(Number(form.compareAtPrice).toFixed(2)) : null,
      imageUrl: form.imageUrl.trim(),
      wed2cLink: form.wed2cLink.trim(),
      stock: Math.max(0, Math.round(Number(form.stock) || 0)),
      description: form.description.trim(),
    };
    if (editing === "new") {
      await createProduct(base);
      toast("Product added to your store");
    } else if (editing) {
      await updateProduct(editing.id, base);
      toast("Product updated");
    } else return;
    setEditing(null);
    reload();
  };

  const handleDeleteProduct = async () => {
    if (!deleting) return;
    await deleteProductAPI(deleting.id);
    toast(`"${deleting.name}" deleted`);
    setDeleting(null);
    reload();
  };

  /* --- reviews save/delete --- */
  const saveReview = async (form: ReviewForm) => {
    const base = {
      name: form.name.trim(),
      location: form.location.trim(),
      rating: Math.min(5, Math.max(1, Math.round(Number(form.rating) || 5))),
      productId: form.productId,
      text: form.text.trim(),
      verified: form.verified,
    };
    if (editingReview === "new") {
      await createReview(base);
      toast("Review published");
    } else if (editingReview) {
      // For simplicity: delete old + create new
      await deleteReviewAPI(editingReview.id);
      await createReview(base);
      toast("Review updated");
    } else return;
    setEditingReview(null);
    reload();
  };

  const handleDeleteReview = async () => {
    if (!deletingReview) return;
    await deleteReviewAPI(deletingReview.id);
    toast("Review removed");
    setDeletingReview(null);
    reload();
  };

  /* --- settings --- */
  const persistSettings = async (s: StoreSettings) => {
    await saveSettingsAPI(s);
    setSettings(s);
    setSettingsDraft(s);
    toast("Store settings saved");
  };

  const handleReset = () => {
    setConfirmReset(false);
    toast("Use the seed endpoint to reset data");
  };

  const tabs: { id: Tab; label: string; icon: typeof Package; count?: number }[] = [
    { id: "products", label: "Products", icon: Package, count: products.length },
    { id: "reviews", label: "Reviews", icon: MessageSquare, count: reviews.length },
    { id: "settings", label: "Flash Sale", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-fog/60 text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-black/[0.08] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink">
              <Flame className="h-4 w-4 text-white" strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-ink">Admin Dashboard</p>
              <p className="text-[11px] text-sub">Ember Home · WED2C Store</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <a href="#/" className="hidden items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-[12px] font-medium text-ink transition-colors hover:border-ink sm:inline-flex">
              <ExternalLink className="h-3.5 w-3.5" /> View Store
            </a>
            <button
              onClick={() => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); }}
              className="rounded-full px-4 py-1.5 text-[12px] font-medium text-sub transition-colors hover:text-ink"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-full border border-black/[0.08] bg-white p-1">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200",
                  tab === id ? "bg-ink text-white shadow-sm" : "text-sub hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {label}
                {count !== undefined && (
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", tab === id ? "bg-white/20" : "bg-black/[0.07]")}>{count}</span>
                )}
              </button>
            ))}
          </div>
          {tab === "products" && (
            <button onClick={() => setEditing("new")} className="inline-flex items-center gap-1.5 rounded-full bg-azure px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-azure-hover active:scale-[0.98]">
              <Plus className="h-4 w-4" strokeWidth={2.4} /> Add Product
            </button>
          )}
          {tab === "reviews" && (
            <button onClick={() => setEditingReview("new")} className="inline-flex items-center gap-1.5 rounded-full bg-azure px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-azure-hover active:scale-[0.98]">
              <Plus className="h-4 w-4" strokeWidth={2.4} /> Add Review
            </button>
          )}
        </div>

        {/* ============================= PRODUCTS TAB ============================= */}
        {tab === "products" && (
          <>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Total products", value: String(stats.total) },
                { label: "Catalog value", value: fmt(stats.sum) },
                { label: `Low stock (≤ ${LOW_STOCK_THRESHOLD})`, value: String(stats.low), warn: stats.low > 0 },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-black/[0.08] bg-white px-5 py-4">
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", s.warn ? "bg-red-50" : "bg-fog")}>
                    <Sigma className={cn("h-5 w-5", s.warn ? "text-red-500" : "text-ink/70")} strokeWidth={1.8} />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[19px] font-semibold tracking-[-0.01em] text-ink">{s.value}</p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-sub">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
              {products.length === 0 && <EmptyState onAdd={() => setEditing("new")} />}
              {products.map((p) => {
                const pct = discountPct(p);
                return (
                  <div key={p.id} className="flex flex-col gap-4 border-b border-black/[0.05] p-4 last:border-0 sm:p-5 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-fog">
                        <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <p className="text-[14px] font-semibold text-ink">{p.name}</p>
                          <span className="text-[13px] font-medium text-ink">{fmt(p.price)}</span>
                          {pct !== null && <span className="rounded-full bg-[#d70015]/10 px-2 py-0.5 text-[10px] font-bold text-[#d70015]">−{pct}% · was {fmt(p.compareAtPrice!)}</span>}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[12px] text-sub">{p.description}</p>
                        <a href={p.wed2cLink} target="_blank" rel="noopener sponsored" className="mt-0.5 inline-block text-[11px] text-azure hover:underline">
                          {linkHost(p.wed2cLink)}
                        </a>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-3 md:justify-end">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-[11px] font-bold",
                          p.stock <= 0 ? "bg-black/[0.08] text-sub" : p.stock <= LOW_STOCK_THRESHOLD ? "bg-[#d70015]/10 text-[#d70015]" : "bg-[#248a3d]/10 text-[#248a3d]"
                        )}
                      >
                        {p.stock <= 0 ? "Sold out" : `${p.stock} in stock`}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(p)} className="inline-flex items-center gap-1 rounded-full bg-fog px-3.5 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-black/[0.07]">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button onClick={() => setDeleting(p)} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3.5 py-1.5 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-100">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ============================= REVIEWS TAB ============================== */}
        {tab === "reviews" && (
          <>
            <div className="mt-6 flex gap-3 rounded-2xl border border-azure/20 bg-azure/[0.06] px-5 py-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-azure" strokeWidth={2} />
              <p className="text-[13px] leading-relaxed text-ink/80">
                Publish only <span className="font-semibold text-ink">genuine customer reviews</span> — e.g. feedback
                emailed by real buyers. Fabricated reviews violate FTC rules (16 CFR §465, fines up to ~$51k each)
                and PayPal/Stripe terms, and are the #1 reason dropshipping stores lose their payment processing.
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
              {reviews.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-fog">
                    <MessageSquare className="h-6 w-6 text-sub" strokeWidth={1.7} />
                  </span>
                  <p className="mt-4 text-[15px] font-semibold text-ink">No reviews yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-sub">
                    When your first customers email feedback, add it here — it will appear in the store's review
                    section with a verified badge.
                  </p>
                </div>
              )}
              {reviews.map((r) => (
                <div key={r.id} className="flex flex-col gap-3 border-b border-black/[0.05] p-5 last:border-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-[2px]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-[#ff9f0a] text-[#ff9f0a]" : "fill-black/[0.08] text-black/[0.08]")} strokeWidth={1} />
                        ))}
                      </span>
                      <p className="text-[13px] font-semibold text-ink">
                        {r.name} <span className="font-normal text-sub">· {r.location}</span>
                      </p>
                      {r.verified && (
                        <span className="flex items-center gap-1 rounded-full bg-[#248a3d]/10 px-2 py-0.5 text-[10px] font-bold text-[#248a3d]">
                          <BadgeCheck className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-2 max-w-2xl text-[13px] leading-relaxed text-sub">"{r.text}"</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => setEditingReview(r)} className="inline-flex items-center gap-1 rounded-full bg-fog px-3.5 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-black/[0.07]">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => setDeletingReview(r)} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3.5 py-1.5 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-100">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ============================= SETTINGS TAB ============================= */}
        {tab === "settings" && (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-black/[0.08] bg-white p-6 sm:p-7">
              <h2 className="flex items-center gap-2 text-[16px] font-semibold text-ink">
                <Flame className="h-5 w-5 text-[#d70015]" /> Flash Sale Banner
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-sub">
                The red banner and sticky mobile countdown are tied to one real end date. It never resets on refresh —
                when it hits zero, the banner quietly disappears.
              </p>

              <div className="mt-5 space-y-5">
                <Toggle
                  checked={settingsDraft.saleEnabled}
                  onChange={(v) => setSettingsDraft((s) => ({ ...s, saleEnabled: v }))}
                  label="Show flash-sale banner"
                />
                <div>
                  <label className={labelCls}>Sale ends at</label>
                  <input
                    type="datetime-local"
                    className={inputCls()}
                    value={isoToLocalInput(settingsDraft.saleEnd)}
                    onChange={(e) => {
                      const d = new Date(e.target.value);
                      if (!Number.isNaN(d.getTime())) setSettingsDraft((s) => ({ ...s, saleEnd: d.toISOString() }));
                    }}
                  />
                  <p className="mt-1.5 text-[11px] text-sub">
                    Currently set to: <span className="font-medium text-ink">{new Date(settings.saleEnd).toLocaleString()}</span>
                  </p>
                </div>
                <button
                  onClick={() => persistSettings(settingsDraft)}
                  className="rounded-full bg-azure px-6 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-azure-hover active:scale-[0.98]"
                >
                  Save Settings
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-black/[0.08] bg-white p-6 sm:p-7">
                <h3 className="text-[15px] font-semibold text-ink">Honest-conversion playbook</h3>
                <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-sub">
                  <li className="flex gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#248a3d]" /> Crossed-out prices must be real former prices — keep a screenshot of the old price.</li>
                  <li className="flex gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#248a3d]" /> Stock numbers come from your actual WED2C inventory — update them weekly.</li>
                  <li className="flex gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#248a3d]" /> Only display security seals you actually hold. "SSL-secured checkout via WED2C" is fine because it's true.</li>
                  <li className="flex gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#248a3d]" /> Ask every buyer for a review by email — real five-star reviews out-convert fake ones.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-black/[0.08] bg-white p-6 sm:p-7">
                <h3 className="text-[15px] font-semibold text-ink">Export catalog</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-sub">
                  Copy your full product list as code. Paste it into <code className="rounded bg-fog px-1.5 py-0.5 text-[11px] font-semibold text-ink">src/lib/store.ts</code> → <code className="rounded bg-fog px-1.5 py-0.5 text-[11px] font-semibold text-ink">SEED_PRODUCTS</code>, rebuild, and every device will see your catalog — no localStorage needed.
                </p>
                <button
                  onClick={() => {
                    const code = JSON.stringify(products, null, 2);
                    navigator.clipboard.writeText(code).then(
                      () => toast("Catalog JSON copied to clipboard"),
                      () => toast("Copy failed — check browser permissions")
                    );
                  }}
                  className="mt-4 rounded-full border border-line bg-white px-5 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-fog"
                >
                  Copy catalog JSON
                </button>
              </div>
              <div className="rounded-2xl border border-black/[0.08] bg-white p-6 sm:p-7">
                <h3 className="text-[15px] font-semibold text-ink">Danger zone</h3>
                <p className="mt-1.5 text-[13px] text-sub">Restore the original 6-product demo catalog and default sale settings.</p>
                <button onClick={() => setConfirmReset(true)} className="mt-4 rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-100">
                  Reset Demo Data
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {editing !== null && <ProductFormModal initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={saveProduct} />}
        {editingReview !== null && (
          <ReviewFormModal
            initial={editingReview === "new" ? null : editingReview}
            products={products}
            onClose={() => setEditingReview(null)}
            onSave={saveReview}
          />
        )}
        {deleting && (
          <ConfirmModal
            title={`Delete "${deleting.name}"?`}
            message="This removes the product from your storefront immediately."
            confirmLabel="Delete"
            onCancel={() => setDeleting(null)}
            onConfirm={handleDeleteProduct}
          />
        )}
        {deletingReview && (
          <ConfirmModal
            title="Remove this review?"
            message={`The review from ${deletingReview.name} will no longer appear on the storefront.`}
            confirmLabel="Remove"
            onCancel={() => setDeletingReview(null)}
            onConfirm={handleDeleteReview}
          />
        )}
        {confirmReset && (
          <ConfirmModal
            title="Reset the catalog?"
            message="All products and settings return to the 6-product demo state."
            confirmLabel="Reset"
            onCancel={() => setConfirmReset(false)}
            onConfirm={handleReset}
          />
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-black/[0.08] bg-white px-5 py-3 text-[13px] font-medium text-ink shadow-[0_16px_40px_-12px_rgba(0,0,0,0.25)]"
            >
              <CheckCircle2 className="h-5 w-5 text-green-500" strokeWidth={2} />
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* --------------------------- Product form (modal) --------------------------- */

function ProductFormModal({ initial, onClose, onSave }: { initial: Product | null; onClose: () => void; onSave: (f: ProductForm) => void }) {
  const [form, setForm] = useState<ProductForm>(
    initial
      ? {
          name: initial.name,
          price: String(initial.price),
          compareAtPrice: initial.compareAtPrice != null ? String(initial.compareAtPrice) : "",
          imageUrl: initial.imageUrl,
          wed2cLink: initial.wed2cLink,
          stock: String(initial.stock),
          description: initial.description,
        }
      : EMPTY_PRODUCT
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ProductForm, string>>>({});
  const set = (k: keyof ProductForm) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Product name is required.";
    const price = Number(form.price);
    if (!form.price || !Number.isFinite(price) || price <= 0) next.price = "Enter a valid price above 0.";
    if (form.compareAtPrice.trim()) {
      const cap = Number(form.compareAtPrice);
      if (!Number.isFinite(cap) || cap <= 0) next.compareAtPrice = "Enter a valid amount or leave blank.";
      else if (cap <= price) next.compareAtPrice = "Compare-at price must be higher than the sale price.";
    }
    if (!form.imageUrl.trim()) next.imageUrl = "Image URL is required.";
    else if (!/^(https?:\/\/|\/)/.test(form.imageUrl.trim())) next.imageUrl = "Must start with http(s):// or /";
    if (!/^https?:\/\//.test(form.wed2cLink.trim())) next.wed2cLink = "Must be a full https:// WED2C link.";
    const stock = Number(form.stock);
    if (!Number.isFinite(stock) || stock < 0) next.stock = "Enter 0 or more units.";
    if (!form.description.trim()) next.description = "Description is required.";
    setErrors(next);
    if (Object.keys(next).length === 0) onSave(form);
  };

  return (
    <ModalShell title={initial ? "Edit Product" : "Add New Product"} onClose={onClose} wide>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <div>
          <label className={labelCls}>Product Name</label>
          <input className={inputCls(errors.name)} value={form.name} onChange={set("name")} placeholder="Aurora Table Lamp" />
          {errors.name && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelCls}>Sale Price</label>
            <input className={inputCls(errors.price)} value={form.price} onChange={set("price")} placeholder="59.00" type="number" step="0.01" min="0" />
            {errors.price && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.price}</p>}
          </div>
          <div>
            <label className={labelCls}>Compare-at Price</label>
            <input className={inputCls(errors.compareAtPrice)} value={form.compareAtPrice} onChange={set("compareAtPrice")} placeholder="84.00" type="number" step="0.01" min="0" />
            {errors.compareAtPrice ? (
              <p className="mt-1 text-[11px] font-medium text-red-500">{errors.compareAtPrice}</p>
            ) : (
              <p className="mt-1 text-[10px] leading-snug text-sub">Must be a real former price (FTC rule).</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Stock</label>
            <input className={inputCls(errors.stock)} value={form.stock} onChange={set("stock")} type="number" step="1" min="0" />
            {errors.stock ? (
              <p className="mt-1 text-[11px] font-medium text-red-500">{errors.stock}</p>
            ) : (
              <p className="mt-1 text-[10px] leading-snug text-sub">≤ {LOW_STOCK_THRESHOLD} shows "Only X left".</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Preview</label>
            <div className="flex h-[46px] items-center justify-center overflow-hidden rounded-xl border border-black/[0.08] bg-fog">
              {form.imageUrl ? <img src={form.imageUrl} alt="Preview" className="h-full w-full object-cover" /> : <Eye className="h-4 w-4 text-sub/50" />}
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls}>Image URL</label>
          <input className={inputCls(errors.imageUrl)} value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://… or /images/product.jpg" />
          {errors.imageUrl && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.imageUrl}</p>}
        </div>

        <div>
          <label className={labelCls}>WED2C Affiliate Link</label>
          <input className={inputCls(errors.wed2cLink)} value={form.wed2cLink} onChange={set("wed2cLink")} placeholder="https://www.wed2c.com/p/…" />
          {errors.wed2cLink && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.wed2cLink}</p>}
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea className={cn(inputCls(errors.description), "min-h-[88px] resize-none")} value={form.description} onChange={set("description")} placeholder="One or two sentences that sell the feeling, not just the spec sheet." />
          {errors.description && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.description}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-[14px] font-medium text-sub transition-colors hover:text-ink">Cancel</button>
          <button type="submit" className="rounded-full bg-azure px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-azure-hover active:scale-[0.98]">
            {initial ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ---------------------------- Review form (modal) --------------------------- */

function ReviewFormModal({ initial, products, onClose, onSave }: { initial: Review | null; products: Product[]; onClose: () => void; onSave: (f: ReviewForm) => void }) {
  const [form, setForm] = useState<ReviewForm>(
    initial
      ? { name: initial.name, location: initial.location, rating: String(initial.rating), productId: initial.productId, text: initial.text, verified: initial.verified }
      : { ...EMPTY_REVIEW, productId: products[0]?.id ?? "" }
  );
  const [error, setError] = useState("");
  const set = (k: keyof ReviewForm) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim() || !form.text.trim()) {
      setError("Name, location and review text are all required.");
      return;
    }
    onSave(form);
  };

  return (
    <ModalShell title={initial ? "Edit Review" : "Add Customer Review"} onClose={onClose}>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Customer Name</label>
            <input className={inputCls()} value={form.name} onChange={set("name")} placeholder="Brenda S." />
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <input className={inputCls()} value={form.location} onChange={set("location")} placeholder="Columbus, OH" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Rating</label>
            <select className={inputCls()} value={form.rating} onChange={set("rating")}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Product</label>
            <select className={inputCls()} value={form.productId} onChange={set("productId")}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Review Text (paste the customer's real words)</label>
          <textarea className={cn(inputCls(), "min-h-[96px] resize-none")} value={form.text} onChange={set("text")} placeholder="What did the customer actually write to you?" />
        </div>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, verified: !f.verified }))}
          className="flex items-center gap-2.5 text-left"
        >
          <span className={cn("flex h-5 w-5 items-center justify-center rounded-md border transition-colors", form.verified ? "border-azure bg-azure text-white" : "border-line bg-white")}>
            {form.verified && <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.6} />}
          </span>
          <span className="text-[13px] text-ink/80">
            Verified purchase — <span className="text-sub">tick only if this person really bought the product.</span>
          </span>
        </button>
        {error && <p className="text-[12px] font-medium text-red-500">{error}</p>}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-[14px] font-medium text-sub transition-colors hover:text-ink">Cancel</button>
          <button type="submit" className="rounded-full bg-azure px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-azure-hover active:scale-[0.98]">
            {initial ? "Save Changes" : "Publish Review"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="px-6 py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-fog">
        <Package className="h-6 w-6 text-sub" strokeWidth={1.7} />
      </span>
      <p className="mt-4 text-[15px] font-semibold text-ink">No products yet</p>
      <p className="mx-auto mt-1 max-w-xs text-[13px] leading-relaxed text-sub">Add your first WED2C product and it will appear on the storefront right away.</p>
      <button onClick={onAdd} className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-azure px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-azure-hover">
        <Plus className="h-4 w-4" strokeWidth={2.4} /> Add Product
      </button>
    </div>
  );
}

function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
