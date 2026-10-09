/**
 * Seed the database with the 6-product starter catalog + default sale settings.
 * Usage:  node seed.js   (or: npm run seed)
 * Reviews are intentionally NOT seeded — publish only real customer feedback.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Setting = require("./models/Setting");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ember_home_store";

const seed = [
  {
    name: "Flame Aroma Diffuser — Obsidian",
    price: 59,
    compareAtPrice: 84,
    imageUrl: "/images/color-black.jpg",
    description:
      "Ultrasonic mist wrapped in a lifelike amber flame. 260 ml tank, 12-hour runtime, auto shut-off — quieter than a whisper.",
    wed2cLink: "https://www.wed2c.com/p/flame-aroma-diffuser-obsidian",
    stock: 3,
  },
  {
    name: "Sunset Projection Lamp",
    price: 42,
    compareAtPrice: 69,
    imageUrl: "/images/sunset-lamp.jpg",
    description:
      "Golden hour on demand. A rotating aluminum head paints any wall in warm sunset gradients.",
    wed2cLink: "https://www.wed2c.com/p/sunset-projection-lamp",
    stock: 5,
  },
  {
    name: "Flame Aroma Diffuser — Cloud",
    price: 59,
    compareAtPrice: 84,
    imageUrl: "/images/color-white.jpg",
    description:
      "Our flagship in soft-touch matte white. Seven flame hues, sleep mode, all-night tank.",
    wed2cLink: "https://www.wed2c.com/p/flame-aroma-diffuser-cloud",
    stock: 12,
  },
  {
    name: "Galaxy Star Projector",
    price: 48,
    compareAtPrice: 74,
    imageUrl: "/images/galaxy-projector.jpg",
    description:
      "Turn any ceiling into a slow-drifting nebula. 21 modes, Bluetooth speaker, sleep timer.",
    wed2cLink: "https://www.wed2c.com/p/galaxy-star-projector",
    stock: 15,
  },
  {
    name: "Smart Mug Warmer",
    price: 35,
    compareAtPrice: 49,
    imageUrl: "/images/mug-warmer.jpg",
    description:
      "Your coffee, held at exactly 55°C until the last sip. Touch controls, 8-hour auto-off.",
    wed2cLink: "https://www.wed2c.com/p/smart-mug-warmer-55c",
    stock: 4,
  },
  {
    name: "Flame Aroma Diffuser — Stone",
    price: 59,
    compareAtPrice: 84,
    imageUrl: "/images/color-grey.jpg",
    description:
      "The brushed mineral finish that disappears into calm interiors. Same flame, same hush.",
    wed2cLink: "https://www.wed2c.com/p/flame-aroma-diffuser-stone",
    stock: 9,
  },
];

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    await Product.deleteMany({});
    await Product.insertMany(seed);

    const d = new Date();
    d.setHours(23, 59, 0, 0);
    d.setDate(d.getDate() + (((7 - d.getDay()) % 7) || 7));
    await Setting.setValue("saleEnabled", "true");
    await Setting.setValue("saleEnd", d.toISOString());

    console.log(`Seeded ${seed.length} products + flash-sale ends ${d.toLocaleString()}`);
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
