const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 120,
    },
    price: {
      type: Number,
      required: [true, "Sale price is required"],
      min: [0, "Price cannot be negative"],
    },
    // Must reflect a genuine former selling price (FTC advertising rules).
    compareAtPrice: {
      type: Number,
      default: null,
      min: [0, "Compare-at price cannot be negative"],
      validate: {
        validator: function (v) {
          return v == null || v > this.price;
        },
        message: "Compare-at price must be higher than the sale price.",
      },
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 500,
    },
    wed2cLink: {
      type: String,
      required: [true, "WED2C affiliate link is required"],
      trim: true,
    },
    // Your real inventory count — the storefront renders "Only X left" from this.
    stock: {
      type: Number,
      default: 10,
      min: [0, "Stock cannot be negative"],
    },
  },
  { timestamps: true }
);

productSchema.virtual("discountPct").get(function () {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return null;
  return Math.round((1 - this.price / this.compareAtPrice) * 100);
});

productSchema.set("toObject", { virtuals: true });
productSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
