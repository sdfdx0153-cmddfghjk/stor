require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Review = require("./models/Review");
const Setting = require("./models/Setting");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ember_home_store";

/* ------------------------------- Middleware ------------------------------- */
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/**
 * Basic-Auth guard for the /admin area.
 * Credentials come from .env (ADMIN_USER / ADMIN_PASS), defaulting to admin / 351facebook.
 */
function adminAuth(req, res, next) {
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASS || "351facebook";

  const header = req.headers.authorization || "";
  const [scheme, encoded] = header.split(" ");

  if (scheme === "Basic" && encoded) {
    const [user, pass] = Buffer.from(encoded, "base64").toString().split(":");
    if (user === expectedUser && pass === expectedPass) return next();
  }

  res.set("WWW-Authenticate", 'Basic realm="Admin Area"');
  return res.status(401).send("Authentication required.");
}

/* ----------------------------- Policy page content ----------------------------- */
const POLICIES = {
  shipping: {
    title: "Shipping Policy",
    sections: [
      ["Processing time", "Orders are handed to our fulfillment partner WED2C within 1–2 business days. You'll receive an email confirmation the moment your order is processed."],
      ["Delivery estimates", "Standard tracked shipping to the United States takes 5–12 business days. Delivery is free on every order."],
      ["Tracking", "Every parcel ships with a tracking number, emailed automatically at dispatch."],
      ["Delays & lost parcels", "If your order hasn't arrived within 30 days of dispatch, contact us — we'll re-ship or refund in full, your choice."],
    ],
  },
  refunds: {
    title: "Refund Policy",
    sections: [
      ["30-day home trial", "Live with your purchase for 30 days. If it doesn't earn its place, email us with your order number and we'll start a return — no restocking fees."],
      ["Refund timing", "Refunds are issued to your original payment method within 5–10 business days of the return being received."],
      ["Damaged or wrong items", "Send a photo within 14 days of delivery and we replace or refund immediately."],
    ],
  },
  track: {
    title: "Track My Order",
    sections: [
      ["Where is my tracking number?", "It's emailed automatically when your order dispatches (1–2 business days after purchase). Check spam/promotions for a message from WED2C."],
      ["Tracking hasn't updated", "International parcels commonly pause 3–5 days between hub scans — normal. No movement for 10+ days? Contact us."],
      ["Ask a human", "Email warmth@emberhome.co with your order number for a live status check."],
    ],
  },
};

/* -------------------------- Storefront (public) --------------------------- */

// GET '/' — all products, reviews and sale settings
app.get("/", async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean({ virtuals: true });
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    const settings = await Setting.getAll();
    res.render("index", { products, reviews, settings });
  } catch (err) {
    next(err);
  }
});

// GET '/shipping' | '/refunds' | '/track'
app.get("/:page(shipping|refunds|track)", (req, res) => {
  res.render("page", { page: POLICIES[req.params.page], current: req.params.page });
});

/* --------------------------- Admin (protected) ---------------------------- */

// GET '/admin' — manage products, reviews and flash-sale settings
app.get("/admin", adminAuth, async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean({ virtuals: true });
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    const settings = await Setting.getAll();
    res.render("admin", { products, reviews, settings, message: req.query.msg || null });
  } catch (err) {
    next(err);
  }
});

// POST '/admin/add' — save a new product
app.post("/admin/add", adminAuth, async (req, res, next) => {
  try {
    const { name, price, compareAtPrice, imageUrl, description, wed2cLink, stock } = req.body;
    await Product.create({
      name,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      imageUrl,
      description,
      wed2cLink,
      stock: Math.max(0, Math.round(Number(stock) || 0)),
    });
    res.redirect("/admin?msg=Product+added");
  } catch (err) {
    next(err);
  }
});

// POST '/admin/edit/:id' — update a product
app.post("/admin/edit/:id", async (req, res, next) => {
  try {
    const { name, price, compareAtPrice, imageUrl, description, wed2cLink, stock } = req.body;
    await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        imageUrl,
        description,
        wed2cLink,
        stock: Math.max(0, Math.round(Number(stock) || 0)),
      },
      { runValidators: true }
    );
    res.redirect("/admin?msg=Product+updated");
  } catch (err) {
    next(err);
  }
});

// POST '/admin/delete/:id' — remove a product
app.post("/admin/delete/:id", adminAuth, async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin?msg=Product+deleted");
  } catch (err) {
    next(err);
  }
});

// POST '/admin/reviews/add' — publish a GENUINE customer review
app.post("/admin/reviews/add", async (req, res, next) => {
  try {
    const { name, location, rating, text, productId, verified } = req.body;
    await Review.create({
      name,
      location,
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      text,
      productId: productId || null,
      verified: verified === "on",
    });
    res.redirect("/admin?msg=Review+published");
  } catch (err) {
    next(err);
  }
});

// POST '/admin/reviews/delete/:id'
app.post("/admin/reviews/delete/:id", adminAuth, async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.redirect("/admin?msg=Review+removed");
  } catch (err) {
    next(err);
  }
});

// POST '/admin/settings' — flash-sale configuration
app.post("/admin/settings", adminAuth, async (req, res, next) => {
  try {
    await Setting.setValue("saleEnabled", req.body.saleEnabled === "on" ? "true" : "false");
    const end = new Date(req.body.saleEnd);
    if (!Number.isNaN(end.getTime())) await Setting.setValue("saleEnd", end.toISOString());
    res.redirect("/admin?msg=Settings+saved");
  } catch (err) {
    next(err);
  }
});

/* ------------------------------ Error handling ----------------------------- */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong. Please try again.");
});

/* --------------------------------- Startup -------------------------------- */
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected:", MONGODB_URI);
    app.listen(PORT, () => console.log(`Store running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
