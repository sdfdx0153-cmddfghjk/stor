const { pool, init } = require("../_db");

module.exports = async function handler(req, res) {
  await init();
  const { id } = req.query;

  if (req.method === "DELETE") {
    await pool.query("DELETE FROM reviews WHERE id=$1", [id]);
    return res.json({ ok: true });
  }

  res.status(405).json({ error: "Method not allowed" });
};
