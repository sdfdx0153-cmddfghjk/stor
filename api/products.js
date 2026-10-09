const { pool, init, uid, toProduct } = require("./_db");

module.exports = async function handler(req, res) {
  await init();

  if (req.method === "GET") {
    const { rows } = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
    return res.json(rows.map(toProduct));
  }

  if (req.method === "POST") {
    const { name, price, compareAtPrice, imageUrl, description, wed2cLink, stock } = req.body;
    const id = uid();
    await pool.query(
      `INSERT INTO products(id,name,price,compare_at,image_url,description,wed2c_link,stock,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, name, price, compareAtPrice||null, imageUrl, description, wed2cLink, Math.max(0,stock||0), Date.now()]
    );
    return res.json({ id });
  }

  res.status(405).json({ error: "Method not allowed" });
};
