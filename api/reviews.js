const { pool, init, uid, toReview } = require("./_db");

module.exports = async function handler(req, res) {
  await init();

  if (req.method === "GET") {
    const { rows } = await pool.query("SELECT * FROM reviews ORDER BY created_at DESC");
    return res.json(rows.map(toReview));
  }

  if (req.method === "POST") {
    const { name, location, rating, productId, text, verified } = req.body;
    const id = uid();
    await pool.query(
      `INSERT INTO reviews(id,product_id,name,location,rating,text,verified,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, productId||null, name, location, Math.min(5,Math.max(1,rating||5)), text, !!verified, Date.now()]
    );
    return res.json({ id });
  }

  res.status(405).json({ error: "Method not allowed" });
};
