const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

let initialized = false;

async function init() {
  if (initialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, price NUMERIC(10,2) NOT NULL,
      compare_at NUMERIC(10,2), image_url TEXT DEFAULT '', description TEXT DEFAULT '',
      wed2c_link TEXT DEFAULT '', stock INT DEFAULT 10, created_at BIGINT DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY, product_id TEXT, name TEXT NOT NULL, location TEXT DEFAULT '',
      rating INT DEFAULT 5, text TEXT DEFAULT '', verified BOOLEAN DEFAULT FALSE, created_at BIGINT DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT DEFAULT ''
    );
  `);
  await pool.query(`INSERT INTO settings(key,value) VALUES('saleEnabled','true') ON CONFLICT DO NOTHING`);
  const d = new Date(); d.setHours(23,59,0,0); d.setDate(d.getDate()+(((7-d.getDay())%7)||7));
  await pool.query(`INSERT INTO settings(key,value) VALUES('saleEnd',$1) ON CONFLICT DO NOTHING`, [d.toISOString()]);

  const { rowCount } = await pool.query("SELECT 1 FROM products LIMIT 1");
  if (rowCount === 0) {
    const now = Date.now();
    const seeds = [
      ["s1","Flame Aroma Diffuser — Obsidian",59,84,"/images/color-black.jpg","Ultrasonic mist wrapped in a lifelike amber flame. 260 ml tank, 12-hour runtime, auto shut-off.","https://www.wed2c.com/p/flame-aroma-diffuser-obsidian",3],
      ["s2","Sunset Projection Lamp",42,69,"/images/sunset-lamp.jpg","Golden hour on demand. Rotating aluminum head paints any wall in warm sunset gradients.","https://www.wed2c.com/p/sunset-projection-lamp",5],
      ["s3","Flame Aroma Diffuser — Cloud",59,84,"/images/color-white.jpg","Flagship in soft-touch matte white. Seven flame hues, sleep mode, all-night tank.","https://www.wed2c.com/p/flame-aroma-diffuser-cloud",12],
      ["s4","Galaxy Star Projector",48,74,"/images/galaxy-projector.jpg","Turn any ceiling into a slow-drifting nebula. 21 modes, Bluetooth speaker, sleep timer.","https://www.wed2c.com/p/galaxy-star-projector",15],
      ["s5","Smart Mug Warmer",35,49,"/images/mug-warmer.jpg","Your coffee, held at exactly 55°C until the last sip. Touch controls, 8-hour auto-off.","https://www.wed2c.com/p/smart-mug-warmer-55c",4],
      ["s6","Flame Aroma Diffuser — Stone",59,84,"/images/color-grey.jpg","Brushed mineral finish that disappears into calm interiors. Same flame, same hush.","https://www.wed2c.com/p/flame-aroma-diffuser-stone",9],
    ];
    for (let i = 0; i < seeds.length; i++) {
      const [id,name,price,cap,img,desc,link,stock] = seeds[i];
      await pool.query(
        `INSERT INTO products(id,name,price,compare_at,image_url,description,wed2c_link,stock,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id,name,price,cap,img,desc,link,stock,now-i*1000]
      );
    }
  }
  initialized = true;
}

function uid() { return "p_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8); }

function toProduct(r) {
  return { id:r.id, name:r.name, price:Number(r.price), compareAtPrice:r.compare_at?Number(r.compare_at):null,
    imageUrl:r.image_url, description:r.description, wed2cLink:r.wed2c_link, stock:r.stock, createdAt:Number(r.created_at) };
}

function toReview(r) {
  return { id:r.id, productId:r.product_id||"", name:r.name, location:r.location,
    rating:r.rating, text:r.text, verified:r.verified, createdAt:Number(r.created_at) };
}

module.exports = { pool, init, uid, toProduct, toReview };
