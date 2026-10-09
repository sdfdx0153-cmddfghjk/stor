const mongoose = require("mongoose");

/**
 * Reviews must come from real post-purchase customers.
 * Publishing fabricated reviews violates FTC rules (16 CFR §465) and
 * payment-processor terms — use this model for genuine feedback only.
 */
const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    location: { type: String, required: true, trim: true, maxlength: 60 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true, maxlength: 600 },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    // Only set true when the reviewer actually bought the product.
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
