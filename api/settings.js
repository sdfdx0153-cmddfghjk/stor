const { pool, init } = require("./_db");

module.exports = async function handler(req, res) {
  await init();

  if (req.method === "GET") {
    const { rows } = await pool.query("SELECT key,value FROM settings");
    const obj = {};
    for (const r of rows) obj[r.key] = r.value;
    return res.json(obj);
  }

  if (req.method === "PUT") {
    const { saleEnabled, saleEnd } = req.body;
    await pool.query(`INSERT INTO settings(key,value) VALUES('saleEnabled',$1) ON CONFLICT(key) DO UPDATE SET value=$1`, [String(saleEnabled)]);
    if (saleEnd) await pool.query(`INSERT INTO settings(key,value) VALUES('saleEnd',$1) ON CONFLICT(key) DO UPDATE SET value=$1`, [saleEnd]);
    return res.json({ ok: true });
  }

  res.status(405).json({ error: "Method not allowed" });
};
