export type Product = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string;
  description: string;
  wed2cLink: string;
  stock: number;
  createdAt: number;
};

export type Review = {
  id: string;
  productId: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  verified: boolean;
  createdAt: number;
};

export type StoreSettings = {
  saleEnabled: boolean;
  saleEnd: string;
};

export const LOW_STOCK_THRESHOLD = 5;

/* ========================== API (PostgreSQL) ============================== */

const API = "/api";

// --- Products ---

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API}/products`);
  return res.json();
}

export async function createProduct(p: Omit<Product, "id" | "createdAt">): Promise<{ id: string }> {
  const res = await fetch(`${API}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  return res.json();
}

export async function updateProduct(id: string, p: Partial<Product>): Promise<void> {
  await fetch(`${API}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await fetch(`${API}/products/${id}`, { method: "DELETE" });
}

// --- Reviews ---

export async function fetchReviews(): Promise<Review[]> {
  const res = await fetch(`${API}/reviews`);
  return res.json();
}

export async function createReview(r: Omit<Review, "id" | "createdAt">): Promise<{ id: string }> {
  const res = await fetch(`${API}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(r),
  });
  return res.json();
}

export async function deleteReviewAPI(id: string): Promise<void> {
  await fetch(`${API}/reviews/${id}`, { method: "DELETE" });
}

// --- Settings ---

export async function fetchSettings(): Promise<StoreSettings> {
  const res = await fetch(`${API}/settings`);
  const raw = await res.json();
  return {
    saleEnabled: raw.saleEnabled === "true" || raw.saleEnabled === true,
    saleEnd: raw.saleEnd || new Date().toISOString(),
  };
}

export async function saveSettingsAPI(s: StoreSettings): Promise<void> {
  await fetch(`${API}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ saleEnabled: s.saleEnabled, saleEnd: s.saleEnd }),
  });
}

// --- Seed ---

export async function seedDB(): Promise<void> {
  await fetch(`${API}/seed`, { method: "POST" });
}

/* ================================ Helpers ================================= */

export function uid(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export function fmt(price: number): string {
  return usd.format(price);
}

export function discountPct(p: Product): number | null {
  if (!p.compareAtPrice || p.compareAtPrice <= p.price) return null;
  return Math.round((1 - p.price / p.compareAtPrice) * 100);
}

export function linkHost(url: string): string {
  try { return new URL(url).host; }
  catch { return url.length > 34 ? `${url.slice(0, 34)}…` : url; }
}
