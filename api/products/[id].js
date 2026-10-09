const { pool, init } = require("../_db");

module.exports = async function handler(req, res) {
  await init();
  const { id } = req.query;

  if (req.method === "PUT") {
    const { name, price, compareAtPrice, imageUrl, description, wed2cLink, stock } = req.body;
    await pool.query(
      `UPDATE products SET name=$1,price=$2,compare_at=$3,image_url=$4,description=$5,wed2c_link=$6,stock=$7 WHERE id=$8`,
      [name, price, compareAtPrice||null, imageUrl, description, wed2cLink, Math.max(0,stock||0), id]
    );
    return res.json({ ok: true });
  }

  if (req.method === "DELETE") {
    await pool.query("DELETE FROM products WHERE id=$1", [id]);
    return res.json({ ok: true });
  }

  res.status(405).json({ error: "Method not allowed" });
};
