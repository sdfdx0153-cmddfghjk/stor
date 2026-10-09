const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const PORT = process.env.PORT || 3000;

// Your Aiven PostgreSQL — works from any device that hits this server
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const app = express();
app.use(express.json());

/* -------------------------------- DB init -------------------------------- */

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      price      NUMERIC(10,2) NOT NULL,
      compare_at NUMERIC(10,2),
      image_url  TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      wed2c_link TEXT NOT NULL DEFAULT '',
      stock      INT NOT NULL DEFAULT 10,
      created_at BIGINT NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id         TEXT PRIMARY KEY,
      product_id TEXT,
      name       TEXT NOT NULL,
      location   TEXT NOT NULL DEFAULT '',
      rating     INT NOT NULL DEFAULT 5,
      text       TEXT NOT NULL DEFAULT '',
      verified   BOOLEAN NOT NULL DEFAULT FALSE,
      created_at BIGINT NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
  `);

  // Default settings
  await pool.query(`INSERT INTO settings(key,value) VALUES('saleEnabled','true') ON CONFLICT DO NOTHING`);
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  d.setDate(d.getDate() + (((7 - d.getDay()) % 7) || 7));
  await pool.query(`INSERT INTO settings(key,value) VALUES('saleEnd',$1) ON CONFLICT DO NOTHING`, [d.toISOString()]);

  // Seed products if empty
  const { rowCount } = await pool.query("SELECT 1 FROM products LIMIT 1");
  if (rowCount === 0) {
    const now = Date.now();
    const seeds = [
      ["seed-1", "Flame Aroma Diffuser — Obsidian", 59, 84, "/images/color-black.jpg", "Ultrasonic mist wrapped in a lifelike amber flame. 260 ml tank, 12-hour runtime, auto shut-off.", "https://www.wed2c.com/p/flame-aroma-diffuser-obsidian", 3],
      ["seed-2", "Sunset Projection Lamp", 42, 69, "/images/sunset-lamp.jpg", "Golden hour on demand. A rotating aluminum head paints any wall in warm sunset gradients.", "https://www.wed2c.com/p/sunset-projection-lamp", 5],
      ["seed-3", "Flame Aroma Diffuser — Cloud", 59, 84, "/images/color-white.jpg", "Our flagship in soft-touch matte white. Seven flame hues, sleep mode, all-night tank.", "https://www.wed2c.com/p/flame-aroma-diffuser-cloud", 12],
      ["seed-4", "Galaxy Star Projector", 48, 74, "/images/galaxy-projector.jpg", "Turn any ceiling into a slow-drifting nebula. 21 modes, Bluetooth speaker, sleep timer.", "https://www.wed2c.com/p/galaxy-star-projector", 15],
      ["seed-5", "Smart Mug Warmer", 35, 49, "/images/mug-warmer.jpg", "Your coffee, held at exactly 55°C until the last sip. Touch controls, 8-hour auto-off.", "https://www.wed2c.com/p/smart-mug-warmer-55c", 4],
      ["seed-6", "Flame Aroma Diffuser — Stone", 59, 84, "/images/color-grey.jpg", "Brushed mineral finish that disappears into calm interiors. Same flame, same hush.", "https://www.wed2c.com/p/flame-aroma-diffuser-stone", 9],
    ];
    for (let i = 0; i < seeds.length; i++) {
      const [id, name, price, cap, img, desc, link, stock] = seeds[i];
      await pool.query(
        `INSERT INTO products(id,name,price,compare_at,image_url,description,wed2c_link,stock,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, name, price, cap, img, desc, link, stock, now - i * 1000]
      );
    }
    console.log("Seeded 6 products");
  }
  console.log("DB ready");
}

/* ----------------------------- Helpers ----------------------------------- */

function uid() {
  return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function toProduct(r) {
  return {
    id: r.id, name: r.name, price: Number(r.price),
    compareAtPrice: r.compare_at ? Number(r.compare_at) : null,
    imageUrl: r.image_url, description: r.description,
    wed2cLink: r.wed2c_link, stock: r.stock, createdAt: Number(r.created_at),
  };
}

function toReview(r) {
  return {
    id: r.id, productId: r.product_id || "", name: r.name,
    location: r.location, rating: r.rating, text: r.text,
    verified: r.verified, createdAt: Number(r.created_at),
  };
}

/* ----------------------------- API ---------------------------------------- */

app.get("/api/products", async (_, res) => {
  const { rows } = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
  res.json(rows.map(toProduct));
});

app.post("/api/products", async (req, res) => {
  const { name, price, compareAtPrice, imageUrl, description, wed2cLink, stock } = req.body;
  const id = uid();
  await pool.query(
    `INSERT INTO products(id,name,price,compare_at,image_url,description,wed2c_link,stock,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, name, price, compareAtPrice || null, imageUrl, description, wed2cLink, Math.max(0, stock || 0), Date.now()]
  );
  res.json({ id });
});

app.put("/api/products/:id", async (req, res) => {
  const { name, price, compareAtPrice, imageUrl, description, wed2cLink, stock } = req.body;
  await pool.query(
    `UPDATE products SET name=$1,price=$2,compare_at=$3,image_url=$4,description=$5,wed2c_link=$6,stock=$7 WHERE id=$8`,
    [name, price, compareAtPrice || null, imageUrl, description, wed2cLink, Math.max(0, stock || 0), req.params.id]
  );
  res.json({ ok: true });
});

app.delete("/api/products/:id", async (req, res) => {
  await pool.query("DELETE FROM products WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

app.get("/api/reviews", async (_, res) => {
  const { rows } = await pool.query("SELECT * FROM reviews ORDER BY created_at DESC");
  res.json(rows.map(toReview));
});

app.post("/api/reviews", async (req, res) => {
  const { name, location, rating, productId, text, verified } = req.body;
  const id = uid();
  await pool.query(
    `INSERT INTO reviews(id,product_id,name,location,rating,text,verified,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, productId || null, name, location, Math.min(5, Math.max(1, rating || 5)), text, !!verified, Date.now()]
  );
  res.json({ id });
});

app.delete("/api/reviews/:id", async (req, res) => {
  await pool.query("DELETE FROM reviews WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

app.get("/api/settings", async (_, res) => {
  const { rows } = await pool.query("SELECT key,value FROM settings");
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  res.json(obj);
});

app.put("/api/settings", async (req, res) => {
  const { saleEnabled, saleEnd } = req.body;
  await pool.query(`INSERT INTO settings(key,value) VALUES('saleEnabled',$1) ON CONFLICT(key) DO UPDATE SET value=$1`, [String(saleEnabled)]);
  if (saleEnd) await pool.query(`INSERT INTO settings(key,value) VALUES('saleEnd',$1) ON CONFLICT(key) DO UPDATE SET value=$1`, [saleEnd]);
  res.json({ ok: true });
});

app.post("/api/seed", async (_, res) => {
  res.json({ ok: true }); // seed happens in initDB
});

/* ----------------------------- Static + SPA ------------------------------ */

app.use(express.static(path.join(__dirname, "dist")));
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (_, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

/* ----------------------------- Start ------------------------------------- */

// Vercel compatible export
if (process.env.NODE_ENV !== 'production') {
  initDB()
    .then(() => app.listen(PORT, () => console.log(`http://localhost:${PORT}`)))
    .catch((e) => { console.error(e); process.exit(1); });
} else {
  // Production (Vercel)
  initDB().catch(console.error);
}

module.exports = app;
