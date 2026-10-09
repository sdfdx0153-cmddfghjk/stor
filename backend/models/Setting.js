const mongoose = require("mongoose");

/** Simple key/value store for shop-wide settings (flash-sale config, etc.). */
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, default: "" },
});

module.exports = mongoose.model("Setting", settingSchema);

/** Helper: read all settings into a plain object with defaults. */
module.exports.getAll = async function getAll() {
  const defaults = {
    saleEnabled: "true",
    // Default: next Sunday 23:59 — a real calendar date, never a reset gimmick.
    saleEnd: (() => {
      const d = new Date();
      d.setHours(23, 59, 0, 0);
      d.setDate(d.getDate() + (((7 - d.getDay()) % 7) || 7));
      return d.toISOString();
    })(),
  };
  const docs = await module.exports.find().lean();
  const out = { ...defaults };
  for (const d of docs) out[d.key] = d.value;
  return out;
};

/** Helper: upsert a single key. */
module.exports.setValue = async function setValue(key, value) {
  await module.exports.findOneAndUpdate({ key }, { value: String(value) }, { upsert: true });
};
