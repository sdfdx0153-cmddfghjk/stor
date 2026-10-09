const { init } = require("./_db");

module.exports = async function handler(req, res) {
  await init();
  res.json({ ok: true });
};
